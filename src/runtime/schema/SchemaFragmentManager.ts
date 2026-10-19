import type { RuntimeEnvironment } from '../shared/RuntimeEnvironment';
import type { ScopeDefinition, Scope, RequestDefinition, RuntimeState, TraceMetadata } from '../shared/types';
import type { LoadedSchemaDefinition } from '../fragment/types';
import type { DefinitionCachePolicy, FragmentKey, SchemaFragmentEntry, SchemaSource } from './types';
import { schemaFragmentSlice } from './schemaFragmentSlice';

type ValidateFragment = (schema: unknown) => asserts schema is LoadedSchemaDefinition;
/** JSON templates only. Live requests, validators and scopes never enter this map. */
interface CachedDefinition { owner: string; cache: DefinitionCachePolicy; schema: LoadedSchemaDefinition }
interface Acquisition {
  controller: AbortController;
  promise: Promise<void>;
  consumers: number;
  metadata: TraceMetadata;
  entry: SchemaFragmentEntry;
}
export interface PreparedSchemaRequest {
  id: string;
  entry: SchemaFragmentEntry;
  request?: RequestDefinition;
  error?: string;
}

/** Shared definition storage and separate transient lease/transport coordination. */
export class SchemaFragmentCache {
  readonly entries = new Map<string, CachedDefinition>();
  readonly requests = new Map<string, Acquisition>();
  applicationInstance = 'standalone';
  constructor(private readonly environment: RuntimeEnvironment) {}
  remove(id: string) {
    const acquisition = this.requests.get(id);
    acquisition?.controller.abort();
    if (acquisition?.entry.loading) this.environment.diagnostics.trace('lifecycle', 'Schema acquisition cancelled', undefined, {
      ...acquisition.metadata, event: 'cancelled',
    });
    this.requests.delete(id);
    this.entries.delete(id);
    this.environment.store.dispatch(schemaFragmentSlice.actions.removed(id));
  }
  clearView(instance: string) {
    const ids = new Set([
      ...[...this.entries].filter(([, entry]) => entry.owner === instance).map(([id]) => id),
      ...[...this.requests].filter(([, request]) => request.entry.owner === instance).map(([id]) => id),
      ...Object.entries(this.environment.store.getState().schemaFragments).filter(([, entry]) => entry.owner === instance).map(([id]) => id),
    ]);
    for (const id of ids) this.remove(id);
  }
  clear() {
    for (const id of new Set([...this.entries.keys(), ...this.requests.keys(), ...Object.keys(this.environment.store.getState().schemaFragments)])) this.remove(id);
  }
}

export class SchemaFragmentManager {
  private disposed = false;
  private releases = new Set<() => void>();
  private validators = new Map<string, ValidateFragment>();
  constructor(
    readonly definition: ScopeDefinition,
    readonly scope: Scope,
    readonly instance: string,
    private readonly environment: RuntimeEnvironment,
  ) {}
  /** Pure snapshot resolution: a changed request also changes identity without an explicit key. */
  prepare(source: SchemaSource, key: FragmentKey = null, state = this.environment.store.getState()): PreparedSchemaRequest {
    const named = typeof source === 'string';
    const definition = named ? this.definition.schemaSources?.[source] : source;
    if (!definition) throw new Error('Unknown schema source: ' + source);
    const policy = 'load' in definition ? definition.load : definition;
    const cache = policy.definitionCache ?? policy.cache ?? 'none';
    const parent = this.environment.getScope(this.instance);
    if (cache === 'view' && !parent?.viewScopeId) throw new Error('Schema source has no owning view for view cache');
    const owner = cache === 'application' ? parent?.applicationScopeId ?? this.environment.schemaCache.applicationInstance
      : cache === 'view' ? parent!.viewScopeId! : this.instance;
    let request: RequestDefinition | undefined; let error: string | undefined;
    try {
      const context = { state, scope: parent, scopeId: this.scope === 'fragment' ? this.instance : undefined };
      request = this.environment.resolver.resolve({ ...definition.request, method: definition.request.method ?? 'GET' }, context) as RequestDefinition;
      request.path = this.environment.resolver.resolvePath(definition.request.path, context);
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    const sourceName = named ? source : 'inline';
    // Resource identity may share immutable JSON. Outlet activation separately includes parent + mount identity.
    const id = JSON.stringify([owner, this.definition.id, sourceName, definition, key, request ?? error]);
    return { id, request, error, entry: {
      source: sourceName, key, scope: this.scope, owner, cache, requestingScopeId: this.instance,
      status: 'loading', loading: true, schema: null, error: null,
      requestPath: request?.path ?? definition.request.path,
      requestIdentity: request ? JSON.stringify(request) : undefined,
    } };
  }
  identity(source: SchemaSource, key: FragmentKey = null, state?: RuntimeState): string { return this.prepare(source, key, state).id; }
  acquire(source: SchemaSource, key: FragmentKey, validate: ValidateFragment, prepared = this.prepare(source, key)) {
    if (this.disposed || !this.environment.getScope(this.instance)?.active()) throw new Error('Schema scope disposed');
    this.validators.set(JSON.stringify(source), validate);
    const { id } = prepared;
    const repository = this.environment.schemaCache;
    let acquisition = repository.requests.get(id);
    if (!acquisition) {
      const controller = new AbortController();
      const cached = repository.entries.get(id);
      acquisition = { controller, promise: Promise.resolve(), consumers: 0,
        metadata: { scope: this.scope, instance: this.instance, request: prepared.request,
          schemaResource: { id, source: prepared.entry.source, key, cache: prepared.entry.cache, owner: prepared.entry.owner } },
        entry: cached
        ? { ...prepared.entry, status: 'success', loading: false, schema: cached.schema }
        : prepared.entry };
      repository.requests.set(id, acquisition);
      const current = acquisition;
      const publish = () => {
        if (repository.requests.get(id) === current && !controller.signal.aborted)
          this.environment.store.dispatch(schemaFragmentSlice.actions.changed({ id, entry: { ...current.entry } }));
      };
      if (!repository.entries.has(id)) publish();
      // A replay/shared acquire can reclaim the lease before any network work begins.
      current.promise = Promise.resolve().then(async () => {
        if (controller.signal.aborted) return;
        try {
          if (prepared.error || !prepared.request) throw new Error(prepared.error ?? 'Unresolved schema request');
          const cached = repository.entries.get(id);
          this.environment.diagnostics.trace('request', cached ? 'Schema definition cache hit' : 'Schema definition loading', undefined, {
            ...current.metadata, event: cached ? 'cacheHit' : 'loading',
          });
          const value = cached?.schema ?? await this.environment.transport(prepared.request, controller.signal);
          if (controller.signal.aborted || repository.requests.get(id) !== current) return;
          validate(value);
          // Separate JSON snapshot; initial-state templates must never alias mutable live state.
          const schema = cached?.schema ?? structuredClone(value);
          if (current.entry.cache !== 'none') repository.entries.set(id, { owner: current.entry.owner, cache: current.entry.cache, schema });
          current.entry = { ...current.entry, status: 'success', loading: false, schema, error: null };
          this.environment.diagnostics.trace('request', 'Schema definition resolved', undefined, { ...current.metadata, event: 'success' });
        } catch (error) {
          if (controller.signal.aborted || repository.requests.get(id) !== current) return;
          current.entry = { ...current.entry, status: 'error', loading: false, schema: null, error: error instanceof Error ? error.message : String(error) };
        }
        if (current.entry.error) this.environment.diagnostics.trace('error', 'Schema definition failed', current.entry.error, { ...current.metadata, event: 'error' });
        publish();
      });
    }
    acquisition.consumers++;
    const current = acquisition;
    let released = false;
    const release = () => {
      if (released) return;
      released = true; this.releases.delete(release); current.consumers--;
      queueMicrotask(() => {
        if (repository.requests.get(id) !== current || current.consumers) return;
        if (current.entry.loading || current.entry.cache === 'none') repository.remove(id);
        else repository.requests.delete(id);
      });
    };
    this.releases.add(release);
    return { id, promise: current.promise, release };
  }
  reload(source: SchemaSource, key: FragmentKey = null, validate = this.validators.get(JSON.stringify(source)), prepared = this.prepare(source, key)) {
    if (!validate) throw new Error('Activate the schema source before reloading it');
    this.environment.schemaCache.remove(prepared.id);
    return this.acquire(source, key, validate, prepared);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const release of [...this.releases]) release();
    this.validators.clear();
    this.environment.schemaCache.clearView(this.instance);
    if (this.scope === 'app') this.environment.schemaCache.clear();
  }
}


