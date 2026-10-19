import { pathParts } from "../binding/ExpressionResolver";
import { resolveScopePath } from "../shared/scopeAddress";
import type {
  Scope,
  ScopeAddressContext,
  ScopedChangedPath,
  StateExpression,
} from "../shared/types";
import type {
  DataSourceDefinition,
  DataSourceIdentity,
  DependencyRegistration,
} from "./types";

const key = (target: DataSourceIdentity) =>
  JSON.stringify([target.scopeId, target.sourceId]);
function overlaps(a: readonly string[], b: readonly string[]) {
  return a
    .slice(0, Math.min(a.length, b.length))
    .every((part, index) => part === b[index]);
}

/** One scope-qualified graph; it only finds resources and never drives React. */
export class DependencyGraph {
  private readonly entries = new Map<string, DependencyRegistration>();
  private readonly legacyContext: ScopeAddressContext;

  /** Optional definition projection preserves static schema validation/unit callers. */
  constructor(
    definitions?: Record<string, DataSourceDefinition>,
    scope: Scope = "view",
  ) {
    this.legacyContext = {
      scopeId:
        scope === "app"
          ? "validation.application"
          : scope === "view"
            ? "validation.view"
            : "validation.fragment",
      applicationScopeId: "validation.application",
      viewScopeId: scope === "app" ? null : "validation.view",
    };
    if (definitions) this.registerScope(this.legacyContext, definitions);
  }

  registerScope(
    scope: ScopeAddressContext,
    definitions: Record<string, DataSourceDefinition>,
  ): () => void {
    const registrations = Object.entries(definitions).map(
      ([sourceId, definition]) => {
        pathParts(sourceId);
        const paths = (definition.dependsOn ?? []).flatMap((expression) => {
          if (
            !/^\$(appState|appData|viewState|viewData|state|data)(\.|$)/.test(
              expression,
            )
          )
            throw new Error("Invalid dependency: " + expression);
          const address = resolveScopePath(expression, scope);
          return address ? [address] : [];
        });
        return { target: { scopeId: scope.scopeId, sourceId }, paths };
      },
    );
    return this.register(registrations);
  }

  /** Candidate validation is atomic; replaced handles cannot remove newer edges. */
  register(registrations: readonly DependencyRegistration[]): () => void {
    const candidate = new Map(this.entries);
    const added = new Map<string, DependencyRegistration>();
    for (const entry of registrations) {
      if (!entry.target.scopeId || !entry.target.sourceId)
        throw new Error("Invalid datasource identity");
      const id = key(entry.target);
      if (added.has(id))
        throw new Error("Duplicate datasource registration: " + id);
      const copy = {
        target: { ...entry.target },
        paths: entry.paths.map((path) => ({ ...path, path: [...path.path] })),
      };
      for (const path of copy.paths)
        if (path.path.length) pathParts(path.path.join("."));
      candidate.set(id, copy);
      added.set(id, copy);
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id))
        throw new Error("Circular datasource dependency at " + id);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const path of candidate.get(id)?.paths ?? []) {
        if (path.area !== "data") continue;
        for (const [otherId, other] of candidate) {
          if (
            other.target.scopeId === path.scopeId &&
            (!path.path.length || other.target.sourceId === path.path[0])
          )
            visit(otherId);
        }
      }
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of candidate.keys()) visit(id);
    for (const [id, entry] of added) this.entries.set(id, entry);
    return () => {
      for (const [id, entry] of added)
        if (this.entries.get(id) === entry) this.entries.delete(id);
    };
  }

  registrations(): readonly DependencyRegistration[] {
    return [...this.entries.values()].map((entry) => ({
      target: { ...entry.target },
      paths: entry.paths.map((path) => ({ ...path, path: [...path.path] })),
    }));
  }

  affected(changes: readonly ScopedChangedPath[]): DataSourceIdentity[];
  affected(changes: readonly StateExpression[]): string[];
  affected(
    changes: readonly ScopedChangedPath[] | readonly StateExpression[],
  ): DataSourceIdentity[] | string[] {
    const legacy = typeof changes[0] === "string";
    const paths: readonly ScopedChangedPath[] = legacy
      ? (changes as readonly StateExpression[]).flatMap((expression) => {
          const address = resolveScopePath(expression, this.legacyContext);
          return address ? [address] : [];
        })
      : (changes as readonly ScopedChangedPath[]);
    const affected = [...this.entries.values()]
      .filter((entry) =>
        entry.paths.some((path) =>
          paths.some(
            (change) =>
              path.scopeId === change.scopeId &&
              path.area === change.area &&
              overlaps(path.path, change.path),
          ),
        ),
      )
      .map((entry) => ({ ...entry.target }));
    return legacy
      ? [...new Set(affected.map((target) => target.sourceId))]
      : affected;
  }
}
