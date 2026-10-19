export interface DemoItem { id: string; title: string; description: string; meta: string }
export const demoItems: DemoItem[] = [
  { id: 'item-1', title: 'Revenue overview', description: 'Monthly revenue and growth', meta: 'Finance' },
  { id: 'item-2', title: 'Pipeline performance', description: 'Opportunities and conversion', meta: 'Sales' },
  { id: 'item-3', title: 'Campaign insights', description: 'Channel engagement and reach', meta: 'Marketing' },
  { id: 'item-4', title: 'Quarterly planning', description: 'Priorities for the next quarter', meta: 'Planning' },
  { id: 'item-5', title: 'Team directory', description: 'People and responsibilities', meta: 'People' },
  { id: 'item-6', title: 'Workspace activity', description: 'Recent updates across the team', meta: 'Workspace' },
];
