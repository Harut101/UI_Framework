import { reportingCatalogDefinition, usersCatalogDefinition } from '../../schemas/reporting';
import type { ComponentDefinition } from '../../runtime/rendering/types';
import type { ViewDefinition } from '../../runtime/view/types';

export const demoCatalogs = [
  { id: 'reports', label: 'Reports Catalog', href: '/application/catalog', definition: reportingCatalogDefinition, navigationId: 'module-navigation', listId: 'reports-list' },
  { id: 'users', label: 'Users Catalog', href: '/application/users', definition: usersCatalogDefinition, navigationId: 'department-navigation', listId: 'users-list' },
] as const;
export type DemoCatalogId = (typeof demoCatalogs)[number]['id'];
export type DemoCatalog = (typeof demoCatalogs)[number];

function findNode(node: ComponentDefinition, id: string): ComponentDefinition | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) { const found = findNode(child, id); if (found) return found; }
}

// Read-only playground inspection: these excerpts never participate in rendering or execution.
export function schemaComparisonSections(view: ViewDefinition, navigationId: string, listId: string) {
  const navigation = findNode(view.root, navigationId);
  const list = findNode(view.root, listId);
  const actionId = navigation?.handlers?.onSelect.action;
  const binding = list?.bindings?.items;
  const source = typeof binding === 'string' ? binding : binding?.source;
  const sourceId = source?.split('.')[1];
  if (!navigation || !list || !actionId || !sourceId || !view.dataSources[sourceId] || !view.actions[actionId]) throw new Error('Missing schema proof configuration');
  const datasource = view.dataSources[sourceId];
  return [
    { title: 'Navigation bindings', value: { type: navigation.type, bindings: navigation.bindings } },
    { title: 'Handler', value: navigation.handlers },
    { title: 'Named action', value: { [actionId]: view.actions[actionId] } },
    { title: 'Datasource / dependsOn', value: { [sourceId]: { request: datasource.request, dependsOn: datasource.dependsOn, load: datasource.load } } },
    { title: 'List binding', value: { type: list.type, bindings: list.bindings } },
  ];
}
