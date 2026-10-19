import { useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RuntimeContext } from "../rendering/RuntimeNode";
import type { DataEntry, RuntimeState } from "../shared/types";
import { readScopedPath } from "../shared/scopeAddress";
import {
  projectDataTree,
  readTreeNodes,
  type TreeProjection,
} from "./treeData";
interface Props {
  component: string;
  items?: unknown;
  expandedIds?: string[];
  error?: string | null;
  [prop: string]: unknown;
}
/** Generic infrastructure adapter: resolves tree DATA and supplies ordinary props/callbacks. */
export function DataTreeRuntime({
  component,
  items = [],
  expandedIds = [],
  error,
  ...props
}: Props) {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error("DataTreeRuntime requires a scope");
  const { runtime, registry } = context;
  const nodes = useMemo(() => {
    try {
      return { items: readTreeNodes(items), error: null };
    } catch (failure) {
      return { items: [], error: String(failure) };
    }
  }, [items]);
  const projection = useSelector(
    (state: RuntimeState) => {
      try {
        const data = readScopedPath(state, {
          scopeId: runtime.scopeId,
          area: "data",
          path: [],
        }) as Record<string, DataEntry> | undefined;
        return projectDataTree(
          nodes.items,
          expandedIds,
          data ?? {},
          runtime.environment.resolver,
          { state, scope: runtime },
          runtime.environment.requestPolicy,
        );
      } catch (failure) {
        return {
          items: [],
          requests: [],
          requestsKey: "[]",
          signature: String(failure),
          error: String(failure),
        };
      }
    },
    (left, right) => left.signature === right.signature,
  );
  // Status updates need not release/reacquire unchanged data resources.
  const requests = useMemo(() => projection.requests, [projection.requestsKey]);
  useEffect(() => {
    if (!runtime.active()) return;
    const leases = requests.map(({ request }) =>
      runtime.dataSources.acquireInline(request),
    );
    return () => leases.forEach((lease) => lease.release());
  }, [runtime, requests]);
  const Component = registry.get(component);
  return (
    <Component
      {...props}
      items={projection.items}
      expandedIds={expandedIds}
      error={
        error ??
        nodes.error ??
        ("error" in projection ? projection.error : null)
      }
      onRetryChildren={({ value }: { value: string }) => {
        const resource = (projection as TreeProjection).requests.find(
          (request) => request.key === value,
        );
        if (resource && runtime.active())
          void runtime.dataSources.reload(resource.id);
      }}
    />
  );
}
