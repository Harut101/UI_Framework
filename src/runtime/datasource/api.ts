import type { RequestDefinition, StateObject } from "../shared/types";

export type ApiTransport = (
  request: RequestDefinition,
  signal: AbortSignal,
) => Promise<unknown>;
export function resolveRequestPath(request: RequestDefinition): string {
  return request.path.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_token, key: string) => {
    const value = request.params?.[key];
    if ((typeof value !== 'string' && typeof value !== 'number') || value === '') throw new Error(`Missing request path parameter: ${key}`);
    return encodeURIComponent(String(value));
  });
}
export const fetchTransport: ApiTransport = async (request, signal) => {
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
