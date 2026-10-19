import type { JsonObject, JsonValue } from "../runtime/shared/json";
/** Guardian-compatible data contract. These objects describe links, never React nodes. */
export interface ChildrenSourceDefinition {
  request: {
    method?: "GET" | "POST";
    path: string;
    query?: JsonObject;
    body?: JsonValue;
  };
  /** Omit for {items: [...]}; use an empty string for a bare array. */
  itemsPath?: string;
}
export interface TreeDataNode {
  id: string;
  name?: string;
  label?: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  links?: TreeDataNode[];
  children?: TreeDataNode[];
  childLinksSourceUrl?: string;
  childrenSource?: ChildrenSourceDefinition;
  childrenOrders?: string[];
}
/** Prepared props: UI components need no knowledge of source URLs or data loading. */
export interface TreeItem {
  id: string;
  key: string;
  label: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  children: TreeItem[];
  expandable: boolean;
  childrenLoading: boolean;
  childrenError: string | null;
}
