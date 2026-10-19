import type { ExpressionResolver } from "../binding/ExpressionResolver";
import type { ExpressionContext } from "../shared/types";
import type { RequestDefinition } from "../datasource/types";
import type { RequestPolicy } from "../datasource/requestPolicy";
import { defaultRequestPolicy } from "../datasource/requestPolicy";
import { validateResolvedRequest } from "../shared/validation";
import type { SchemaRequestSource } from "./types";

/** A whole request binding is already literal data, including its body/query strings. */
export function resolveSchemaRequest(
  source: SchemaRequestSource,
  resolver: ExpressionResolver,
  context: ExpressionContext,
  policy: RequestPolicy = defaultRequestPolicy,
): RequestDefinition {
  const value = resolver.resolve(source, context);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Resolved schema request must be an object");
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).some(key => !["method", "path", "query", "body"].includes(key)))
    throw new Error("Unknown schema request property");
  const request = { ...raw, method: raw.method ?? "GET" } as unknown as RequestDefinition;
  if (typeof source !== "string")
    request.path = resolver.resolvePath(source.path, context);
  if (!["GET", "POST"].includes(request.method))
    throw new Error("Schema source method must be GET or POST");
  validateResolvedRequest(request, policy);
  return request;
}
