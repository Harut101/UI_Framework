import type { RuntimeState, ScopeAddressContext, ScopedChangedPath } from './types';
import type { StateExpression } from './json';
import { getPath, pathParts } from '../binding/paths';

/** Shared namespace addressing for selectors and resource dependencies. */
export function resolveScopePath(expression: StateExpression, scope: ScopeAddressContext): ScopedChangedPath | undefined {
  const [root, ...parts] = expression.split('.');
  if (parts.length) pathParts(parts.join('.'));
  let scopeId: string | null;
  let area: ScopedChangedPath['area'];
  switch (root) {
    case '$state': scopeId = scope.scopeId; area = 'state'; break;
    case '$data': scopeId = scope.scopeId; area = 'data'; break;
    case '$viewState': scopeId = scope.viewScopeId; area = 'state'; break;
    case '$viewData': scopeId = scope.viewScopeId; area = 'data'; break;
    case '$appState': scopeId = scope.applicationScopeId; area = 'state'; break;
    case '$appData': scopeId = scope.applicationScopeId; area = 'data'; break;
    default: throw new Error('Invalid dependency namespace: ' + root);
  }
  return scopeId === null ? undefined : { scopeId, area, path: parts };
}

export function readScopedPath(state: RuntimeState, address: ScopedChangedPath): unknown {
  const { scopeId, area, path } = address;
  const root = state.applicationInstance === scopeId ? (area === 'state' ? state.appState : state.appData)
    : state.viewInstance === scopeId ? (area === 'state' ? state.viewState : state.viewData)
    : Object.hasOwn(state.fragments, scopeId) ? state.fragments[scopeId][area] : undefined;
  return getPath(root, path.join('.'));
}

