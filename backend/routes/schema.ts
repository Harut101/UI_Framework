import { Router } from 'express';
import tenant from '../data/ui/microsoft-365.json';
import directory from '../data/ui/active-directory.json';
import configuration from '../data/ui/configuration.json';

export const schemaRoutes = Router();
const delay = () => new Promise(resolve => setTimeout(resolve, 900));
const panels: Record<string, unknown> = { 'microsoft-365': tenant, 'active-directory': directory, configuration };
schemaRoutes.get('/ui/object-details/:id', async (request, response) => {
  await delay();
  const id = String(request.params.id);
  if (!Object.hasOwn(panels, id)) { response.status(404).json({ message: 'Object schema not found' }); return; }
  response.json(panels[id]);
});

