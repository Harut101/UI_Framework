import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
import { navigationItems, childNavigation } from '../backend/data/navigation';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import type { TreeDataNode } from '../src/contracts/tree';
let server: Server, base: string;
beforeAll(async () => { server = app.listen(0, '127.0.0.1'); await new Promise<void>(done => server.once('listening', done)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address'); base = 'http://127.0.0.1:' + address.port; });
afterAll(async () => new Promise<void>((resolve,reject) => server.close(error => error ? reject(error) : resolve())));
const registry = registerApplicationComponents(createComponentRegistry());
describe('backend resolves complete ViewDefinitions from navigation paths', () => {
  it('every static, remote and hybrid navigation leaf resolves to a valid full View', async () => {
    const paths = new Set<string>();
    const visit = (nodes: TreeDataNode[]) => nodes.forEach(node => { if (node.href) paths.add(node.href); visit(node.links ?? []); visit(node.children ?? []); });
    visit(navigationItems); Object.values(childNavigation).forEach(visit);
    expect(paths.size).toBeGreaterThan(8);
    await Promise.all([...paths].map(async path => {
      const response = await fetch(base + '/api/ui/views?path=' + encodeURIComponent(path));
      expect(response.status, path).toBe(200); const definition = await response.json();
      expect(() => validateViewDefinition(definition, registry), path).not.toThrow();
      expect(definition).toHaveProperty('initialState'); expect(definition).toHaveProperty('actions'); expect(definition).toHaveProperty('dataSources');
    }));
  });
  it('supports root and direct entry and returns controlled errors for missing paths', async () => {
    for (const path of ['/application','/application/','/application/users']) expect((await fetch(base + '/api/ui/views?path=' + encodeURIComponent(path))).status).toBe(200);
    expect((await fetch(base + '/api/ui/views?path=' + encodeURIComponent('/application/missing'))).status).toBe(404);
    for (const query of ['', '?path=https://example.com', '?path=//example.com', '?path=a&path=b'])
      expect((await fetch(base + '/api/ui/views' + query)).status).toBe(400);
  });
});
