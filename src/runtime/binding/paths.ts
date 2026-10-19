const forbidden = new Set(["__proto__", "prototype", "constructor"]);
export function pathParts(path: string): string[] {
  const parts = path.split(".");
  if (parts.some((part) => !part || forbidden.has(part)))
    throw new Error(`Unsafe or empty path: ${path}`);
  return parts;
}
export function getPath(value: unknown, path: string): unknown {
  if (!path) return value;
  return pathParts(path).reduce<unknown>((current, part) => {
    if (current === null || typeof current !== "object") return undefined;
    return Object.hasOwn(current, part)
      ? (current as Record<string, unknown>)[part]
      : undefined;
  }, value);
}
export function setPath(
  object: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = pathParts(path);
  let current = object;
  for (const part of parts.slice(0, -1)) {
    const next = Object.hasOwn(current, part) ? current[part] : undefined;
    if (next === null || typeof next !== "object" || Array.isArray(next))
      current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1)!] = value;
}
