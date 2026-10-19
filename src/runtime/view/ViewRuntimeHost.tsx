import { useCallback } from 'react';
import { RuntimeScopeHost } from '../rendering/RuntimeScopeHost';
import type { ComponentRegistry } from '../rendering/ComponentRegistry';
import type { RuntimeEnvironment } from '../shared/RuntimeEnvironment';
import { ViewRuntime } from './ViewRuntime';
import type { ViewDefinition } from './types';

export function ViewRuntimeHost({ definition, environment, registry }: {
  definition: ViewDefinition; environment: RuntimeEnvironment; registry: ComponentRegistry;
}) {
  const create = useCallback(() => ({ scope: new ViewRuntime(definition, environment), root: definition.root }), [definition, environment]);
  return <RuntimeScopeHost create={create} registry={registry}/>;
}
