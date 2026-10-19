import type { RuntimeScope } from "../shared/RuntimeScope";
import type { RuntimeState, ScopedChangedPath } from "../shared/types";
import { validateResolvedRequest } from "../shared/validation";
import type { RequestDefinition, DataSourceDefinition } from "./types";
import type { DataEntry, DataSourceIdentity } from "./types";
import { inlineSourceId } from "./inlineRequest";
import { runtimeActions } from "../redux/runtimeActions";

/** Owns API policy/lifecycle for one scope; the environment graph finds resources. */
export class DataSourceManager {
  private readonly requests = new Map<string, AbortController>();
  private readonly requestDetails = new Map<string, RequestDefinition>();
  private readonly inline = new Map<
    string,
    { request: RequestDefinition; consumers: number }
  >();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private unregister: (() => void) | undefined;
  private started = false;
  private disposed = false;
  constructor(readonly runtimeScope: RuntimeScope) {}
  get scopeId() {
    return this.runtimeScope.scopeId;
  }
  get scope() {
    return this.runtimeScope.scope;
  }
  get instance() {
    return this.scopeId;
  }
  private get environment() {
    return this.runtimeScope.environment;
  }
  private get definitions() {
    return this.runtimeScope.dataSourceDefinitions;
  }
  private get active() {
    return !this.disposed && this.runtimeScope.active();
  }

  identity(sourceId: string): DataSourceIdentity {
    this.definition(sourceId);
    return { scopeId: this.scopeId, sourceId };
  }
  initialize() {
    if (this.disposed)
      throw new Error("Cannot initialize disposed datasources");
    if (!this.unregister) this.unregister = this.environment.register(this);
  }
  /** Controlled standalone-view bootstrap promotion must update ancestor addresses. */
  refreshDependencies() {
    if (!this.unregister || this.disposed) return;
    const previous = this.unregister;
    this.unregister = this.environment.register(this);
    previous();
  }
  start() {
    if (this.started || !this.active) return;
    this.started = true;
    const strategy =
      this.scope === "app"
        ? "onAppInit"
        : this.scope === "view"
          ? "onViewInit"
          : "onScopeInit";
    for (const [id, definition] of Object.entries(this.definitions)) {
      if (
        definition.load.strategy === strategy ||
        definition.load.strategy === "onScopeInit"
      )
        void this.load(id);
    }
  }
  dependenciesChanged(
    sourceIds: readonly string[],
    changes: readonly ScopedChangedPath[],
    previous: RuntimeState,
    next: RuntimeState,
  ) {
    if (!this.started || !this.active) return;
    for (const id of new Set(sourceIds)) {
      const definition = this.definition(id);
      const changed = definition.dependsOn?.some(
        (path) =>
          !Object.is(
            this.environment.resolver.resolve(path, {
              state: previous,
              scope: this.runtimeScope,
            }),
            this.environment.resolver.resolve(path, {
              state: next,
              scope: this.runtimeScope,
            }),
          ),
      );
      if (!changed || definition.load.reload !== "onDependencyChange") continue;
      const changedPaths = changes.map((change) => {
        const local = change.scopeId === this.scopeId;
        const root =
          change.scopeId === this.runtimeScope.applicationScopeId
            ? change.area === "state"
              ? "$appState"
              : "$appData"
            : local
              ? change.area === "state"
                ? "$state"
                : "$data"
              : change.area === "state"
                ? "$viewState"
                : "$viewData";
        return (root +
          (change.path.length
            ? "." + change.path.join(".")
            : "")) as import("../shared/types").StateExpression;
      });
      this.environment.diagnostics.trace(
        "dependency",
        `${id} dependency changed`,
        changedPaths.join(", "),
        {
          scope: this.scope,
          instance: this.scopeId,
          datasourceId: id,
          resource: this.identity(id),
          event: "dependencyChanged",
          changedPaths,
          scopedChangedPaths: changes,
        },
      );
      this.cancelPending(id);
      this.cancelRequest(id);
      const delay = definition.load.debounceMs ?? 0;
      if (delay > 0) {
        this.environment.diagnostics.trace(
          "lifecycle",
          `${id} reload debounced`,
          `${delay}ms`,
          {
            scope: this.scope,
            instance: this.scopeId,
            datasourceId: id,
            resource: this.identity(id),
            event: "debounced",
            debounceMs: delay,
          },
        );
        this.timers.set(
          id,
          setTimeout(() => {
            this.timers.delete(id);
            void this.load(id);
          }, delay),
        );
      } else void this.load(id);
    }
  }
  /** Node-local data leases use this SAME transport/status/cancellation pipeline. */
  acquireInline(request: RequestDefinition) {
    validateResolvedRequest(request, this.environment.requestPolicy);
    const id = inlineSourceId(request);
    if (!this.active) throw new Error("Datasource scope disposed");
    if (Object.hasOwn(this.definitions, id))
      throw new Error(
        "Inline datasource identity conflicts with a declared datasource",
      );
    let record = this.inline.get(id);
    if (!record) {
      record = { request: structuredClone(request), consumers: 0 };
      this.inline.set(id, record);
      this.dispatch(id, {
        status: "idle",
        loading: false,
        data: null,
        error: null,
      });
    }
    record.consumers++;
    const current = record;
    queueMicrotask(() => {
      if (
        this.inline.get(id) === current &&
        current.consumers &&
        this.active &&
        this.entry(id)?.status === "idle"
      )
        void this.load(id);
    });
    let released = false;
    return {
      id,
      release: () => {
        if (released) return;
        released = true;
        current.consumers--;
        queueMicrotask(() => {
          if (
            this.inline.get(id) !== current ||
            current.consumers ||
            !this.active
          )
            return;
          if (this.entry(id)?.loading) {
            this.cancelRequest(id);
            this.dispatch(id, {
              status: "idle",
              loading: false,
              data: null,
              error: null,
            });
          }
        });
      },
    };
  }
  /** Read-only tooling projection; runtime definitions remain owned by this manager. */
  listDefinitions(): Record<string, DataSourceDefinition> {
    return {
      ...this.definitions,
      ...Object.fromEntries(
        [...this.inline].map(([id, record]) => [
          id,
          {
            type: "api",
            request: record.request,
            load: { strategy: "manual" },
          } satisfies DataSourceDefinition,
        ]),
      ),
    };
  }

  private entry(id: string) {
    const state = this.environment.store.getState();
    return (
      this.scope === "app"
        ? state.appData
        : this.scope === "view"
          ? state.viewData
          : (state.fragments[this.scopeId]?.data ?? {})
    )[id];
  }
  private dispatch(id: string, entry: DataEntry) {
    if (this.active)
      this.environment.store.dispatch(
        runtimeActions.dataChanged({
          scope: this.scope,
          instance: this.scopeId,
          id,
          entry,
        }),
      );
  }
  private definition(id: string) {
    const inline = this.inline.get(id);
    const definition: DataSourceDefinition | undefined = inline
      ? {
          type: "api" as const,
          request: inline.request,
          load: { strategy: "manual" as const },
        }
      : Object.hasOwn(this.definitions, id)
        ? this.definitions[id]
        : undefined;
    if (!definition) throw new Error("Unknown datasource: " + id);
    return definition;
  }
  private cancelPending(id: string) {
    const timer = this.timers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(id);
  }
  private cancelRequest(id: string) {
    const controller = this.requests.get(id);
    if (controller && !controller.signal.aborted) {
      controller.abort();
      this.environment.diagnostics.trace(
        "lifecycle",
        `${id} cancelled`,
        undefined,
        {
          scope: this.scope,
          instance: this.scopeId,
          datasourceId: id,
          resource: this.identity(id),
          event: "cancelled",
          request: this.requestDetails.get(id),
        },
      );
    }
    this.requests.delete(id);
    this.requestDetails.delete(id);
  }
  async load(id: string): Promise<void> {
    const definition = this.definition(id);
    if (!this.active) return;
    this.cancelPending(id);
    this.cancelRequest(id);
    const controller = new AbortController();
    this.requests.set(id, controller);
    const previousData = this.entry(id)?.data ?? null;
    this.dispatch(id, {
      status: "loading",
      loading: true,
      data: previousData,
      error: null,
    });
    let request: RequestDefinition | undefined;
    try {
      if (
        controller.signal.aborted ||
        !this.active ||
        this.requests.get(id) !== controller
      )
        return;
      const context = {
        state: this.environment.store.getState(),
        scope: this.runtimeScope,
      };
      request =
        this.inline.get(id)?.request ??
        (this.environment.resolver.resolve(
          definition.request,
          context,
        ) as RequestDefinition);
      if (!this.inline.has(id))
        request.path = this.environment.resolver.resolvePath(
          request.path,
          context,
        );
      validateResolvedRequest(request, this.environment.requestPolicy);
      this.requestDetails.set(id, request);
      this.environment.diagnostics.trace(
        "request",
        `${request.method} ${request.path}`,
        JSON.stringify(request.query ?? {}),
        {
          scope: this.scope,
          instance: this.scopeId,
          datasourceId: id,
          resource: this.identity(id),
          event: "loading",
          request,
        },
      );
      const data = await this.environment.transport(request, controller.signal);
      if (
        this.requests.get(id) !== controller ||
        controller.signal.aborted ||
        !this.active
      )
        return;
      this.dispatch(id, {
        status: "success",
        loading: false,
        data,
        error: null,
      });
      this.environment.diagnostics.trace(
        "request",
        `${id} resolved`,
        "success",
        {
          scope: this.scope,
          instance: this.scopeId,
          datasourceId: id,
          resource: this.identity(id),
          event: "success",
          request,
        },
      );
    } catch (error) {
      if (
        controller.signal.aborted ||
        this.requests.get(id) !== controller ||
        !this.active
      )
        return;
      const message = error instanceof Error ? error.message : String(error);
      this.dispatch(id, {
        status: "error",
        loading: false,
        data: previousData,
        error: message,
      });
      this.environment.diagnostics.trace("error", `${id} failed`, message, {
        scope: this.scope,
        instance: this.scopeId,
        datasourceId: id,
        resource: this.identity(id),
        event: "error",
        request,
      });
    } finally {
      if (this.requests.get(id) === controller) {
        this.requests.delete(id);
        this.requestDetails.delete(id);
      }
    }
  }
  reload(id: string) {
    return this.load(id);
  }
  invalidate(id: string) {
    this.definition(id);
    if (!this.active) return;
    this.cancelPending(id);
    this.cancelRequest(id);
    this.dispatch(id, {
      status: "idle",
      loading: false,
      data: null,
      error: null,
    });
    this.environment.diagnostics.trace(
      "lifecycle",
      `${id} invalidated`,
      undefined,
      {
        scope: this.scope,
        instance: this.scopeId,
        datasourceId: id,
        resource: this.identity(id),
        event: "invalidated",
      },
    );
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unregister?.();
    this.unregister = undefined;
    for (const id of this.timers.keys()) this.cancelPending(id);
    for (const id of this.requests.keys()) this.cancelRequest(id);
    this.inline.clear();
  }
}
