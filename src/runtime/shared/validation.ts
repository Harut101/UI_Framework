import { defaultRequestPolicy, resolveRequestPath, validateRequestPath, type RequestPolicy } from "../datasource/requestPolicy";
import { assertLocalStateTarget } from "../actions/handlers/stateTarget";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import { DependencyGraph } from "../datasource/DependencyGraph";
import { pathParts } from "../binding/ExpressionResolver";
import type {
  ApplicationDefinition,
  ScopeDefinition,
  ViewDefinition,
} from "../shared/types";

function object(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object`);
}
function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value)
    throw new Error(`${label} must be a nonempty string`);
}
export function jsonLiteral(
  value: unknown,
  label: string,
  ancestors = new Set<object>(),
  depth = 0,
): void {
  if (depth > 128) throw new Error(label + " exceeds JSON depth limit");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (value && typeof value === "object") {
    if (ancestors.has(value)) throw new Error(label + " contains cyclic JSON");
    if (
      !Array.isArray(value) &&
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    )
      throw new Error(label + " must contain plain JSON objects");
    ancestors.add(value);
    if (Array.isArray(value))
      value.forEach((item, index) =>
        jsonLiteral(item, label + "[" + index + "]", ancestors, depth + 1),
      );
    else
      for (const [key, descriptor] of Object.entries(
        Object.getOwnPropertyDescriptors(value),
      )) {
        pathParts(key);
        if (descriptor.get || descriptor.set)
          throw new Error(label + " cannot contain accessors");
        jsonLiteral(descriptor.value, label + "." + key, ancestors, depth + 1);
      }
    ancestors.delete(value);
    return;
  }
  throw new Error(label + " must be JSON serializable");
}
function expression(value: unknown) {
  if (typeof value === "string" && value.startsWith("$")) {
    const [root, ...parts] = value.split(".");
    if (
      ![
        "$state",
        "$data",
        "$viewState",
        "$viewData",
        "$appState",
        "$appData",
        "$event",
        "$response",
      ].includes(root)
    )
      throw new Error(`Unknown namespace: ${root}`);
    if (parts.length) pathParts(parts.join("."));
  } else if (Array.isArray(value)) value.forEach(expression);
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([key, entry]) => {
      pathParts(key);
      expression(entry);
    });
}
export function validateRequest(value: unknown, schemaExpressions = false) {
  object(value, "request");
  if (!["GET", "POST", "PUT", "DELETE"].includes(String(value.method)))
    throw new Error("Unsupported request method");
  text(value.path, "request.path");
  if (schemaExpressions && value.path.startsWith("$")) {
    if (!/^\$[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_-]+)*$/.test(value.path))
      throw new Error("request.path must be a single expression or a local /api/ template");
    expression(value.path);
  }
  for (const token of value.path.matchAll(
    /\$[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_-]+)*/g,
  ))
    expression(token[0]);
  if (!schemaExpressions && value.path.startsWith("$"))
    throw new Error("request.path expressions require a schema request; use a local /api/ template");
  if (!value.path.startsWith("$"))
    validateRequestPath(value.path, { allowedPathPrefixes: ["/"] });
  if (value.query !== undefined && !(schemaExpressions && typeof value.query === "string" && value.query.startsWith("$")))
    object(value.query, "request.query");
  if (value.params !== undefined) object(value.params, "request.params");
  expression(value.params);
  expression(value.query);
  expression(value.body);
}
/** Resolved values are literal data: never validate them as author expressions again. */
export function validateResolvedRequest(value: unknown, policy: RequestPolicy = defaultRequestPolicy) {
  object(value, "request");
  if (!["GET", "POST", "PUT", "DELETE"].includes(String(value.method)))
    throw new Error("Unsupported request method");
  text(value.path, "request.path");
  if (value.query !== undefined) object(value.query, "request.query");
  if (value.params !== undefined) object(value.params, "request.params");
  validateRequestPath(resolveRequestPath(value as unknown as import("../datasource/types").RequestDefinition), policy);
}
/** Shared validation for named and inline sources; no transport or scope creation. */
export function validateSchemaSource(
  value: unknown,
  scope: "app" | "view" | "fragment",
  inline = false,
) {
  object(value, "schemaSource");
  jsonLiteral(value, "schemaSource");
  if (typeof value.request === "string") {
    if (!/^\$(appState|appData|viewState|viewData|state|data)(\.[a-zA-Z0-9_-]+)*$/.test(value.request))
      throw new Error("schemaSource.request must be a state expression or request object");
    expression(value.request);
  } else {
    object(value.request, "schemaSource.request");
    if (Object.keys(value.request).some(key => !["method", "path", "query", "body"].includes(key)))
      throw new Error("Unknown schema request property");
    if (value.request.method !== undefined && !["GET", "POST"].includes(String(value.request.method)))
      throw new Error("Schema source method must be GET or POST");
    validateRequest({ ...value.request, method: value.request.method ?? "GET" }, true);
  }
  if (
    scope === "app" &&
    /\$(viewState|viewData)(?:\.|$)/.test(JSON.stringify(value.request))
  )
    throw new Error("Application schema sources have no owning view");
  const policy = inline ? value : value.load;
  object(policy, "schemaSource.load");
  if (!inline && policy.strategy !== "onDemand")
    throw new Error("Schema source strategy must be onDemand");
  if (
    inline &&
    Object.keys(value).some(
      (key) => !["request", "cache", "definitionCache"].includes(key),
    )
  )
    throw new Error("Unknown inline schema source property");
  if (policy.cache !== undefined && policy.definitionCache !== undefined)
    throw new Error("Use either cache or definitionCache, not both");
  const cache = policy.definitionCache ?? policy.cache ?? "none";
  if (!["none", "scope", "view", "application"].includes(String(cache)))
    throw new Error("Invalid schema cache policy");
  if (scope === "app" && cache === "view")
    throw new Error("Application schema source cannot use view cache");
}

export function validateScope(
  value: unknown,
  scope: "app" | "view" | "fragment",
): asserts value is ScopeDefinition {
  object(value, "definition");
  text(value.id, "definition.id");
  object(value.initialState, "initialState");
  jsonLiteral(value.initialState, "initialState");
  object(value.actions, "actions");
  object(value.dataSources, "dataSources");
  if (value.schemaSources !== undefined) {
    object(value.schemaSources, "schemaSources");
    for (const [id, source] of Object.entries(value.schemaSources)) {
      pathParts(id);
      validateSchemaSource(source, scope);
    }
  }
  const actions = value.actions;
  const named = (id: unknown) => {
    text(id, "action reference");
    if (!Object.hasOwn(actions, id))
      throw new Error(`Unknown named action: ${id}`);
  };
  for (const [id, definition] of Object.entries(value.dataSources)) {
    pathParts(id);
    object(definition, `datasource ${id}`);
    if (definition.type !== "api")
      throw new Error(
        `Unsupported datasource type: ${String(definition.type)}`,
      );
    validateRequest(definition.request);
    object(definition.load, `${id}.load`);
    if (
      ![
        "manual",
        "onScopeInit",
        ...(scope === "app"
          ? ["onAppInit"]
          : scope === "view"
            ? ["onViewInit"]
            : []),
      ].includes(String(definition.load.strategy))
    )
      throw new Error(`Invalid load strategy in ${scope} scope`);
    if (
      definition.load.reload !== undefined &&
      !["manual", "onDependencyChange"].includes(String(definition.load.reload))
    )
      throw new Error("Invalid reload strategy");
    const debounceMs = definition.load.debounceMs;
    if (
      debounceMs !== undefined &&
      (typeof debounceMs !== "number" ||
        !Number.isFinite(debounceMs) ||
        debounceMs < 0 ||
        debounceMs > 2_147_483_647)
    )
      throw new Error(
        "load.debounceMs must be a finite nonnegative delay within the timer range",
      );
    if (definition.dependsOn !== undefined) {
      if (!Array.isArray(definition.dependsOn))
        throw new Error("dependsOn must be an array");
      definition.dependsOn.forEach((path) => {
        text(path, "dependency path");
        if (
          !/^\$(appState|appData|viewState|viewData|state|data)(\.|$)/.test(
            path,
          )
        )
          throw new Error(`Invalid dependency: ${path}`);
        expression(path);
      });
    }
  }
  for (const [id, action] of Object.entries(actions)) {
    pathParts(id);
    object(action, `action ${id}`);
    switch (action.type) {
      case "state.set":
        text(action.target, "target");
        assertLocalStateTarget(action.target);
        if (!Object.hasOwn(action, "value"))
          throw new Error("State action requires value");
        jsonLiteral(action.value, "action.value");
        expression(action.value);
        break;
      case "state.patch":
        if (action.target !== undefined) {
          text(action.target, "target");
          assertLocalStateTarget(action.target);
        }
        object(action.value, "patch value");
        jsonLiteral(action.value, "action.value");
        expression(action.value);
        break;
      case "sequence":
        if (!Array.isArray(action.actions))
          throw new Error("sequence.actions must be an array");
        action.actions.forEach(named);
        break;
      case "api.request":
        validateRequest(action.request);
        if (action.target !== undefined) {
          text(action.target, "response target");
          assertLocalStateTarget(action.target);
        }
        if (action.onSuccess !== undefined) named(action.onSuccess);
        if (action.onError !== undefined) named(action.onError);
        break;
      case "datasource.reload":
      case "datasource.invalidate":
        text(action.source, "datasource reference");
        if (!Object.hasOwn(value.dataSources, action.source))
          throw new Error(`Unknown datasource: ${action.source}`);
        break;
      case "navigate":
        text(action.to, "navigate.to");
        expression(action.to);
        break;
      case "notification.show":
        text(action.message, "notification.message");
        expression(action.message);
        if (
          action.tone !== undefined &&
          !["info", "success", "error"].includes(String(action.tone))
        )
          throw new Error("Invalid notification tone");
        break;
      default:
        throw new Error(`Unknown action type: ${String(action.type)}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error(`Circular action reference: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const action = actions[id] as Record<string, unknown>;
    if (action.type === "sequence") (action.actions as string[]).forEach(visit);
    if (action.type === "api.request") {
      if (action.onSuccess) visit(String(action.onSuccess));
      if (action.onError) visit(String(action.onError));
    }
    visiting.delete(id);
    visited.add(id);
  };
  Object.keys(actions).forEach(visit);
  new DependencyGraph(
    value.dataSources as ScopeDefinition["dataSources"],
    scope,
  );
}
export function validateTree(
  root: unknown,
  scope: ScopeDefinition,
  registry: ComponentRegistry,
  allowOutlet: boolean,
): number {
  const ids = new Set<string>();
  let outlets = 0;
  const visit = (value: unknown) => {
    object(value, "component");
    text(value.id, "component.id");
    text(value.type, "component.type");
    if (ids.has(value.id))
      throw new Error(`Duplicate component ID: ${value.id}`);
    ids.add(value.id);
    if (value.type === "route-outlet") {
      if (!allowOutlet)
        throw new Error("route-outlet belongs in the application shell");
      outlets++;
    } else if (!registry.has(value.type))
      throw new Error(`Unknown component type: ${value.type}`);
    if (value.type === "data-tree") {
      object(value.props, "data-tree.props");
      text(value.props.component, "data-tree component");
      if (
        value.props.component === "data-tree" ||
        !registry.has(value.props.component)
      )
        throw new Error("Invalid data-tree component");
    }
    if (value.type === "schema-outlet") {
      if (typeof value.source === "string") {
        text(value.source, "schema-outlet.source");
        if (
          !scope.schemaSources ||
          !Object.hasOwn(scope.schemaSources, value.source)
        )
          throw new Error("Unknown schema source: " + value.source);
      } else
        validateSchemaSource(
          value.source,
          allowOutlet ? "app" : "fragment",
          true,
        );
      if (value.lifecycle !== undefined) {
        object(value.lifecycle, "schema-outlet.lifecycle");
        if (
          Object.keys(value.lifecycle).some((key) => key !== "scopeLifetime") ||
          (value.lifecycle.scopeLifetime !== undefined &&
            !["activation", "outlet"].includes(
              String(value.lifecycle.scopeLifetime),
            ))
        )
          throw new Error("Invalid fragment scopeLifetime");
      }
      if (
        value.enabled !== undefined &&
        typeof value.enabled !== "string" &&
        typeof value.enabled !== "boolean"
      )
        throw new Error("enabled must be an expression or boolean");
      if (typeof value.enabled === "string" && !value.enabled.startsWith("$"))
        throw new Error("enabled must reference a namespace expression");
      if (
        value.key !== undefined &&
        value.key !== null &&
        !["string", "number", "boolean"].includes(typeof value.key)
      )
        throw new Error("Fragment key must be scalar");
      expression(value.enabled);
      expression(value.key);
      if (value.loading !== undefined) visit(value.loading);
      if (value.error !== undefined) visit(value.error);
    }
    if (value.props !== undefined) {
      object(value.props, "props");
      jsonLiteral(value.props, "props");
    }
    if (value.bindings !== undefined) {
      object(value.bindings, "bindings");
      for (const binding of Object.values(value.bindings)) {
        let source: unknown;
        if (typeof binding === "string") source = binding;
        else {
          object(binding, "binding");
          source = binding.source;
          if (Object.hasOwn(binding, "default"))
            jsonLiteral(binding.default, "binding.default");
        }
        text(source, "binding.source");
        if (!source.startsWith("$"))
          throw new Error("Bindings must reference an expression");
        expression(source);
      }
    }
    if (value.visibility !== undefined) {
      if (
        typeof value.visibility !== "string" &&
        typeof value.visibility !== "boolean"
      )
        throw new Error("visibility must be an expression or boolean");
      if (
        typeof value.visibility === "string" &&
        !value.visibility.startsWith("$")
      )
        throw new Error("visibility must reference a namespace expression");
      expression(value.visibility);
    }
    if (value.handlers !== undefined) {
      object(value.handlers, "handlers");
      for (const [prop, handler] of Object.entries(value.handlers)) {
        if (value.bindings && Object.hasOwn(value.bindings as object, prop))
          throw new Error("Component " + String(value.id) + ".bindings." + prop + " conflicts with handlers." + prop);
        object(handler, "handler");
        text(handler.action, "handler.action");
        if (Object.keys(handler).length !== 1)
          throw new Error("Handlers reference named actions only");
        if (!Object.hasOwn(scope.actions, handler.action))
          throw new Error(`Unknown handler action: ${handler.action}`);
      }
    }
    if (value.children !== undefined) {
      if (!Array.isArray(value.children))
        throw new Error("children must be an array");
      value.children.forEach(visit);
    }
  };
  visit(root);
  return outlets;
}
export function validateViewDefinition(
  value: unknown,
  registry: ComponentRegistry,
): asserts value is ViewDefinition {
  validateScope(value, "view");
  const view = value as unknown as Record<string, unknown>;
  text(view.title, "view.title");
  validateTree(view.root, value, registry, false);
}
export function validateApplicationDefinition(
  value: unknown,
  registry: ComponentRegistry,
): asserts value is ApplicationDefinition {
  validateScope(value, "app");
  const application = value as ScopeDefinition & Record<string, unknown>;
  if (validateTree(application.shell, value, registry, true) !== 1)
    throw new Error("Application shell needs exactly one route-outlet");
  for (const property of ["routes", "views"]) {
    if (Object.hasOwn(value, property))
      throw new Error("Application." + property + " is not supported; use viewSource");
  }
  object(application.viewSource, "viewSource");
  jsonLiteral(application.viewSource, "viewSource");
  if (
    Object.keys(application.viewSource).some(
      (key) => !["request", "pathQueryParam", "onLoaded"].includes(key),
    )
  )
    throw new Error("Unknown viewSource property");
  validateSchemaSource({ request: application.viewSource.request }, "app", true);
  if (application.viewSource.pathQueryParam !== undefined) {
    text(application.viewSource.pathQueryParam, "viewSource.pathQueryParam");
    pathParts(application.viewSource.pathQueryParam);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(application.viewSource.pathQueryParam))
      throw new Error("Invalid viewSource.pathQueryParam");
  }
  if (application.viewSource.onLoaded !== undefined) {
    text(application.viewSource.onLoaded, "viewSource.onLoaded");
    if (!Object.hasOwn(value.actions, application.viewSource.onLoaded))
      throw new Error("Unknown viewSource action: " + application.viewSource.onLoaded);
  }
}

export function validateFragment(
  value: unknown,
  scope: ScopeDefinition,
  registry: ComponentRegistry,
): asserts value is import("../rendering/types").ComponentDefinition {
  // The same tree validator is used for initial and remotely loaded trees.
  jsonLiteral(value, "fragment");
  validateTree(value, scope, registry, false);
}
