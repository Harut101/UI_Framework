import { Router } from 'express';
import catalog from '../../src/schemas/views/reporting.catalog.json';
import users from '../../src/schemas/views/users.catalog.json';
import tenant from '../data/ui/microsoft-365.json';
import directory from '../data/ui/active-directory.json';
import type { ViewDefinition } from '../../src/runtime/view/types';
import type { ComponentDefinition } from '../../src/runtime/rendering/types';

function objectView(id: string, title: string, root: ComponentDefinition, alias: string): ViewDefinition {
  return { id, title, initialState: { tenantAlias: alias, activeTab: 'overview' }, dataSources: {},
    actions: {
      setTenantAlias: { type: 'state.set', target: 'tenantAlias', value: '$event.value' },
      selectDetailsTab: { type: 'state.set', target: 'activeTab', value: '$event.value' },
      confirmObjectAction: { type: 'notification.show', message: 'Action executed in the loaded View scope', tone: 'success' },
    }, root: { id: id + '-page', type: 'page', props: { className: 'remote-navigation-view' }, children: [root] } };
}
function recoveryView(id: string, title: string): ViewDefinition {
  return { id: 'recovery.' + id, title, initialState: { query: '', selectedId: '' },
    dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { contextId: 'recovery', search: '$state.query' } },
      dependsOn: ['$state.query'], load: { strategy: 'onViewInit', reload: 'onDependencyChange', debounceMs: 180 } } },
    actions: { setQuery: { type: 'state.set', target: 'query', value: '$event.value' },
      selectItem: { type: 'state.set', target: 'selectedId', value: '$event.value' },
      reload: { type: 'datasource.reload', source: 'items' } },
    root: { id: 'page', type: 'page', props: { className: 'remote-navigation-view' }, children: [
      { id: 'heading', type: 'title', props: { value: title, level: 2 } },
      { id: 'description', type: 'text', props: { value: 'This complete ViewDefinition was loaded from the navigation URL.' } },
      { id: 'search', type: 'search-input', props: { placeholder: 'Search recovery items' },
        bindings: { value: '$state.query' }, handlers: { onChange: { action: 'setQuery' } } },
      { id: 'items', type: 'generic-list', props: { label: title },
        bindings: { items: { source: '$data.items.data.items', default: [] }, loading: '$data.items.loading', selectedId: '$state.selectedId' },
        handlers: { onSelect: { action: 'selectItem' } } },
    ] } };
}
const views: Record<string, ViewDefinition> = {
  '/catalog': catalog as unknown as ViewDefinition, '/application/catalog': catalog as unknown as ViewDefinition,
  '/users': users as unknown as ViewDefinition, '/application/users': users as unknown as ViewDefinition,
  ...Object.fromEntries([['contoso', 'Contoso · Production'], ['fabrikam', 'Fabrikam · Europe'], ['adatum', 'A. Datum · Sandbox']]
    .map(([id, title]) => ['/application/tenants/' + id, objectView('tenant.' + id, title, tenant as unknown as ComponentDefinition, id + '.onmicrosoft.com')])),
  ...Object.fromEntries([['corp-domain', 'corp.contoso.com'], ['emea-domain', 'emea.contoso.com']]
    .map(([id, title]) => ['/application/domains/' + id, objectView('directory.' + id, title, directory as unknown as ComponentDefinition, title)])),
  ...Object.fromEntries([['overview', 'Recovery overview'], ['jobs', 'Recovery Jobs'], ['objects', 'Recovered Objects'], ['plans', 'Recovery Plans']]
    .map(([id, title]) => ['/application/recovery/' + id, recoveryView(id, title)])),
};
export const viewRoutes = Router();
viewRoutes.get('/ui/views', async (request, response) => {
  const pathname = request.query.path;
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    response.status(400).json({ message: 'A local navigation path is required' }); return;
  }
  await new Promise(resolve => setTimeout(resolve, 120));
  // Root entry retains its URL. Unknown paths return 404 instead of an unrelated screen.
  const key = pathname === '/application' || pathname === '/application/' ? '/application/catalog' : pathname;
  if (!Object.hasOwn(views, key)) { response.status(404).json({ message: 'View schema not found for ' + pathname }); return; }
  response.json(views[key]);
});
