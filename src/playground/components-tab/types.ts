import type { ComponentProps } from 'react';
import type { sharedComponents, ComponentSchemaType } from '../../components/registry';
import type { ComponentDefinition } from '../../runtime/rendering/types';
import type { ActionDefinition } from '../../runtime/actions/types';
export type CatalogCategory = 'Primitives' | 'Layout' | 'Navigation & data' | 'Reporting' | 'Users';
export interface PropDocumentation { type: string; description: string; required?: boolean; defaultValue?: string }
export interface CallbackDocumentation { signature: string; description: string }
type Props<K extends ComponentSchemaType> = ComponentProps<(typeof sharedComponents)[K]>;
type CallbackKeys<P> = { [K in keyof P]-?: NonNullable<P[K]> extends (...args: never[]) => unknown ? K : never }[keyof P];
export interface CatalogEntry {
  name: string;
  type: ComponentSchemaType;
  category: CatalogCategory;
  description: string;
  props: Record<string, PropDocumentation>;
  callbacks: Record<string, CallbackDocumentation>;
  reactExample: string;
  schema: ComponentDefinition;
  actions: Record<string, ActionDefinition>;
}
export type TypedCatalogEntry<K extends ComponentSchemaType> = Omit<CatalogEntry, 'type' | 'props' | 'callbacks' | 'schema'> & {
  type: K;
  props: { [P in Exclude<keyof Props<K>, CallbackKeys<Props<K>>>]-?: PropDocumentation };
  callbacks: { [P in CallbackKeys<Props<K>>]-?: CallbackDocumentation };
  schema: ComponentDefinition & { type: K };
};
export function defineCatalogEntry<K extends ComponentSchemaType>(entry: TypedCatalogEntry<K>): CatalogEntry { return entry; }
