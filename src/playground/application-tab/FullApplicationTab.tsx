import {Select} from '../../components/primitive/Select';
import {Notice} from '../ui/Notice';
import {Disclosure} from '../ui/Disclosure';
import { Button as ToolButton, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, useRestoreFocusTarget } from '@fluentui/react-components';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/icons';
import { ApplicationRuntime } from '../../runtime/application/ApplicationRuntime';
import { ApplicationHost } from '../../runtime/application/ApplicationHost';
import { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
import type { ComponentRegistry } from '../../runtime/rendering/ComponentRegistry';
import { reportingApplicationDefinition } from '../../schemas/reporting';
import { PreviewErrorBoundary } from '../schema-tab/PreviewErrorBoundary';
import { DeveloperRuntimeInspector } from './DeveloperRuntimeInspector';
import { ArchitectureDialog } from './ArchitectureDialog';
import { demoApplicationDefinition, demoCatalogs, type DemoCatalogId } from './demoCatalogs';
import { SchemaComparison } from './SchemaComparison';
import './application.css';

export function FullApplicationTab({ registry }: { registry: ComponentRegistry }) {
  const navigate = useNavigate();
  const restoreArchitectureFocus = useRestoreFocusTarget();
  const navigateRef = useRef(navigate); navigateRef.current = navigate;
  const [notice, setNotice] = useState<{ message: string; tone: string } | null>(null);
  const [environment] = useState(() => new RuntimeEnvironment(to => navigateRef.current(to), (message, tone) => setNotice({ message, tone })));
  const [runtime, setRuntime] = useState<ApplicationRuntime | null>(null);
  const [inspector, setInspector] = useState(false);
  const [liveInspector, setLiveInspector] = useState(false);
  const inspectorReturnFocus = useRef<HTMLElement | null>(null);
  const inspectorOpen = useRef(false); inspectorOpen.current = liveInspector;
  const focusFrame = useRef<number | null>(null);
  const openLiveInspector = useCallback(() => {
    if (inspectorOpen.current) return;
    inspectorReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLiveInspector(true);
  }, []);
  const restoreInspectorFocus = useCallback(() => {
    // Restore after Fluent's exit motion/unmount, when its modalizer can reactivate the parent.
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      if (!inspectorOpen.current && inspectorReturnFocus.current?.isConnected) inspectorReturnFocus.current.focus();
    });
  }, []);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  useEffect(() => {
    const openInspector = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'i') {
        event.preventDefault(); openLiveInspector();
      }
    };
    window.addEventListener('keydown', openInspector);
    return () => window.removeEventListener('keydown', openInspector);
  }, [openLiveInspector]);
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const closeArchitecture = useCallback(() => setArchitectureOpen(false), []);
  const [revision, setRevision] = useState(0);
  const [demoId, setDemoId] = useState<DemoCatalogId>('reports');
  const catalog = demoCatalogs.find(item => item.id === demoId)!;
  const definition = useMemo(() => demoApplicationDefinition(catalog), [catalog]);
  useLayoutEffect(() => {
    const next = new ApplicationRuntime(reportingApplicationDefinition, environment);
    setRuntime(next); next.start();
    return () => next.dispose();
  }, [environment, revision]);
  const onError = useCallback((error: Error) => environment.diagnostics.trace('error', 'Application rendering failed', error.message), [environment]);
  useLayoutEffect(() => {
    if (!runtime) return;
    void runtime.actionEngine.execute('selectDemoContext', { scope: runtime, event: { breadcrumbs: ['Guardian', 'Catalog workspace', catalog.definition.title] } });
  }, [runtime, catalog]);
  const source = useMemo(() => JSON.stringify(definition, null, 2), [definition]);
  const selectDemo = (id: string) => {
    const next = demoCatalogs.find(item => item.id === id);
    if (!next || next.id === demoId) return;
    setNotice(null); setDemoId(next.id);
  };
  return <section className="full-application-tab"><div className="full-application-toolbar"><div><p className="eyebrow">03 / FULL APPLICATION</p><h1>Full Application</h1></div><span><Icon name="code" size={14}/>Generated from application + view schemas</span><ToolButton {...restoreArchitectureFocus} type="button" className="architecture-open" aria-haspopup="dialog" onClick={() => setArchitectureOpen(true)}><Icon name="workflow" size={14}/>Architecture</ToolButton><ToolButton type="button" aria-controls="full-runtime-inspector" aria-expanded={inspector} onClick={() => setInspector(!inspector)}><Icon name="panel" size={14}/>{inspector ? 'Hide runtime inspector' : 'Runtime inspector'}</ToolButton><ToolButton aria-keyshortcuts="Control+Alt+I" onClick={openLiveInspector}>Inspect live scopes · Ctrl+Alt+I</ToolButton></div><div className="schema-demo-controls"><div><Select label="Demo Schema" value={demoId} onChange={({value})=>selectDemo(value)} options={demoCatalogs.map(item=>({value:item.id,label:item.label}))}/></div><p>Playground tooling · one runtime, one registry, two view definitions.</p></div><SchemaComparison selectedId={demoId}/>{inspector && !liveInspector && <DeveloperRuntimeInspector environment={environment} application={definition} registry={registry}/>}<Provider store={environment.store}><PreviewErrorBoundary key={revision} resetKey={demoId} onError={onError} onRetry={() => setRevision(previous => previous + 1)}>{runtime && <ApplicationHost definition={definition} views={definition.views} environment={environment} runtime={runtime} registry={registry}/>}</PreviewErrorBoundary>{notice && <Notice message={notice.message} tone={notice.tone} onDismiss={()=>setNotice(null)}/>}{inspector && <Disclosure className="inspector-application-source" title="Application and view schema JSON"><pre>{source}</pre></Disclosure>}</Provider>{architectureOpen && <ArchitectureDialog onClose={closeArchitecture}/>}
    <Dialog open={liveInspector} surfaceMotion={{ onMotionFinish: (_, data) => { if (data.direction === 'exit') restoreInspectorFocus(); } }} onOpenChange={(_, data) => setLiveInspector(data.open)}><DialogSurface className="runtime-inspector-dialog" aria-label="Live Runtime Inspector"><DialogBody>
      <DialogTitle>Live Runtime Inspector</DialogTitle><DialogContent>{liveInspector && <DeveloperRuntimeInspector environment={environment} application={definition} registry={registry}/>}</DialogContent>
      <DialogActions><ToolButton onClick={() => setLiveInspector(false)}>Close live inspector</ToolButton></DialogActions>
    </DialogBody></DialogSurface></Dialog>
  </section>;
}

