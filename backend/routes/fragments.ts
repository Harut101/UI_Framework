import { Router } from 'express';
import itemsPanel from '../data/ui/items-panel.json';
import itemNote from '../data/ui/item-note.json';
import { validContextId } from '../data/contextItems';
export const fragmentRoutes = Router();
fragmentRoutes.get('/ui/fragments/items-panel/:contextId', async (request, response) => {
  const contextId = String(request.params.contextId);
  if (!validContextId(contextId)) { response.status(400).json({ message: 'Invalid contextId' }); return; }
  await new Promise(resolve => setTimeout(resolve, 250));
  // Request-specific literals are supplied by the backend; the cached template is never mutated.
  const definition = structuredClone(itemsPanel);
  Object.assign(definition.dataSources.items.request.query, { contextId });
  response.json(definition);
});
fragmentRoutes.get('/ui/fragments/item-note/:itemId', async (request, response) => {
  const itemId = String(request.params.itemId);
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(itemId)) { response.status(400).json({ message: 'Invalid itemId' }); return; }
  await new Promise(resolve => setTimeout(resolve, 200));
  const definition = structuredClone(itemNote);
  definition.root.props.description = `Item ${itemId} · independent nested fragment state.`;
  response.json(definition);
});

