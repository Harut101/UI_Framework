import type { SchemaRequestSource } from "../schema/types";
/** Resolve browser pathnames on the server, without per-navigation route registration. */
export interface ViewSourceDefinition {
  request: SchemaRequestSource;
  /** Application-local named action with {pathname, viewId, title}. */
  onLoaded?: string;
  /** Query parameter receiving the browser pathname. Defaults to path. */
  pathQueryParam?: string;
}
