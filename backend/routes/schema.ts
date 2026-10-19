import { Router, type Response } from 'express';
import tenant from '../data/ui/microsoft-365.json';
import directory from '../data/ui/active-directory.json';
import configuration from '../data/ui/configuration.json';
import userCreate from '../data/ui/panels/user.create.json';
import reportRun from '../data/ui/panels/report.run.json';
import { reports } from '../data/reports';
import type { FragmentDefinition, FragmentComponentDefinition } from '../../src/runtime/fragment/types';

// Backend composition only: legacy endpoints retain their bare-tree wire contract.
const fragmentPanels: Record<string, FragmentDefinition> = {
  'microsoft-365': {
    type: 'fragment', id: 'panel.microsoft-365',
    state: { tenantAlias: 'northwind.onmicrosoft.com' },
    actions: {
      setTenantAlias: { type: 'state.set', target: 'tenantAlias', value: '$event.value' },
      confirmObjectAction: { type: 'notification.show', message: 'Tenant settings previewed', tone: 'success' },
    },
    root: tenant as unknown as FragmentComponentDefinition,
  },
  'active-directory': {
    type: 'fragment', id: 'panel.active-directory', state: { activeTab: 'overview' },
    actions: {
      selectDetailsTab: { type: 'state.set', target: 'activeTab', value: '$event.value' },
      confirmObjectAction: { type: 'notification.show', message: 'Directory action previewed', tone: 'success' },
    },
    root: directory as unknown as FragmentComponentDefinition,
  },
  configuration: {
    type: 'fragment', id: 'panel.configuration',
    actions: { confirmObjectAction: { type: 'notification.show', message: 'Policy review previewed', tone: 'success' } },
    root: configuration as unknown as FragmentComponentDefinition,
  },
  'user.create': userCreate as FragmentDefinition,
  'report.run': reportRun as FragmentDefinition,
};

export const schemaRoutes = Router();
const delay = () => new Promise(resolve => setTimeout(resolve, 900));
const panels: Record<string, unknown> = { 'microsoft-365': tenant, 'active-directory': directory, configuration };
schemaRoutes.get('/ui/object-details/:id', async (request, response) => {
  await delay();
  const id = String(request.params.id);
  if (!Object.hasOwn(panels, id)) { response.status(404).json({ message: 'Object schema not found' }); return; }
  response.json(panels[id]);
});


// Endpoint selection belongs to the schema author / initiating action.
async function sendPanel(schema: unknown, contextId: unknown, response: Response) {
  if (typeof schema !== 'string' || !schema || schema.length > 128 ||
      (contextId !== undefined && (typeof contextId !== 'string' || contextId.length > 128))) {
    response.status(400).json({ message: 'Expected schema and optional contextId strings' }); return;
  }
  if (!Object.hasOwn(fragmentPanels, schema)) {
    response.status(404).json({ message: 'Panel schema not found' }); return;
  }
  if (schema === 'report.run' && !reports.some(report => report.id === contextId)) {
    response.status(404).json({ message: 'Report context not found' }); return;
  }
  await delay();
  const definition = structuredClone(fragmentPanels[schema]);
  definition.state = { ...definition.state, contextId: contextId ?? null };
  response.json(definition);
}
schemaRoutes.get(['/ui/panels', '/ui/object-panels'], async (request, response) => {
  await sendPanel(request.query.schema, request.query.contextId, response);
});
schemaRoutes.get('/ui/users/create', async (request, response) => {
  await sendPanel('user.create', request.query.contextId, response);
});
schemaRoutes.get('/ui/reports/run', async (request, response) => {
  await sendPanel('report.run', request.query.contextId, response);
});

schemaRoutes.post('/ui/reports/run', async (request, response) => {
  await sendPanel('report.run', request.body?.contextId, response);
});
