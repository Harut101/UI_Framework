import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { modules, frameworks, reportTypes, reports } from '../data/reports';
import type { ReportRunResult } from '../../src/contracts/reporting';

export const reportingRoutes = Router();
const delay = () => new Promise(resolve => setTimeout(resolve, 140));
const lastRuns = new Map<string, string>();
reportingRoutes.get('/me', async (_request, response) => {
  await delay(); response.json({ user: { name: 'Alex Morgan', initials: 'AM', role: 'Workspace administrator' } });
});
reportingRoutes.get('/report-facets', async (_request, response) => {
  await delay();
  const navigation = (values: readonly (readonly [string, string])[], match: (id: string) => number) => values.map(([id, label]) => ({ id, label, count: match(id) }));
  const moduleItems = navigation(modules, id => reports.filter(item => item.moduleId === id).length);
  const frameworkItems = navigation(frameworks, id => reports.filter(item => item.frameworkIds.includes(id)).length);
  const typeItems = navigation(reportTypes, id => reports.filter(item => item.typeId === id).length);
  const options = (items: { id: string; label: string }[], label: string) => [{ value: '', label }, ...items.map(({ id, label }) => ({ value: id, label }))];
  response.json({
    collections: [{ id: 'all', label: 'All reports', count: reports.length }, { id: 'saved', label: 'Saved reports', count: reports.filter(item => item.saved).length }, { id: 'custom', label: 'Custom reports', count: reports.filter(item => item.custom).length }, { id: 'updated', label: 'See updated reports', count: reports.filter(item => item.updated).length }],
    modules: [{ id: '', label: 'All modules', count: reports.length }, ...moduleItems],
    frameworks: [{ id: '', label: 'All frameworks', count: reports.length }, ...frameworkItems],
    types: [{ id: '', label: 'All report types', count: reports.length }, ...typeItems],
    moduleOptions: options(moduleItems, 'All Module types'), frameworkOptions: options(frameworkItems, 'All Compliance frameworks'), typeOptions: options(typeItems, 'All Report types'),
    ownerOptions: [{ value: '', label: 'All owners' }, ...[...new Set(reports.map(item => item.owner))].map(value => ({ value, label: value }))],
  });
});
reportingRoutes.get('/reports', async (request, response) => {
  await delay();
  const query = (key: string) => typeof request.query[key] === 'string' ? String(request.query[key]) : '';
  const search = query('search').trim().toLowerCase();
  const items = reports.filter(item =>
    (!search || [item.title, item.description, item.coverage, ...(item.controls ?? [])].join(' ').toLowerCase().includes(search)) &&
    (!query('module') || item.moduleId === query('module')) &&
    (!query('framework') || item.frameworkIds.includes(query('framework'))) &&
    (!query('type') || item.typeId === query('type')) &&
    (!query('owner') || item.owner === query('owner')) &&
    (query('publishedOnly') !== 'true' || item.status === 'published') &&
    (query('collection') !== 'saved' || item.saved) && (query('collection') !== 'custom' || item.custom) && (query('collection') !== 'updated' || item.updated),
  );
  response.json({ items, total: items.length, subtitle: `${items.length} report definition${items.length === 1 ? '' : 's'} · search by name, description, control, or keyword` });
});
reportingRoutes.get('/reports/:id', async (request, response) => {
  await delay(); const item = reports.find(item => item.id === request.params.id);
  if (!item) { response.status(404).json({ message: 'Report not found' }); return; }
  response.json({ report: { ...item, lastRun: lastRuns.get(item.id) ?? null } });
});
reportingRoutes.post('/reports/:id/run', async (request, response) => {
  await delay(); const item = reports.find(item => item.id === request.params.id);
  if (!item) { response.status(404).json({ message: 'Report not found' }); return; }
  const completedAt = new Date().toISOString(); lastRuns.set(item.id, completedAt);
  const result: ReportRunResult = { id: randomUUID(), reportId: item.id, status: 'completed', completedAt, rowCount: 18 + reports.indexOf(item) * 7, message: `${item.title} completed successfully.` };
  response.json(result);
});

