import type { RequestDefinition } from "./types";

/** Host policy for resolved local HTTP URLs, independent of schema expressions. */
export interface RequestPolicy {
  readonly allowedPathPrefixes: readonly string[];
}
export const defaultRequestPolicy: RequestPolicy = Object.freeze({
  allowedPathPrefixes: Object.freeze(["/api/"]),
});
export function resolveRequestPath(request: RequestDefinition): string {
  return request.path.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_token, key: string) => {
    const value = request.params?.[key];
    if ((typeof value !== "string" && typeof value !== "number") || value === "")
      throw new Error("Missing request path parameter: " + key);
    return encodeURIComponent(String(value));
  });
}
/** Apply the same normalized-path policy to literals, templates and bound requests. */
export function validateRequestPath(
  path: unknown,
  policy: RequestPolicy = defaultRequestPolicy,
): asserts path is string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") ||
      path.includes("\\") || [...path].some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127))
    throw new Error("request.path must be a local absolute path");
  const url = new URL(path, "http://runtime.invalid");
  if (url.hash || !policy.allowedPathPrefixes.some(prefix =>
    prefix.startsWith("/") && (url.pathname === prefix ||
      url.pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/"))))
    throw new Error("request.path is outside the allowed path prefixes");
}
