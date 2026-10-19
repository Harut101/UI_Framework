import type { RequestDefinition } from "./types";
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, ordered((value as Record<string, unknown>)[key])]),
    );
  return value;
}
/** Collision-free key without dotted-path separators; object property order is irrelevant. */
export const inlineSourceId = (request: RequestDefinition) =>
  "inline:" +
  encodeURIComponent(JSON.stringify(ordered(request))).replaceAll(".", "%2E");
