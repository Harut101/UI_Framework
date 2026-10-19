import type { RuntimeStore } from "../redux/createRuntimeStore";
import type { ExpressionResolver } from "../binding/ExpressionResolver";
import type { DataSourceManager } from "../datasource/DataSourceManager";
import type { Diagnostics } from "../shared/Diagnostics";
import type { ApiTransport } from "../datasource/api";
import type { Scope } from "../shared/json";
import type { RuntimeScope } from '../shared/RuntimeScope';
export interface ActionServices {
  readonly runtimeScope: RuntimeScope;
  readonly scope: Scope;
  readonly instance: string;
  store: RuntimeStore;
  resolver: ExpressionResolver;
  dataSources: DataSourceManager;
  diagnostics: Diagnostics;
  transport: ApiTransport;
  navigate: (to: string) => void;
  notify: (message: string, tone: "success" | "error" | "info") => void;
  active: () => boolean;
  signal: AbortSignal;
}

