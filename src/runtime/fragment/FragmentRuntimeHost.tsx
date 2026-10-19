import { useCallback } from 'react';
import { RuntimeScopeHost } from '../rendering/RuntimeScopeHost';
import type { ComponentRegistry } from '../rendering/ComponentRegistry';
import type { RuntimeScope } from '../shared/RuntimeScope';
import { FragmentRuntime } from './FragmentRuntime';
import type { NormalizedFragmentDefinition } from './types';
import type { ScopeOrigin } from '../shared/types';

export function FragmentRuntimeHost({ definition, parent, registry, visible = true, origin }: {
  definition: NormalizedFragmentDefinition; parent: RuntimeScope; registry: ComponentRegistry; visible?: boolean; origin?: Readonly<ScopeOrigin>;
}) {
  const create = useCallback(() => {
    const fragment = new FragmentRuntime(definition, parent, registry, origin);
    return { scope: fragment.scope, root: fragment.definition.root };
  }, [definition, parent, registry, origin]);
  return <RuntimeScopeHost create={create} registry={registry} visible={visible}/>;
}

