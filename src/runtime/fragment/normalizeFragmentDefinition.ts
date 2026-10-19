import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import type { ComponentDefinition } from "../rendering/types";
import type { ScopeDefinition } from "../shared/types";
import { jsonLiteral, validateScope, validateTree } from "../shared/validation";
import type {
  FragmentDefinition,
  NormalizedFragmentDefinition,
  NormalizedLoadedFragment,
  LoadedSchemaDefinition,
} from "./types";

function object(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(label + " must be an object");
}
function checkedJson(value: unknown) {
  jsonLiteral(value, "remote definition");
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 1_048_576)
    throw new Error("Remote definition exceeds 1 MiB limit");
}
function normalizedTree(value: unknown): ComponentDefinition {
  const explicit = new Set<string>();
  let count = 0;
  const inspect = (node: unknown, depth = 0) => {
    if (depth > 64 || ++count > 1000)
      throw new Error("Fragment tree exceeds depth/node limit");
    object(node, "component");
    if (typeof node.type !== "string" || !node.type)
      throw new Error("component.type must be a nonempty string");
    if (node.id !== undefined) {
      if (typeof node.id !== "string" || !node.id)
        throw new Error("component.id must be a nonempty string");
      if (explicit.has(node.id))
        throw new Error("Duplicate component ID: " + node.id);
      explicit.add(node.id);
    }
    if (node.children !== undefined) {
      if (!Array.isArray(node.children))
        throw new Error("children must be an array");
      node.children.forEach((child) => inspect(child, depth + 1));
    }
    if (node.loading !== undefined) inspect(node.loading, depth + 1);
    if (node.error !== undefined) inspect(node.error, depth + 1);
  };
  inspect(value);
  const used = new Set(explicit);
  const normalize = (
    node: Record<string, unknown>,
    path: string,
  ): ComponentDefinition => {
    let id = node.id as string | undefined;
    if (id === undefined) {
      const base = "fragment.node." + path;
      id = base;
      for (let suffix = 1; used.has(id); suffix++) id = base + "~" + suffix;
      used.add(id);
    }
    return {
      ...node,
      id,
      ...(node.children === undefined
        ? {}
        : {
            children: (node.children as Record<string, unknown>[]).map(
              (child, index) => normalize(child, path + ".children." + index),
            ),
          }),
      ...(node.loading === undefined
        ? {}
        : {
            loading: normalize(
              node.loading as Record<string, unknown>,
              path + ".loading",
            ),
          }),
      ...(node.error === undefined
        ? {}
        : {
            error: normalize(
              node.error as Record<string, unknown>,
              path + ".error",
            ),
          }),
    } as ComponentDefinition;
  };
  return normalize(structuredClone(value) as Record<string, unknown>, "root");
}

/** The wire's state template adapts to the existing RuntimeScope initialState. */
export function normalizeFragmentDefinition(
  value: unknown,
  registry: ComponentRegistry,
): NormalizedFragmentDefinition {
  checkedJson(value);
  object(value, "fragment");
  if (value.type !== "fragment")
    throw new Error("FragmentDefinition.type must be fragment");
  for (const key of Object.keys(value))
    if (
      ![
        "type",
        "id",
        "state",
        "dataSources",
        "actions",
        "schemaSources",
        "root",
      ].includes(key)
    )
      throw new Error("Unsupported fragment field: " + key);
  if (value.id !== undefined && (typeof value.id !== "string" || !value.id))
    throw new Error("fragment.id must be a nonempty string");
  object(value.root, "fragment.root");
  const copy = structuredClone(value) as unknown as FragmentDefinition;
  const dataSources = copy.dataSources ?? {};
  object(dataSources, "dataSources");
  for (const source of Object.values(dataSources)) {
    if (
      source &&
      typeof source === "object" &&
      source.load?.strategy === "onInit"
    )
      source.load.strategy = "onScopeInit";
  }
  const definition: NormalizedFragmentDefinition = {
    type: "fragment",
    id: copy.id ?? "fragment",
    state: copy.state ?? {},
    dataSources: dataSources as NormalizedFragmentDefinition["dataSources"],
    actions: copy.actions ?? {},
    ...(copy.schemaSources === undefined
      ? {}
      : { schemaSources: copy.schemaSources }),
    root: normalizedTree(copy.root),
  };
  // Explicit null is malformed, rather than an instruction to apply defaults.
  for (const key of ["state", "dataSources", "actions"] as const)
    if (Object.hasOwn(value, key)) object(value[key], key);
  const scope = {
    id: definition.id,
    initialState: definition.state,
    dataSources: definition.dataSources,
    actions: definition.actions,
    schemaSources: definition.schemaSources,
  };
  validateScope(scope, "fragment");
  validateTree(definition.root, scope, registry, false);
  return definition;
}

/** Wrapping old trees must not change their host-owned state/actions. */
export function normalizeLoadedFragment(
  value: unknown,
  host: ScopeDefinition,
  registry: ComponentRegistry,
): NormalizedLoadedFragment {
  checkedJson(value);
  object(value, "remote definition");
  if (value.type === "fragment")
    return {
      scope: "fragment",
      definition: normalizeFragmentDefinition(value, registry),
    };
  const root = normalizedTree(value);
  validateTree(root, host, registry, false);
  return {
    scope: "host",
    definition: {
      type: "fragment",
      id: "legacy.fragment",
      state: {},
      dataSources: {},
      actions: {},
      root,
    },
  };
}

export function validateLoadedFragment(
  value: unknown,
  host: ScopeDefinition,
  registry: ComponentRegistry,
): asserts value is LoadedSchemaDefinition {
  normalizeLoadedFragment(value, host, registry);
}

export function validateFragmentDefinition(
  value: unknown,
  registry: ComponentRegistry,
): asserts value is FragmentDefinition {
  normalizeFragmentDefinition(value, registry);
}
