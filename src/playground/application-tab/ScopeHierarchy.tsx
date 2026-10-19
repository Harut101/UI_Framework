import { Badge } from '@fluentui/react-components';
import { Disclosure } from '../ui/Disclosure';
import { formatInspectorValue, type ScopeInspection } from './inspectorModel';

function ScopeNode({ node }: { node: ScopeInspection }) {
  return <li data-scope-id={node.scopeId}>
    <Disclosure title={<><Badge appearance="tint">{node.type}</Badge><code>{node.scopeId}</code>{node.origin && <span className="scope-policy">cache: {node.origin.definitionCache} · lifetime: {node.origin.scopeLifetime}</span>}</>}>
      <dl className="scope-summary">
        <div><dt>Schema</dt><dd>{node.definitionId}</dd></div>
        <div><dt>Parent scope</dt><dd>{node.parentScopeId ?? 'none (root)'}</dd></div>
        <div><dt>Definition cache</dt><dd>{node.origin?.definitionCache ?? 'not acquired through an outlet'}</dd></div>
        <div><dt>Scope lifetime</dt><dd>{node.lifetime}</dd></div>
        {node.origin && <><div><dt>Cache owner</dt><dd>{node.origin.cacheOwner}</dd></div><div><dt>Source / key</dt><dd>{node.origin.source} / {formatInspectorValue(node.origin.key)}</dd></div><div><dt>Definition request</dt><dd>{node.origin.requestPath}</dd></div></>}
      </dl>
      <div className="scope-resources">
        <h4>Local $state</h4><pre>{formatInspectorValue(node.state)}</pre>
        <h4>DataSources and statuses</h4>
        {!node.dataSources.length && <p className="inspector-empty">No local datasources.</p>}
        {node.dataSources.map(source => <Disclosure key={source.sourceId} title={<><code>{source.sourceId}</code><Badge>{source.entry?.status ?? 'idle'}</Badge><span>loading: {String(source.entry?.loading ?? false)}</span></>}><pre>{formatInspectorValue({ definition: source.definition, ...source.entry })}</pre></Disclosure>)}
        <h4>Local named actions</h4><pre>{formatInspectorValue(node.actions)}</pre>
        <h4>Registered dependencies</h4>
        {node.dependencies.flatMap(edge => edge.paths.map(path => <p className="scope-edge" key={JSON.stringify([edge.target, path])}><code>{path.scopeId}/{path.area}.{path.path.join('.')}</code> → <code>{edge.target.scopeId}/{edge.target.sourceId}</code></p>))}
        {!node.dependencies.some(edge => edge.paths.length) && <p className="inspector-empty">No registered dependency paths.</p>}
      </div>
    </Disclosure>
    {!!node.children.length && <ul className="scope-tree">{node.children.map(child => <ScopeNode node={child} key={child.scopeId}/>)}</ul>}
  </li>;
}
export function ScopeHierarchy({ roots }: { roots: ScopeInspection[] }) {
  return <section className="inspector-box scope-hierarchy" aria-label="Runtime scope hierarchy"><h3>RuntimeScope hierarchy</h3><p className="inspector-hint">Live scope ownership. Definition caching and runtime scope lifetime are independent. Expand a scope to inspect its local state, datasource definitions/statuses, actions and registered edges.</p><ul className="scope-tree">{roots.map(node => <ScopeNode node={node} key={node.scopeId}/>)}</ul>{!roots.length && <p>No active scopes.</p>}</section>;
}
