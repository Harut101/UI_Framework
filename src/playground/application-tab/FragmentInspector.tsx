import type { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
import type { FragmentComponentDefinition, FragmentDefinition } from '../../runtime/fragment/types';
import type { ApplicationDefinition, RuntimeState } from '../../runtime/shared/types';
import { Disclosure } from '../ui/Disclosure';
import { schemaId } from './inspectorModel';
function tree(node: FragmentComponentDefinition, depth = 0): string {
  return '  '.repeat(depth) + node.type + '\n' + (node.children ?? []).map(child => tree(child, depth + 1)).join('');
}
export function FragmentInspector({ state, application, environment }: { state: RuntimeState; application: ApplicationDefinition; environment?: RuntimeEnvironment }) {
  const activeView = schemaId(state.viewInstance);
  const definitions = environment ? environment.listScopes().map(scope => ({ scope: scope.scopeId, sources: scope.definition.schemaSources ?? {} })) : [
    { scope: 'application', sources: application.schemaSources ?? {} },
    { scope: 'view', sources: activeView ? application.views[activeView]?.schemaSources ?? {} : {} },
  ];
  return <section className="fragment-inspector" aria-label="Dynamic schema fragments"><h3>Schema definition loading · PLAYGROUND TOOLING</h3><p>On-demand UI structure, separate from datasource data. Request paths below are resolved HTTP paths.</p>{definitions.map(group => <Disclosure key={group.scope} title={`${group.scope} schema source definitions`}><pre>{JSON.stringify(group.sources, null, 2)}</pre></Disclosure>)}{Object.entries(state.schemaFragments).map(([id, entry]) => <article key={id}><dl><div><dt>Schema Source</dt><dd>{entry.source}</dd></div><div><dt>Key</dt><dd>{JSON.stringify(entry.key)}</dd></div><div><dt>Status</dt><dd>{entry.status}</dd></div><div><dt>Cache Scope</dt><dd>{entry.cache}</dd></div><div><dt>Cache owner</dt><dd>{entry.owner}</dd></div><div><dt>Requesting scope</dt><dd>{entry.requestingScopeId ?? entry.scope}</dd></div></dl><code>{entry.requestPath}</code>{entry.error && <p role="status">{entry.error}</p>}{entry.schema && <><pre aria-label={`Loaded tree ${entry.source}`}>{tree(entry.schema.type === 'fragment' ? (entry.schema as FragmentDefinition).root : entry.schema)}</pre><Disclosure title="Loaded schema JSON"><pre>{JSON.stringify(entry.schema, null, 2)}</pre></Disclosure></>}</article>)}{!Object.keys(state.schemaFragments).length && <p>No fragments requested. Open dynamic object details. Navigation children load as data.</p>}</section>;
}


