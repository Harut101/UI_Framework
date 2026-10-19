import type { JsonObject, JsonValue, Scope } from '../shared/json';
import type { ComponentDefinition } from '../rendering/types';
import type { LoadedSchemaDefinition } from '../fragment/types';

export type DefinitionCachePolicy = 'none' | 'scope' | 'view' | 'application';
export type DefinitionCacheSelection =
  | { definitionCache?: DefinitionCachePolicy; cache?: never }
  | { definitionCache?: never; cache?: DefinitionCachePolicy };
export interface SchemaRequestDefinition { method?: 'GET' | 'POST'; path: string; query?: JsonObject; body?: JsonValue }
export interface SchemaSourceDefinition {
  request: SchemaRequestDefinition;
  load: { strategy: 'onDemand' } & DefinitionCacheSelection;
}
/** Inline sources need no registration; cache is a definition-only compatibility alias. */
export type InlineSchemaSource = { request: SchemaRequestDefinition } & DefinitionCacheSelection;
export type SchemaSource = string | InlineSchemaSource;
export type FragmentScopeLifetime = 'activation' | 'outlet';
export type FragmentKey = string | number | boolean | null;
export interface SchemaFragmentEntry {
  source: string;
  key: FragmentKey;
  scope: Scope;
  owner: string;
  /** Request origin, distinct from the definition cache owner. */
  requestingScopeId?: string;
  cache: DefinitionCachePolicy;
  status: 'loading' | 'success' | 'error';
  loading: boolean;
  schema: LoadedSchemaDefinition | null;
  error: string | null;
  requestPath: string;
  /** Serializable resolved request fingerprint, never a live runtime handle. */
  requestIdentity?: string;
}
export type SchemaFragmentState = Record<string, SchemaFragmentEntry>;
export interface SchemaOutletDefinition extends ComponentDefinition {
  type: 'schema-outlet';
  source: SchemaSource;
  enabled?: import('../shared/json').Expression | boolean;
  key?: FragmentKey | import('../shared/json').Expression;
}
