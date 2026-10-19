import { ScopeHierarchy } from './ScopeHierarchy';
import { FragmentInspector } from './FragmentInspector';
import {Disclosure} from '../ui/Disclosure';
import {Badge} from '@fluentui/react-components';
import { Button as ToolButton } from '@fluentui/react-components';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Icon } from '../../components/icons';
import type { ApplicationDefinition } from '../../runtime/application/types';
import type { ComponentRegistry } from '../../runtime/rendering/ComponentRegistry';
import type { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
import type { TraceEntry } from '../../runtime/shared/types';
import { RuntimeInspector } from '../schema-tab/RuntimeInspector';
import { actionLogEntries, dependencyExpression, formatInspectorValue, inspectDatasources, inspectScopeHierarchy, lifecycleLogEntries, schemaLogEntries } from './inspectorModel';
import './inspector.css';

function EventLog({ entries, kind }: { entries: TraceEntry[]; kind: 'action' | 'datasource' | 'schema' }) {
  const scroll = useRef<HTMLDivElement>(null);
  const latest = entries[0]?.id;
  const label = kind === 'action' ? 'Action log' : kind === 'schema' ? 'Schema loading log' : 'Datasource lifecycle log';
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [latest]);
  return <div className="inspector-event-log" ref={scroll} role="log" aria-label={label}>
    {!entries.length && <p className="inspector-empty">No {kind === 'action' ? 'actions' : kind === 'schema' ? 'schema events' : 'datasource events'} recorded yet.</p>}
    {entries.slice(0, 40).reverse().map(entry => <article key={entry.id} className={`inspector-event event-${entry.metadata?.event ?? entry.kind}`}>
      <div><time>{entry.time}</time><span>{entry.metadata?.scope ?? 'runtime'} · {entry.metadata?.instance ?? 'session'}</span></div>
      <strong>{kind === 'action' ? entry.metadata?.actionId ?? entry.label : kind === 'schema' ? entry.metadata?.schemaResource?.source : entry.metadata?.datasourceId}</strong>
      <code>{kind === 'action' ? entry.metadata?.actionType ?? entry.detail : entry.metadata?.event}</code>
      {kind === 'action' && <small>{entry.metadata?.event ?? 'execute'}</small>}
      {entry.metadata?.target && <code className="inspector-target">{entry.metadata.target}</code>}
      {entry.metadata && Object.hasOwn(entry.metadata, 'value') && <pre>{formatInspectorValue(entry.metadata.value)}</pre>}
      {kind !== 'action' && entry.metadata?.request && <pre aria-label="Resolved request">{formatInspectorValue(entry.metadata.request)}</pre>}
      {kind === 'schema' && entry.metadata?.schemaResource && <small>Definition cache: {entry.metadata.schemaResource.cache} · Cache owner: {entry.metadata.schemaResource.owner} · Key: {formatInspectorValue(entry.metadata.schemaResource.key)}</small>}
      {kind !== 'action' && entry.detail && <small>{entry.detail}</small>}
      {entry.kind === 'error' && kind === 'action' && <small>{entry.detail}</small>}
    </article>)}
  </div>;
}

export function DeveloperRuntimeInspector({ environment, application, registry }: {
  environment: RuntimeEnvironment; application: ApplicationDefinition; registry: ComponentRegistry;
}) {
  const state = useSyncExternalStore(environment.store.subscribe, environment.store.getState);
  const traces = useSyncExternalStore(environment.diagnostics.subscribe, environment.diagnostics.snapshot);
  const sources = inspectDatasources(application, state, environment);
  const types = registry.list();
  const hierarchy = inspectScopeHierarchy(environment, state);
  const links = environment.dependencyGraph.registrations().flatMap(edge => edge.paths.map(path => ({
    key: JSON.stringify([edge.target, path]), path, target: edge.target,
  })));
  return <section className="developer-runtime-inspector" id="full-runtime-inspector" aria-label="Tab 3 Runtime Inspector">
    <header><div><Icon name="activity" size={17}/><h2>Runtime Inspector</h2><Badge className="tooling-label" appearance="tint" color="brand">PLAYGROUND TOOLING</Badge></div><ToolButton type="button" onClick={environment.diagnostics.clear}><Icon name="delete" size={13}/>Clear logs</ToolButton></header>
    <p className="inspector-description">Read-only state and schema inspection. Runtime behavior is independent of this panel. Logs retain the latest 100 events across view changes. Press Ctrl+Alt+I to inspect live scopes while a schema drawer is open.</p>
    <dl className="inspector-identity"><div><dt>Current Application schema id</dt><dd>{environment.applicationScope?.definition.id ?? application.id}</dd></div><div><dt>Current View schema id</dt><dd>{environment.viewScope?.definition.id ?? 'none'}</dd></div></dl>
    <div className="inspector-content"><ScopeHierarchy roots={hierarchy}/><Disclosure className="inspector-schema-resources" title="Schema definition resources and loaded trees"><FragmentInspector state={state} application={application} environment={environment}/></Disclosure><div className="inspector-grid">
      <section className="inspector-box"><h3><Icon name="code" size={14}/>State namespaces</h3><RuntimeInspector environment={environment} showHeading={false} showFragments={false}/></section>
      <div className="inspector-column">
        <section className="inspector-box"><h3><Icon name="database" size={14}/>Current datasource statuses</h3><div className="inspector-statuses">{sources.map(source => <article key={source.key}><header><strong>{source.id}</strong><small>{source.scopeId ?? source.scope}</small><Badge appearance="tint" color={source.entry?.status==="error"?"danger":source.entry?.status==="success"?"success":"informative"}>{source.entry?.status??"idle"}</Badge></header><dl><div><dt>status</dt><dd>{source.entry?.status ?? 'idle'}</dd></div><div><dt>loading</dt><dd>{String(source.entry?.loading ?? false)}</dd></div><div><dt>error</dt><dd>{source.entry?.error ?? 'null'}</dd></div></dl></article>)}</div></section>
        <section className="inspector-box"><h3>Registered components <span>{types.length}</span></h3><div className="inspector-components">{types.map(type => <code key={type}>{type}</code>)}</div></section>
      </div>
      <section className="inspector-box"><h3>DependencyGraph relationships</h3><p className="inspector-hint">Live scope-qualified graph registrations; DataSourceManager applies each load policy.</p>{links.length ? <ul className="inspector-dependencies">{links.map(link => <li key={link.key}><code>{dependencyExpression(link.path, link.target.scopeId, environment)}<small> · {link.path.scopeId}</small></code><span aria-hidden="true">→</span><strong>{link.target.sourceId}</strong><small>{link.target.scopeId}</small></li>)}</ul> : <p className="inspector-empty">No dependencies declared.</p>}</section>
      <section className="inspector-box"><h3>Current datasource definitions</h3>{sources.map(source => <Disclosure className="inspector-definition" key={source.key} title={<><code>{source.id}</code><small>{source.scopeId ?? source.scope}</small></>}><pre>{formatInspectorValue(source.definition)}</pre></Disclosure>)}</section>
      <section className="inspector-box"><h3>Schema loading log <span>definition HTTP / cache</span></h3><EventLog entries={schemaLogEntries(traces)} kind="schema"/></section>
      <section className="inspector-box"><h3>Action log <span>resolved values</span></h3><EventLog entries={actionLogEntries(traces)} kind="action"/></section>
      <section className="inspector-box"><h3>Datasource lifecycle log <span>oldest → newest</span></h3><EventLog entries={lifecycleLogEntries(traces)} kind="datasource"/></section>
    </div></div>
  </section>;
}

