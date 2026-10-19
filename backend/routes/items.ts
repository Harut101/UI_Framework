import { Router } from 'express';
import { itemsForContext, validContextId } from '../data/contextItems';
export const itemsRoutes = Router();
itemsRoutes.get('/items', async (request, response) => {
  const contextId = request.query.contextId;
  if (contextId !== undefined && (typeof contextId !== 'string' || !validContextId(contextId))) {
    response.status(400).json({ message: 'Invalid contextId' }); return;
  }
  await new Promise(resolve => setTimeout(resolve, request.query.slow === 'true' ? 1200 : 200));
  if (request.query.fail === 'true') {
    response.status(503).json({ message: 'Simulated API failure. Turn off the failure switch to recover.' }); return;
  }
  const search = typeof request.query.search === 'string' ? request.query.search.trim().toLowerCase() : '';
  const items = itemsForContext(contextId).filter(item => `${item.title} ${item.description} ${item.meta}`.toLowerCase().includes(search));
  response.json({ items, total: items.length, contextId: contextId ?? null, summary: `${contextId ?? 'Workspace'} · ${items.length} item${items.length === 1 ? '' : 's'}` });
});
