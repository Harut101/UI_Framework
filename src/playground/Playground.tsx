import {TabList,Tab,Button,Badge,Spinner} from '@fluentui/react-components';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../components/icons';
import { ApplicationRuntime } from '../runtime/application/ApplicationRuntime';
import { RuntimeEnvironment } from '../runtime/shared/RuntimeEnvironment';
import { registerRouteOutlet } from '../runtime/routing/RouteOutlet';
import { createComponentRegistry, registerApplicationComponents } from '../components/registry';
import { applicationDefinition } from '../schemas';
import { ComponentsTab } from './components-tab/ComponentsTab';
import { SchemaPlaygroundTab } from './schema-tab/SchemaPlaygroundTab';
import { FullApplicationTab } from './application-tab/FullApplicationTab';

export function Playground() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate); navigateRef.current = navigate;
  const [error, setError] = useState('');
  const [environment] = useState(() => new RuntimeEnvironment(to => navigateRef.current(to), message => setError(message)));
  const [runtime, setRuntime] = useState<ApplicationRuntime | null>(null);
  const registry = useMemo(() => registerRouteOutlet(registerApplicationComponents(createComponentRegistry())), []);
  useLayoutEffect(() => {
    const next = new ApplicationRuntime(applicationDefinition, environment);
    setRuntime(next); next.start();
    return () => next.dispose();
  }, [environment]);
  return <Provider store={environment.store}><div className="playground"><header className="studio-header"><div className="brand"><Icon name="layers" size={25}/><span>Schema Runtime</span><Badge className="brand-badge" appearance="outline">PLAYGROUND</Badge></div><span className="milestone">Architecture playground</span></header><div className="workspace"><nav className="top-tabs" aria-label="Playground tabs"><TabList selectedValue={location.pathname.startsWith("/application")?"/application":location.pathname} onTabSelect={(_,data)=>navigate(String(data.value))}>{[{value:"/components",label:"Components",icon:"components"},{value:"/schema",label:"Schema Playground",icon:"code"},{value:"/application",label:"Full Application",icon:"window"}].map(tab=><Tab key={tab.value} value={tab.value} icon={<Icon name={tab.icon}/>}>{tab.label}</Tab>)}</TabList></nav>{error && <div className="runtime-error" role="alert">{error}<Button onClick={()=>setError('')}>Dismiss</Button></div>}{runtime ? <Routes><Route path="/components" element={<ComponentsTab registry={registry}/>}/><Route path="/schema" element={<SchemaPlaygroundTab environment={environment} registry={registry}/>}/><Route path="/application/*" element={<FullApplicationTab registry={registry}/>}/><Route path="*" element={<Navigate to="/components" replace/>}/></Routes> : <Spinner className="boot-placeholder" label="Initializing runtime…"/>}<footer className="studio-footer"><span>One runtime. Two schemas.</span><span>React · TypeScript · Redux Toolkit</span></footer></div></div></Provider>;
}
