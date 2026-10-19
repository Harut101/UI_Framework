import { FragmentRuntimeHost } from '../fragment/FragmentRuntimeHost';
import { normalizeLoadedFragment, validateLoadedFragment } from '../fragment/normalizeFragmentDefinition';
import type { LoadedSchemaDefinition } from '../fragment/types';
import type { RuntimeScope } from '../shared/RuntimeScope';
import { FragmentRenderBoundary } from './FragmentRenderBoundary';
import { createContext, useContext, useEffect, useId, useMemo, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { NodeDefinitionContext, RuntimeContext, RuntimeNode } from '../rendering/RuntimeNode';
import type { ComponentRegistry } from '../rendering/ComponentRegistry';
import type { RuntimeState } from '../shared/types';
import type { FragmentKey, SchemaFragmentEntry } from './types';
const AcquisitionContext = createContext<readonly string[]>([]);
function LoadedFragment({ schema, parent, registry, requestIdentity, visible, entry, retained }: {
  schema: LoadedSchemaDefinition; parent: RuntimeScope; registry: ComponentRegistry; requestIdentity: string; visible: boolean; entry: SchemaFragmentEntry; retained: boolean;
}) {
  const ancestry = useContext(AcquisitionContext);
  const nextAncestry = useMemo(() => [...ancestry, requestIdentity], [ancestry, requestIdentity]);
  const normalized = useMemo(() => normalizeLoadedFragment(schema, parent.definition, registry), [schema, parent, registry]);
  const { cache, owner, source, key, requestPath } = entry;
  const origin = useMemo(() => ({ definitionCache: cache, scopeLifetime: retained ? 'outlet' as const : 'activation' as const,
    cacheOwner: owner, source, key, requestPath }), [cache, owner, source, key, requestPath, retained]);
  if (ancestry.includes(requestIdentity) || ancestry.length >= 32) throw new Error('Recursive schema acquisition or nesting limit');
  return <AcquisitionContext.Provider value={nextAncestry}>{normalized.scope === 'host'
    ? visible && <RuntimeNode definition={normalized.definition.root}/>
    : <FragmentRuntimeHost definition={normalized.definition} parent={parent} registry={registry} visible={visible} origin={origin}/>}</AcquisitionContext.Provider>;
}

export function SchemaOutlet() {
  const context = useContext(RuntimeContext);
  const definition = useContext(NodeDefinitionContext);
  if (!context || !definition?.source) throw new Error('SchemaOutlet requires a runtime node and source');
  const { runtime, registry } = context;
  const source = definition.source;
  const mountId = useId();
  const selection = useSelector((state: RuntimeState) => {
    if (!runtime.active()) return { enabled: false, key: null, prepared: null };
    const resolver = runtime.environment.resolver;
    const resolvedKey = resolver.resolve(definition.key ?? null, { state, scope: runtime });
    const key = (['string', 'number', 'boolean'].includes(typeof resolvedKey) ? resolvedKey : null) as FragmentKey;
    return {
      enabled: Boolean(resolver.resolve(definition.enabled ?? true, { state, scope: runtime })), key,
      prepared: runtime.schemaFragments.prepare(source, key, state),
    };
  }, (left, right) => left.enabled === right.enabled && left.key === right.key && left.prepared?.id === right.prepared?.id);
  const { enabled, key, prepared } = selection;
  const [retry, setRetry] = useState(0);
  const retryIdentity = useRef<string | null>(null);
  const id = prepared?.id ?? 'disposed';
  const refreshing = retryIdentity.current === id;
  // Unlike a definition resource key, an activation belongs to this parent AND this mounted outlet.
  const activationId = JSON.stringify([runtime.scopeId, mountId, id, retry]);
  const entry = useSelector((state: RuntimeState) => state.schemaFragments[id]);
  const retain = definition.lifecycle?.scopeLifetime === 'outlet';
  const [retained, setRetained] = useState<{ activationId: string; entry: SchemaFragmentEntry } | null>(null);
  const saved = !refreshing && retain && retained?.activationId === activationId ? retained.entry : null;
  const validate = useMemo(() => (value: unknown): asserts value is LoadedSchemaDefinition => validateLoadedFragment(value, runtime.definition, registry), [runtime, registry]);
  useEffect(() => {
    setRetained(previous => {
      if (!retain || refreshing || (entry && entry.status !== 'success') || (entry?.status === 'success' && entry.schema?.type !== 'fragment')) return null;
      if (enabled && entry?.status === 'success' && entry.schema?.type === 'fragment') return previous?.activationId === activationId && previous.entry === entry ? previous : { activationId, entry };
      return previous?.activationId === activationId && (!entry || entry.schema === previous.entry.schema) ? previous : null;
    });
  }, [retain, enabled, entry, activationId, refreshing]);
  useEffect(() => {
    if (!enabled || !prepared || saved) return;
    const force = retryIdentity.current === id;
    retryIdentity.current = null;
    const lease = force ? runtime.schemaFragments.reload(source, key, validate, prepared) : runtime.schemaFragments.acquire(source, key, validate, prepared);
    return lease.release;
  }, [runtime, source, key, enabled, validate, retry, id, prepared, saved]);
  if (!prepared || (!enabled && (!saved || (entry && entry.schema !== saved.schema)))) return null;
  const current = refreshing ? undefined : entry ?? saved;
  const ErrorUI = registry.get('error-message');
  const retryContent = () => { retryIdentity.current = id; setRetry(value => value + 1); };
  if (current?.status === 'success' && current.schema) return <FragmentRenderBoundary key={activationId} resetToken={current.schema} fallback={enabled ? <ErrorUI text="Unable to render loaded content" onRetry={retryContent}/> : null} onError={error => runtime.environment.diagnostics.trace('error', 'Fragment rendering failed', error.message)}><LoadedFragment schema={current.schema} parent={runtime} registry={registry} requestIdentity={current.requestIdentity ?? id} visible={enabled} entry={current} retained={retain}/></FragmentRenderBoundary>;
  if (!enabled) return null;
  if (current?.status === 'error') return <><ErrorUI text="Unable to load content" onRetry={retryContent}/>{definition.error && <RuntimeNode definition={definition.error}/>}</>;
  if (definition.loading) return <RuntimeNode definition={definition.loading}/>;
  const Spinner = registry.get('spinner');
  return <Spinner label="Loading content…"/>;
}
export function registerSchemaOutlet(registry: ComponentRegistry) { return registry.register('schema-outlet', SchemaOutlet); }




