import type { ComponentDefinition } from "../rendering/types";
import type { JsonObject } from "../shared/json";
import type { ActionDefinition } from "../actions/types";
import type { DataSourceDefinition } from "../datasource/types";
import type { SchemaSourceDefinition } from "../schema/types";

/** Remote fragment nodes may omit ids; normalization assigns stable tree paths. */
export interface FragmentComponentDefinition extends Omit<
  ComponentDefinition,
  "id" | "children" | "loading" | "error"
> {
  id?: string;
  children?: FragmentComponentDefinition[];
  loading?: FragmentComponentDefinition;
  error?: FragmentComponentDefinition;
}
export interface FragmentDataSourceDefinition extends Omit<
  DataSourceDefinition,
  "load"
> {
  load: Omit<DataSourceDefinition["load"], "strategy"> & {
    strategy: "onInit" | "onScopeInit" | "manual";
  };
}
export interface FragmentDefinition {
  type: "fragment";
  id?: string;
  state?: JsonObject;
  dataSources?: Record<string, FragmentDataSourceDefinition>;
  actions?: Record<string, ActionDefinition>;
  schemaSources?: Record<string, SchemaSourceDefinition>;
  root: FragmentComponentDefinition;
}
export interface NormalizedFragmentDefinition {
  type: "fragment";
  id: string;
  state: JsonObject;
  dataSources: Record<string, DataSourceDefinition>;
  actions: Record<string, ActionDefinition>;
  schemaSources?: Record<string, SchemaSourceDefinition>;
  root: ComponentDefinition;
}
export type LoadedSchemaDefinition =
  | FragmentComponentDefinition
  | FragmentDefinition;
export interface NormalizedLoadedFragment {
  /** Legacy response wrappers retain the host's state/actions and create no scope. */
  scope: "host" | "fragment";
  definition: NormalizedFragmentDefinition;
}
