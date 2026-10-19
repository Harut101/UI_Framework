import {Disclosure} from '../ui/Disclosure';
import { useSyncExternalStore } from 'react';
import type { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
export function RuntimeInspector({ environment, showHeading = true, showFragments = true }: { environment: RuntimeEnvironment; showHeading?: boolean; showFragments?: boolean }) {
  const state = useSyncExternalStore(environment.store.subscribe, environment.store.getState);
  const namespaces = { $appState: state.appState, $appData: state.appData, $state: state.viewState, $data: state.viewData };
  return <section className="schema-runtime-inspector" aria-label="Runtime inspector">{showHeading && <div className="schema-inspector-heading"><h3>Runtime inspector</h3><span>View: {state.viewInstance?.slice(0, state.viewInstance.lastIndexOf(':')) ?? 'none'}</span></div>}{Object.entries(namespaces).map(([name, value]) => <Disclosure key={name} defaultOpen title={<><code>{name}</code><span>{name.startsWith('$app') ? 'application' : 'view'}</span></>}><pre>{JSON.stringify(value, null, 2)}</pre></Disclosure>)}{showFragments && Object.keys(state.fragments).length > 0 && <section className="inspector-fragment-scopes" aria-label="Fragment scopes"><h3>Fragment scopes</h3>{Object.entries(state.fragments).map(([scopeId, entry]) => {
    const scope = environment.getScope(scopeId);
    return <Disclosure key={scopeId} title={<><code>{scopeId}</code><span>fragment</span></>}><pre>{JSON.stringify({ parentScopeId: scope?.parentScopeId, applicationScopeId: scope?.applicationScopeId, viewScopeId: scope?.viewScopeId, $state: entry.state, $data: entry.data }, null, 2)}</pre></Disclosure>;
  })}</section>}<p>These are live runtime values. They are tooling, separate from the reusable UI components.</p></section>;
}

