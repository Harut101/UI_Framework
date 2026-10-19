import { defaultRequestPolicy, type RequestPolicy } from "../datasource/requestPolicy";
import type { TreeDataNode, TreeItem } from "../../contracts/tree";
import type {
  DataEntry,
  RequestDefinition,
  ExpressionContext,
} from "../shared/types";
import { inlineSourceId } from "../datasource/inlineRequest";
import { getPath } from "../binding/paths";
import { jsonLiteral, validateRequest, validateResolvedRequest } from "../shared/validation";
import type { ExpressionResolver } from "../binding/ExpressionResolver";

export function readTreeNodes(value: unknown): TreeDataNode[] {
  jsonLiteral(value, "tree data");
  let count = 0;
  const visit = (items: unknown, depth = 0): void => {
    if (!Array.isArray(items)) throw new Error("Tree items must be an array");
    if (depth > 32) throw new Error("Tree data exceeds nesting limit");
    for (const item of items) {
      if (++count > 1000) throw new Error("Tree data exceeds node limit");
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        !item.id ||
        typeof (item.label ?? item.name) !== "string"
      )
        throw new Error("Tree items require id and name/label");
      for (const key of ["href", "icon", "childLinksSourceUrl"])
        if (item[key] !== undefined && typeof item[key] !== "string")
          throw new Error("Invalid tree " + key);
      if (item.disabled !== undefined && typeof item.disabled !== "boolean")
        throw new Error("Invalid tree disabled");
      if (
        item.childrenOrders !== undefined &&
        (!Array.isArray(item.childrenOrders) ||
          item.childrenOrders.some((id: unknown) => typeof id !== "string"))
      )
        throw new Error("childrenOrders must contain ids");
      if (item.links !== undefined) visit(item.links, depth + 1);
      if (item.children !== undefined) visit(item.children, depth + 1);
      if (item.childrenSource !== undefined) {
        const source = item.childrenSource;
        if (!source || typeof source !== "object" || !source.request)
          throw new Error("childrenSource requires request");
        validateRequest({
          ...source.request,
          method: source.request.method ?? "GET",
        });
        if (
          source.itemsPath !== undefined &&
          typeof source.itemsPath !== "string"
        )
          throw new Error("childrenSource.itemsPath must be a string");
        if (source.itemsPath) getPath({}, source.itemsPath);
      }
    }
  };
  visit(value);
  return value as TreeDataNode[];
}
/** First position wins; later remote metadata wins; nested static links are combined. */
export function mergeTreeNodes(
  staticItems: readonly TreeDataNode[],
  remoteItems: readonly TreeDataNode[],
  order: readonly string[] = [],
): TreeDataNode[] {
  const merged = new Map<string, TreeDataNode>();
  for (const item of [...staticItems, ...remoteItems]) {
    const previous = merged.get(item.id);
    merged.set(
      item.id,
      previous
        ? {
            ...previous,
            ...item,
            label: item.label ?? item.name ?? previous.label ?? previous.name,
            links: mergeTreeNodes(
              [...(previous.links ?? []), ...(previous.children ?? [])],
              [...(item.links ?? []), ...(item.children ?? [])],
            ),
            children: undefined,
          }
        : item,
    );
  }
  const ranks = new Map([...new Set(order)].map((id, index) => [id, index]));
  return [...merged.values()].sort(
    (a, b) =>
      (ranks.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (ranks.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}
export interface TreeProjection {
  items: TreeItem[];
  requests: { key: string; id: string; request: RequestDefinition }[];
  requestsKey: string;
  signature: string;
}
export function projectDataTree(
  items: TreeDataNode[],
  expandedIds: readonly string[],
  data: Record<string, DataEntry>,
  resolver: ExpressionResolver,
  context: ExpressionContext,
  policy: RequestPolicy = defaultRequestPolicy,
): TreeProjection {
  const expanded = new Set(expandedIds);
  const requests: TreeProjection["requests"] = [];
  let count = 0;
  const visit = (nodes: TreeDataNode[], ancestry: string[] = []): TreeItem[] =>
    mergeTreeNodes(nodes, []).map((node) => {
      if (++count > 1000 || ancestry.length > 32)
        throw new Error("Expanded tree exceeds node/depth limit");
      const path = [...ancestry, node.id];
      const key = ancestry.length ? JSON.stringify(path) : node.id;
      const open = expanded.has(key);
      const staticItems = mergeTreeNodes(node.links ?? [], node.children ?? []);
      const hasSource = Boolean(
        node.childrenSource || node.childLinksSourceUrl,
      );
      let remote: TreeDataNode[] = [];
      let childrenError: string | null = null;
      let childrenLoading = false;
      if (open && hasSource)
        try {
          const url = node.childLinksSourceUrl;
          if (!node.childrenSource && url && /^(?:[a-z]+:|\/\/)/i.test(url))
            throw new Error("Child links must use a local API path");
          const source = node.childrenSource ?? {
            request: {
              path: url!.startsWith("/api/")
                ? url!
                : "/api/" + url!.replace(/^\/+/, ""),
            },
          };
          const request = resolver.resolve(
            { ...source.request, method: source.request.method ?? "GET" },
            context,
          ) as RequestDefinition;
          request.path = resolver.resolvePath(source.request.path, context);
          jsonLiteral(request, "children request");
          validateResolvedRequest(request, policy);
          const id = inlineSourceId(request);
          requests.push({ key, id, request });
          const entry = data[id];
          childrenLoading = !entry || entry.status === "idle" || entry.loading;
          childrenError = entry?.error ?? null;
          if (entry?.data !== null && entry?.data !== undefined)
            remote = readTreeNodes(
              getPath(
                entry.data,
                source.itemsPath ?? (Array.isArray(entry.data) ? "" : "items"),
              ),
            );
        } catch (error) {
          childrenError =
            error instanceof Error ? error.message : String(error);
          childrenLoading = false;
        }
      const children = open
        ? visit(mergeTreeNodes(staticItems, remote, node.childrenOrders), path)
        : [];
      return {
        id: node.id,
        key,
        label: node.label ?? node.name!,
        href: node.href,
        icon: node.icon,
        disabled: node.disabled,
        children,
        expandable: hasSource || staticItems.length > 0,
        childrenError,
        childrenLoading,
      };
    });
  const result = {
    items: visit(items),
    requests,
    requestsKey: JSON.stringify(requests),
  };
  return { ...result, signature: JSON.stringify(result) };
}
