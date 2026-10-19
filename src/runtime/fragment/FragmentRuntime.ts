import { RuntimeScope } from '../shared/RuntimeScope';
import type { ComponentRegistry } from '../rendering/ComponentRegistry';
import { normalizeFragmentDefinition } from './normalizeFragmentDefinition';
import type { ScopeOrigin } from '../shared/types';

/** A small adapter around the common scope, with no independent runtime services. */
export class FragmentRuntime {
  readonly definition;
  readonly scope: RuntimeScope;
  constructor(definition: unknown, parent: RuntimeScope, registry: ComponentRegistry, origin?: Readonly<ScopeOrigin>) {
    this.definition = normalizeFragmentDefinition(definition, registry);
    let depth = 0;
    for (let owner: RuntimeScope | null = parent; owner; owner = owner.parentScope)
      if (owner.type === 'fragment' && ++depth >= 32) throw new Error('Fragment nesting exceeds 32 scopes');
    this.scope = new RuntimeScope({
      id: this.definition.id, initialState: this.definition.state,
      dataSources: this.definition.dataSources, actions: this.definition.actions,
      schemaSources: this.definition.schemaSources,
    }, 'fragment', parent.environment, parent, origin && Object.freeze({ ...origin }));
  }
  get scopeId() { return this.scope.scopeId; }
  initialize() { this.scope.initialize(); return this; }
  start() { this.scope.start(); }
  dispose() { this.scope.dispose(); }
}

