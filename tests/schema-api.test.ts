import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
import { reportingApplicationDefinition, reportingCatalogDefinition } from '../src/schemas/reporting';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { validateFragment } from '../src/runtime/shared/validation';
let server: Server; let base: string;
beforeAll(async () => { server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No server'); base = `http://127.0.0.1:${address.port}`; });
afterAll(async () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const registry = registerApplicationComponents(createComponentRegistry());
describe('remote schema HTTP endpoints', () => {
  it('serves navigation as data, with all parent definitions supplied by the backend', async () => {
    const response = await fetch(base + '/api/app/navigation'); const navigation = await response.json();
    expect(response.ok).toBe(true);
    expect(navigation.items).toContainEqual(expect.objectContaining({ id: 'recovery', name: 'Forest Recovery', childLinksSourceUrl: 'v0/recovery/effectiveNavigationProperties' }));
    expect(JSON.stringify(reportingApplicationDefinition)).not.toMatch(/Forest Recovery|forestRecovery|effectiveNavigationProperties/);
    const children = await (await fetch(base + '/api/v0/recovery/effectiveNavigationProperties')).json();
    expect(children.items).toContainEqual(expect.objectContaining({ id: 'jobs', name: 'Recovery Jobs' }));
    expect(JSON.stringify(children)).not.toMatch(/handlers|bindings|schema-outlet/);
  });
  it('serves different generic component trees per object over real HTTP', async () => {
    const trees = await Promise.all(['microsoft-365', 'active-directory', 'configuration'].map(async id => { const response = await fetch(base + '/api/ui/object-details/' + id); const value: unknown = await response.json(); validateFragment(value, reportingCatalogDefinition, registry); return JSON.stringify(value); }));
    expect(trees[0]).toContain('text-input'); expect(trees[1]).toContain('warning-banner'); expect(trees[1]).toContain('tabs'); expect(trees[2]).toContain('policy-card');
    expect(new Set(trees).size).toBe(3); expect(trees.join()).not.toMatch(/Fluent|Regular/);
    expect(JSON.stringify(reportingCatalogDefinition.root)).not.toContain('tenant-settings');
  });
  it('returns a safe JSON 404 for unavailable content', async () => { const response = await fetch(base + '/api/ui/object-details/missing'); expect(response.status).toBe(404); expect(await response.json()).toEqual({ message: 'Object schema not found' }); });
});

