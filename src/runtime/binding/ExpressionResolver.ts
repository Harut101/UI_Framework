import { getPath, pathParts } from './paths';
export { getPath, pathParts, setPath } from './paths';
import { resolveScopePath, readScopedPath } from '../shared/scopeAddress';
import type { ExpressionContext } from "../shared/types";

/** Address a supplied snapshot, never the mutable environment's current store. */
function scopeRoots(context: ExpressionContext) {
  const { state, scope } = context;
  if (!scope) {
    // Unscoped callers retain the original view projection during migration.
    const local = context.scopeId === undefined ? undefined
      : Object.hasOwn(state.fragments, context.scopeId) ? state.fragments[context.scopeId] : undefined;
    return {
      $state: context.scopeId === undefined ? state.viewState : local?.state,
      $data: context.scopeId === undefined ? state.viewData : local?.data,
      $viewState: state.viewState, $viewData: state.viewData,
      $appState: state.appState, $appData: state.appData,
    };
  }
  return Object.fromEntries((['$state', '$data', '$viewState', '$viewData', '$appState', '$appData'] as const).map(root => {
    const address = resolveScopePath(root, scope);
    return [root, address ? readScopedPath(state, address) : undefined];
  }));
}

export class ExpressionResolver {
  /** URI path templates share the safe resolver; each substitution is encoded as one segment. */
  resolvePath(template: string, context: ExpressionContext): string {
    return template.replace(/\$[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_-]+)*/g, token => {
      const value = this.resolve(token, context);
      if ((typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') || value === '')
        throw new Error('Unresolved request path expression: ' + token);
      return encodeURIComponent(String(value));
    });
  }
  resolve(value: unknown, context: ExpressionContext): unknown {
    if (typeof value === "string" && value.startsWith("$")) {
      const [namespace, ...parts] = value.split(".");
      const roots: Record<string, unknown> = {
        ...scopeRoots(context),
        $event: context.event,
        $response: context.response,
      };
      if (!Object.hasOwn(roots, namespace))
        throw new Error(`Unknown expression namespace: ${namespace}`);
      if (parts.length) pathParts(parts.join('.'));
      return getPath(roots[namespace], parts.join("."));
    }
    if (Array.isArray(value))
      return value.map((item) => this.resolve(item, context));
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          pathParts(key);
          return [key, this.resolve(item, context)];
        }),
      );
    }
    return value;
  }
}


