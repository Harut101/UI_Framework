import { Router } from 'express';
import { childNavigation, navigationItems } from '../data/navigation';
export const navigationRoutes = Router();
navigationRoutes.get('/app/navigation', async (_request, response) => {
  await new Promise(resolve => setTimeout(resolve, 140)); response.json({ items: navigationItems });
});
for (const [path, items] of Object.entries(childNavigation)) navigationRoutes.get('/v0/' + path, async (_request, response) => {
  await new Promise(resolve => setTimeout(resolve, 350)); response.json({ items });
});
