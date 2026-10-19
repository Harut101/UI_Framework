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
    { id: 'users.catalog', name: 'Users catalog', icon: 'users', href: '/application/users' },
    { id: 'compliance', name: 'Compliance Coverage', icon: 'shield', disabled: true },
    { id: 'activity', name: 'Report Activity', icon: 'activity', disabled: true },
  ] },
  { id: 'recovery', name: 'Forest Recovery', icon: 'recovery', links: [
    { id: 'overview', name: 'Recovery overview', icon: 'dashboard', href: '/application/recovery/overview' },
    { id: 'jobs', name: 'Recovery Jobs', icon: 'activity', href: '/application/recovery/jobs' },
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
    { id: 'contoso', name: 'Contoso · Production', icon: 'microsoft', href: '/application/tenants/contoso' },
    { id: 'fabrikam', name: 'Fabrikam · Europe', icon: 'microsoft', href: '/application/tenants/fabrikam' },
    { id: 'adatum', name: 'A. Datum · Sandbox', icon: 'microsoft', href: '/application/tenants/adatum' },
  ],
  'msAd/domains': [
    { id: 'corp-domain', name: 'corp.contoso.com', icon: 'directory', href: '/application/domains/corp-domain' },
    { id: 'emea-domain', name: 'emea.contoso.com', icon: 'directory', href: '/application/domains/emea-domain' },
  ],
  'recovery/effectiveNavigationProperties': [
    { id: 'plans', name: 'Recovery Plans', icon: 'folder', href: '/application/recovery/plans' },
    { id: 'jobs', name: 'Recovery Jobs', icon: 'activity', href: '/application/recovery/jobs' },
    { id: 'objects', name: 'Recovered Objects', icon: 'directory', href: '/application/recovery/objects' },
  ],
};
