import { validateResolvedRequest } from "../shared/validation";
import { defaultRequestPolicy, resolveRequestPath, type RequestPolicy } from "./requestPolicy";
import type { RequestDefinition, StateObject } from "../shared/types";

export type ApiTransport = (
  request: RequestDefinition,
  signal: AbortSignal,
) => Promise<unknown>;
export { resolveRequestPath } from "./requestPolicy";
export function createFetchTransport(policy: RequestPolicy = defaultRequestPolicy): ApiTransport {
  return async (request, signal) => {
    validateResolvedRequest(request, policy);
    const url = new URL(resolveRequestPath(request), window.location.origin);
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined && value !== null && value !== "")
        url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, {
      method: request.method,
      signal,
      headers:
        request.body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as StateObject;
      throw new Error(
        typeof body.message === "string"
          ? body.message
          : `Request failed (${response.status})`,
      );
    }
    return response.json();
  };
}
export const fetchTransport = createFetchTransport();
