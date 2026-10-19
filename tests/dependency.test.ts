import { describe, expect, it } from 'vitest';
import { DependencyGraph } from '../src/runtime/datasource/DependencyGraph';
import type { DataSourceDefinition } from '../src/runtime/shared/types';

const source: DataSourceDefinition = { type: 'api', request: { method: 'GET', path: '/api/items' }, load: { strategy: 'onViewInit' } };

describe('dependency namespace isolation', () => {
  it('does not confuse app datasource IDs with view datasource IDs', () => {
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$appData.items.data'] } }, 'view')).not.toThrow();
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$data.items.data'] } }, 'view')).toThrow('Circular');
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$viewData.items.data'] } }, 'view')).toThrow('Circular');
  });
  it('checks app-local cycles through both application data aliases', () => {
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$appData.items.data'] } }, 'app')).toThrow('Circular');
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$data.items.data'] } }, 'app')).toThrow('Circular');
    // An application scope has no owning view; this is not an app-local data edge.
    expect(() => new DependencyGraph({ items: { ...source, dependsOn: ['$viewData.items.data'] } }, 'app')).not.toThrow();
  });
});
