import { Router } from 'express';
import { demoMessage } from '../data/demoMessage';
export const demoRoutes = Router();
demoRoutes.get('/demo-message', (_request, response) => response.json(demoMessage));
