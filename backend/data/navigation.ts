import type { TreeDataNode } from '../../src/contracts/tree';
const href = '/application/catalog';
/** Parent entries and their composition policies are backend-owned DATA. */
export const navigationItems: TreeDataNode[] = [
  { id: 'home', name: 'Home', icon: 'home', disabled: true },
  { id: 'threat', name: 'Threat Detection', icon: 'threat', disabled: true },
  { id: 'changes', name: 'Change Monitoring', icon: 'changes', disabled: true },
  { id: 'reporting', name: 'Reporting', icon: 'reports', links: [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', disabled: true },
    { id: 'reporting.catalog', name: 'Catalog workspace', icon: 'catalog', href },
    { id: 'compliance', name: 'Compliance Coverage', icon: 'shield', disabled: true },
    { id: 'activity', name: 'Report Activity', icon: 'activity', disabled: true },
  ] },
  { id: 'recovery', name: 'Forest Recovery', icon: 'recovery', links: [
    { id: 'overview', name: 'Recovery overview', icon: 'dashboard', href },
    { id: 'jobs', name: 'Recovery Jobs', icon: 'activity', href },
  ], childLinksSourceUrl: 'v0/recovery/effectiveNavigationProperties',
    childrenOrders: ['overview', 'jobs', 'objects', 'plans'] },
  { id: 'tenants', name: 'Microsoft 365', icon: 'microsoft', childLinksSourceUrl: 'v0/msGraph/tenants' },
  { id: 'domains', name: 'Active Directory', icon: 'directory', childLinksSourceUrl: 'v0/msAd/domains',
    childrenSource: { request: { method: 'GET', path: '/api/v0/msAd/domains' }, itemsPath: 'items' } },
  { id: 'configuration', name: 'Configuration', icon: 'configuration', disabled: true },
  { id: 'settings', name: 'Settings', icon: 'settings', disabled: true },
  { id: 'archive', name: 'Archive', icon: 'archive', disabled: true },
];
export const childNavigation: Record<string, TreeDataNode[]> = {
  'msGraph/tenants': [
    { id: 'contoso', name: 'Contoso · Production', icon: 'microsoft', href },
    { id: 'fabrikam', name: 'Fabrikam · Europe', icon: 'microsoft', href },
    { id: 'adatum', name: 'A. Datum · Sandbox', icon: 'microsoft', href },
  ],
  'msAd/domains': [
    { id: 'corp-domain', name: 'corp.contoso.com', icon: 'directory', href },
    { id: 'emea-domain', name: 'emea.contoso.com', icon: 'directory', href },
  ],
  'recovery/effectiveNavigationProperties': [
    { id: 'plans', name: 'Recovery Plans', icon: 'folder', href },
    { id: 'jobs', name: 'Recovery Jobs', icon: 'activity', href },
    { id: 'objects', name: 'Recovered Objects', icon: 'directory', href },
  ],
};
