import { SchemaFragmentManager } from "../schema/SchemaFragmentManager";
import { runtimeActions } from "../redux/runtimeActions";
import { ActionEngine } from "../actions/ActionEngine";
import { DataSourceManager } from "../datasource/DataSourceManager";
import type { RuntimeEnvironment } from "./RuntimeEnvironment";
import type {
  DataEntry,
  RuntimeScopeType,
  Scope,
  ScopeId,
  RuntimeScopeDefinition,
  ScopeOrigin,
} from "./types";

let nextScopeId = 0;

/** One lifecycle implementation; resource engines remain composed services. */
export class RuntimeScope {
  readonly scopeId: ScopeId;
  readonly scope: Scope;
  readonly schemaFragments: SchemaFragmentManager;
  readonly dataSources: DataSourceManager;
  readonly actionEngine: ActionEngine;
  private parent: RuntimeScope | null;
  private readonly controller = new AbortController();
  private initialized = false;
  private disposed = false;

  constructor(
    readonly definition: RuntimeScopeDefinition,
    readonly type: RuntimeScopeType,
    readonly environment: RuntimeEnvironment,
    parentScope?: RuntimeScope,
    readonly origin?: Readonly<ScopeOrigin>,
  ) {
    if (type === "application" && parentScope)
      throw new Error("Application scopes cannot have a parent");
    if (type === "fragment" && !parentScope)
      throw new Error("Fragment scopes require a parent");
    this.parent =
      parentScope ??
      (type === "view" ? environment.ensureApplicationScope() : null);
    if (
      this.parent &&
      (this.parent.environment !== environment || !this.parent.active())
    )
      throw new Error("Parent scope must be active in the same environment");
    if (type === "view" && this.parent?.type !== "application")
      throw new Error("View scopes require an application parent");
    this.scopeId = `${definition.id}:${++nextScopeId}`;
    this.scope = type === "application" ? "app" : type;
    this.schemaFragments = new SchemaFragmentManager(
      definition,
      this.scope,
      this.scopeId,
      environment,
    );
    this.dataSources = new DataSourceManager(this);
    this.actionEngine = new ActionEngine(
      {
        runtimeScope: this,
        scope: this.scope,
        instance: this.scopeId,
        store: environment.store,
        resolver: environment.resolver,
        dataSources: this.dataSources,
        diagnostics: environment.diagnostics,
        transport: environment.transport,
        navigate: environment.navigate,
        notify: environment.notify,
        active: () => this.active(),
        signal: this.controller.signal,
      },
      environment.actionRegistry,
    );
    this.initialize();
  }

  /** Compatibility name used by existing action payloads and inspector IDs. */
  get instance() {
    return this.scopeId;
  }
  get parentScope() {
    return this.parent;
  }
  get parentScopeId() {
    return this.parent?.scopeId ?? null;
  }
  get applicationScope(): RuntimeScope {
    return this.type === "application" ? this : this.parent!.applicationScope;
  }
  get applicationScopeId() {
    return this.applicationScope.scopeId;
  }
  get viewScope(): RuntimeScope | null {
    return this.type === "view" ? this : (this.parent?.viewScope ?? null);
  }
  get viewScopeId(): string | null {
    return this.viewScope?.scopeId ?? null;
  }
  get stateDefinition() {
    return this.definition.initialState;
  }
  get dataSourceDefinitions() {
    return this.definition.dataSources;
  }
  get actionDefinitions() {
    return this.definition.actions;
  }
  get signal() {
    return this.controller.signal;
  }

  /** Constructors preserve eager initialization; explicit calls are idempotent. */
  initialize(): this {
    if (this.disposed) throw new Error("Cannot initialize a disposed scope");
    if (this.initialized) return this;
    const initialState = structuredClone(this.stateDefinition);
    const data = Object.fromEntries(
      Object.keys(this.dataSourceDefinitions).map((id) => [
        id,
        {
          status: "idle",
          loading: false,
          data: null,
          error: null,
        } satisfies DataEntry,
      ]),
    );
    try {
      // Validate/register dependencies before publishing this scope or replacing a view.
      this.dataSources.initialize();
      this.environment.registerScope(this, (parent) => {
        this.parent = parent;
      });
    } catch (error) {
      this.dataSources.dispose();
      this.controller.abort();
      this.disposed = true;
      throw error;
    }
    this.initialized = true;
    if (this.type === "application")
      this.environment.schemaCache.applicationInstance = this.scopeId;
    this.environment.store.dispatch(
      runtimeActions.initialize({
        scope: this.scope,
        instance: this.scopeId,
        initialState,
        data,
      }),
    );
    this.environment.diagnostics.trace(
      "lifecycle",
      `${this.scope} initialized`,
      this.scopeId,
    );
    return this;
  }

  active(): boolean {
    if (
      !this.initialized ||
      this.disposed ||
      (this.parent && !this.parent.active())
    )
      return false;
    const state = this.environment.store.getState();
    if (this.scope === "app") return state.applicationInstance === this.scopeId;
    if (this.scope === "view") return state.viewInstance === this.scopeId;
    return Object.hasOwn(state.fragments, this.scopeId);
  }

  start() {
    if (this.active()) this.dataSources.start();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
    for (const child of this.environment.childScopes(this)) child.dispose();
    this.dataSources.dispose();
    this.schemaFragments.dispose();
    this.environment.unregisterScope(this);
    this.environment.store.dispatch(
      runtimeActions.disposeScope({
        scope: this.scope,
        instance: this.scopeId,
      }),
    );
    this.environment.diagnostics.trace(
      "lifecycle",
      `${this.scope} disposed`,
      this.scopeId,
    );
  }
}
