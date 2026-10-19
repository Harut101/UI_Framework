import type { RuntimeState, ScopedChangedPath } from '../shared/types';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Redux snapshots produce storage addresses, independent of expression aliases. */
export function getChangedPaths(previous: RuntimeState, current: RuntimeState): ScopedChangedPath[] {
  const changes: ScopedChangedPath[] = [];
  const visit = (before: unknown, after: unknown, address: ScopedChangedPath) => {
    if (Object.is(before, after)) return;
    if (record(before) && record(after)) {
      const count = changes.length;
      for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const child = { ...address, path: [...address.path, name] };
        if (Object.hasOwn(before, name) !== Object.hasOwn(after, name)) changes.push(child);
        else visit(before[name], after[name], child);
      }
      if (changes.length === count) changes.push(address);
    } else changes.push(address);
  };
  const owner = (beforeId: string | null, afterId: string | null, beforeState: unknown, afterState: unknown, beforeData: unknown, afterData: unknown) => {
    if (beforeId === afterId) {
      if (afterId !== null) {
        visit(beforeState, afterState, { scopeId: afterId, area: 'state', path: [] });
        visit(beforeData, afterData, { scopeId: afterId, area: 'data', path: [] });
      }
    } else {
      for (const scopeId of new Set([beforeId, afterId])) if (scopeId !== null)
        changes.push({ scopeId, area: 'state', path: [] }, { scopeId, area: 'data', path: [] });
    }
  };
  owner(previous.applicationInstance, current.applicationInstance, previous.appState, current.appState, previous.appData, current.appData);
  owner(previous.viewInstance, current.viewInstance, previous.viewState, current.viewState, previous.viewData, current.viewData);
  if (previous.fragments !== current.fragments) {
    for (const scopeId of new Set([...Object.keys(previous.fragments), ...Object.keys(current.fragments)])) {
      const before = Object.hasOwn(previous.fragments, scopeId) ? previous.fragments[scopeId] : undefined;
      const after = Object.hasOwn(current.fragments, scopeId) ? current.fragments[scopeId] : undefined;
      if (!before || !after) changes.push({ scopeId, area: 'state', path: [] }, { scopeId, area: 'data', path: [] });
      else {
        visit(before.state, after.state, { scopeId, area: 'state', path: [] });
        visit(before.data, after.data, { scopeId, area: 'data', path: [] });
      }
    }
  }
  return changes;
}
