import { pathParts } from "../../binding/ExpressionResolver";

/** State action targets are local paths, never expression namespaces. */
export function assertLocalStateTarget(target: string): void {
  if (target.startsWith("$"))
    throw new Error("State targets must be relative to the current scope");
  pathParts(target);
}
