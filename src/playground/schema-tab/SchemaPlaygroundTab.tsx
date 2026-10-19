import { Select } from '../../components/primitive/Select';
import { Badge, Spinner } from '@fluentui/react-components';
import { Button as ToolButton } from '@fluentui/react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/icons';
import type { ComponentRegistry } from '../../runtime/rendering/ComponentRegistry';
import type { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
import { parseViewDefinition, jsonSyntaxIssue, type SchemaIssue } from '../../runtime/shared/parseViewDefinition';
import type { ViewDefinition } from '../../runtime/view/types';
import { ViewRuntimeHost } from '../../runtime/view/ViewRuntimeHost';
import { defaultSchemaSample, schemaSamples, type SchemaSampleId } from './samples';
import { JsonEditor } from './JsonEditor';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { RuntimeInspector } from './RuntimeInspector';
import './schema-playground.css';
export const SCHEMA_VALIDATION_DELAY = 300;
export function SchemaPlaygroundTab({ environment, registry }: { environment: RuntimeEnvironment; registry: ComponentRegistry }) {
  const initial = useMemo(() => parseViewDefinition(defaultSchemaSample.source, registry), [registry]);
  const [sampleId, setSampleId] = useState<SchemaSampleId>(defaultSchemaSample.id);
  const [source, setSource] = useState(defaultSchemaSample.source);
  const [definition, setDefinition] = useState<ViewDefinition | null>(initial.ok ? initial.definition : null);
  const [issue, setIssue] = useState<SchemaIssue | null>(initial.ok ? null : initial.issue);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [showInspector, setShowInspector] = useState(false);
  const [renderError, setRenderError] = useState('');
  const processedSource = useRef(defaultSchemaSample.source);
  const fingerprint = useRef(initial.ok ? JSON.stringify(initial.definition) : '');
  const sample = schemaSamples.find(item => item.id === sampleId)!;
  const commit = useCallback((text: string, force = false) => {
    const result = parseViewDefinition(text, registry);
    processedSource.current = text;
    setPending(false);
    setIssue(result.ok ? null : result.issue);
    if (!result.ok) return;
    const next = JSON.stringify(result.definition);
    if (force || next !== fingerprint.current) {
      fingerprint.current = next;
      setDefinition(result.definition);
      setRevision(previous => previous + 1);
      setRenderError('');
    }
  }, [registry]);
  useEffect(() => {
    if (source === processedSource.current) return;
    const timer = setTimeout(() => commit(source), SCHEMA_VALIDATION_DELAY);
    return () => clearTimeout(timer);
  }, [source, commit]);
  const edit = (next: string) => { setSource(next); setPending(next !== processedSource.current); };
  const chooseSample = (id: string) => {
    const chosen = schemaSamples.find(item => item.id === id);
    if (!chosen) return;
    setSampleId(chosen.id); setSource(chosen.source); commit(chosen.source, true);
  };
  const reset = () => { setSource(sample.source); commit(sample.source, true); };
  const format = () => {
    try { const formatted = JSON.stringify(JSON.parse(source), null, 2); setSource(formatted); commit(formatted); }
    catch (error) { setIssue(jsonSyntaxIssue(error, source)); processedSource.current = source; setPending(false); }
  };
  const retry = () => { setRenderError(''); setRevision(previous => previous + 1); };
  const onRenderError = useCallback((error: Error) => {
    setRenderError(error.message); environment.diagnostics.trace('error', 'View rendering failed', error.message);
  }, [environment]);
  return <section className="tab-content schema-playground-tab"><div className="schema-page-heading"><div><p className="eyebrow">02 / SCHEMA PLAYGROUND</p><h1>Schema Playground</h1><p className="intro">Edit the definition. Watch the real runtime turn JSON into an experience.</p></div><Badge className="schema-runtime-badge" appearance="tint" color="brand" icon={<Icon name="code"/>}>ViewDefinition → ViewRuntime</Badge></div><div className="schema-sample-toolbar"><Select label="Sample schema" value={sampleId} onChange={({value})=>chooseSample(value)} options={schemaSamples.map(item=>({value:item.id,label:item.label}))}/><p>{sample.description}</p></div><div className="schema-workspace"><div className="schema-editor-column"><section className="schema-editor-card"><div className="schema-panel-heading"><span><Icon name="code" size={16}/>JSON editor</span><div><ToolButton type="button" onClick={format}><Icon name="code" size={13}/>Format JSON</ToolButton><ToolButton type="button" onClick={reset}><Icon name="reset" size={13}/>Reset</ToolButton></div></div><JsonEditor key={sampleId} value={source} onChange={edit} onCommit={() => commit(source)} errorLine={issue?.line}/><div className={`schema-validation-status ${issue ? 'invalid' : ''}`} role="status">{pending ? <><Spinner size="tiny"/>Validating draft…</> : issue ? <><Icon name="warning" size={14}/>{issue.stage === 'parse' ? 'Invalid JSON' : 'Schema validation failed'}</> : <><Icon name="success" size={14}/>Valid ViewDefinition</>}<ToolButton type="button" onClick={() => commit(source)}><Icon name="play" size={12}/>Apply now</ToolButton></div>{issue && <div className="schema-validation-error" role="alert"><strong>{issue.stage === 'parse' ? 'JSON parse error' : 'Validation error'}{issue.line && ` · line ${issue.line}, column ${issue.column}`}</strong><p>{issue.message}</p><small>The preview keeps the last valid definition.</small></div>}</section><div className="schema-editor-footer"><p>Valid edits apply after {SCHEMA_VALIDATION_DELAY}ms. Applying a changed definition reinitializes view state.</p><ToolButton type="button" aria-pressed={showInspector} onClick={() => setShowInspector(!showInspector)}><Icon name="panel" size={15}/>{showInspector ? 'Hide inspector' : 'Runtime inspector'}</ToolButton></div>{showInspector && <RuntimeInspector environment={environment}/>}</div><section className="schema-preview-column"><div className="schema-panel-heading"><span><span className="live-dot"/>Live runtime preview</span><Badge appearance="tint" color={renderError?"danger":issue?"warning":"success"} className={`schema-preview-status ${renderError ? 'failed' : issue ? 'stale' : ''}`}>{renderError ? 'Render failed' : issue ? 'Last valid view' : 'Reactive'}</Badge></div><div className="schema-render-canvas"><PreviewErrorBoundary key={revision} onRetry={retry} onError={onRenderError}>{definition ? <ViewRuntimeHost definition={definition} environment={environment} registry={registry}/> : <p className="schema-no-preview">Provide a valid ViewDefinition to start the preview.</p>}</PreviewErrorBoundary></div><footer className="schema-preview-footer"><Icon name="code" size={15}/><p>Rendered by RuntimeNode using the shared ComponentRegistry. State, actions, bindings, and datasource lifecycle belong to the runtime.</p></footer></section></div></section>;
}
