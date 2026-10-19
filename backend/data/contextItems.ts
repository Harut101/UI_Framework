import { demoItems, type DemoItem } from './demoItems';
export const validContextId = (value: string) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
const contexts: Record<string, DemoItem[]> = {
  finance: [
    { id: 'forecast', title: 'Quarterly forecast', description: 'Revenue outlook and operating assumptions', meta: 'Finance' },
    { id: 'invoices', title: 'Invoice exceptions', description: 'Invoices awaiting finance review', meta: 'Accounts payable' },
    { id: 'revenue', title: 'Revenue overview', description: 'Monthly revenue and growth', meta: 'Finance' },
    { id: 'budget', title: 'Budget approvals', description: 'Department budgets pending sign-off', meta: 'Planning' },
  ],
  operations: [
    { id: 'recovery', title: 'Recovery readiness', description: 'Backup coverage and recovery dependencies', meta: 'Continuity' },
    { id: 'directory', title: 'Directory health', description: 'Domain replication and service status', meta: 'Infrastructure' },
    { id: 'sync', title: 'Tenant sync status', description: 'Connected tenant synchronization', meta: 'Cloud operations' },
    { id: 'backups', title: 'Backup coverage', description: 'Protected objects and recent backup checks', meta: 'Protection' },
  ],
};
export function itemsForContext(contextId?: string): DemoItem[] {
  if (!contextId) return demoItems;
  const seed = Object.hasOwn(contexts, contextId) ? contexts[contextId] : demoItems;
  return seed.map(item => ({ ...item, id: contextId + '--' + item.id, meta: contextId + ' · ' + item.meta }));
}

