import { fragmentRoutes } from './routes/fragments';
import { navigationRoutes } from './routes/navigation';
import { schemaRoutes } from './routes/schema';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { healthRoutes } from './routes/health';
import { demoRoutes } from './routes/demo';
import { itemsRoutes } from './routes/items';
import { reportingRoutes } from './routes/reporting';
import { usersRoutes } from './routes/users';
export const app = express();
app.use(express.json());
app.use('/api', schemaRoutes, fragmentRoutes, navigationRoutes, healthRoutes, demoRoutes, itemsRoutes, reportingRoutes, usersRoutes);
app.use('/api', (_request, response) => response.status(404).json({ message: 'Unknown API endpoint' }));
const directory = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(directory, '../dist')));
app.get('/{*path}', (_request, response) => response.sendFile(path.resolve(directory, '../dist/index.html')));


