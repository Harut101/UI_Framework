import { defaultRequestPolicy, type RequestPolicy } from "../datasource/requestPolicy";
import { DependencyGraph } from "../datasource/DependencyGraph";
import { RuntimeScope } from "./RuntimeScope";
import { SchemaFragmentCache } from "../schema/SchemaFragmentManager";
import { createRuntimeStore } from "../redux/createRuntimeStore";
import { ExpressionResolver } from "../binding/ExpressionResolver";
import { Diagnostics } from "./Diagnostics";
import { createActionRegistry } from "../actions/createActionRegistry";
import type { DataSourceManager } from "../datasource/DataSourceManager";
import { createFetchTransport, type ApiTransport } from "../datasource/api";

export class RuntimeEnvironment {
  readonly store;
  readonly schemaCache: SchemaFragmentCache;
  readonly resolver = new ExpressionResolver();
  readonly diagnostics = new Diagnostics();
  readonly actionRegistry = createActionRegistry();
  readonly dependencyGraph = new DependencyGraph();
  private readonly managers = new Map<
    string,
    { manager: DataSourceManager; token: object }
  >();
  private readonly scopeRecords = new Map<
    string,
    {
      scope: RuntimeScope;
      adoptParent: (parent: RuntimeScope) => void;
    }
  >();
  private application: RuntimeScope | null = null;
  private view: RuntimeScope | null = null;
  private bootstrapApplication: RuntimeScope | null = null;

  readonly transport: ApiTransport;
  constructor(
    readonly navigate: (to: string) => void,
    readonly notify: (
      message: string,
      tone: "success" | "error" | "info",
    ) => void,
    transport?: ApiTransport,
    readonly requestPolicy: RequestPolicy = defaultRequestPolicy,
  ) {
    this.transport = transport ?? createFetchTransport(requestPolicy);
    this.store = createRuntimeStore((changedPaths, previous, current) => {
      const grouped = new Map<string, string[]>();
      for (const target of this.dependencyGraph.affected(changedPaths)) {
        const sources = grouped.get(target.scopeId) ?? [];
        sources.push(target.sourceId);
        grouped.set(target.scopeId, sources);
      }
      for (const [scopeId, sourceIds] of grouped)
        this.managers
          .get(scopeId)
          ?.manager.dependenciesChanged(
            sourceIds,
            changedPaths,
            previous,
            current,
          );
    }).store;
    this.schemaCache = new SchemaFragmentCache(this);
  }
  get applicationScope() {
    return this.application;
  }
  get viewScope() {
    return this.view;
  }
  getScope(scopeId: string) {
    return this.scopeRecords.get(scopeId)?.scope;
  }
  listScopes(): readonly RuntimeScope[] {
    return [...this.scopeRecords.values()].map((record) => record.scope);
  }
  childScopes(parent: RuntimeScope) {
    return this.listScopes().filter((scope) => scope.parentScope === parent);
  }

  /** Compatibility for existing isolated ViewRuntime consumers/tests. No second store. */
  ensureApplicationScope(): RuntimeScope {
    if (this.application) return this.application;
    this.bootstrapApplication = new RuntimeScope(
      {
        id: "runtime.application",
        initialState: {},
        dataSources: {},
        actions: {},
      },
      "application",
      this,
    );
    return this.bootstrapApplication;
  }

  /** Internal registration; only bootstrap promotion may change established parentage. */
  registerScope(
    scope: RuntimeScope,
    adoptParent: (parent: RuntimeScope) => void,
  ) {
    if (this.scopeRecords.has(scope.scopeId))
      throw new Error("Scope already registered");
    if (
      scope.type === "application" &&
      this.application &&
      this.application !== this.bootstrapApplication
    )
      throw new Error("The environment already has an application scope");
    const previousApplication = this.application;
    const previousView = this.view;
    this.scopeRecords.set(scope.scopeId, { scope, adoptParent });
    if (scope.type === "application") {
      this.application = scope;
      // Preserve the old standalone-view constructor API if the real app arrives later.
      if (
        previousApplication &&
        previousApplication === this.bootstrapApplication
      ) {
        for (const record of this.scopeRecords.values())
          if (record.scope.parentScope === previousApplication)
            record.adoptParent(scope);
        for (const { manager } of this.managers.values())
          if (
            manager.runtimeScope !== scope &&
            manager.runtimeScope.applicationScopeId === scope.scopeId
          )
            manager.refreshDependencies();
        this.bootstrapApplication = null;
        previousApplication.dispose();
      }
    }
    if (scope.type === "view") {
      this.view = scope;
      previousView?.dispose();
    }
  }
  unregisterScope(scope: RuntimeScope) {
    this.scopeRecords.delete(scope.scopeId);
    if (this.application === scope) this.application = null;
    if (this.view === scope) this.view = null;
    if (this.bootstrapApplication === scope) this.bootstrapApplication = null;
  }
  register(manager: DataSourceManager) {
    const existing = this.managers.get(manager.scopeId);
    if (existing && existing.manager !== manager)
      throw new Error("Datasource scope already registered");
    const unregister = this.dependencyGraph.registerScope(
      manager.runtimeScope,
      manager.runtimeScope.dataSourceDefinitions,
    );
    const token = {};
    this.managers.set(manager.scopeId, { manager, token });
    return () => {
      unregister();
      if (this.managers.get(manager.scopeId)?.token === token)
        this.managers.delete(manager.scopeId);
    };
  }
}
