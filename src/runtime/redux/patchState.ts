import { getPath, setPath } from "../binding/ExpressionResolver";
import type { StateObject } from "../shared/json";
import type { StatePatch } from "./runtimeActions";
export function patchState(root: StateObject, patch: StatePatch): StateObject {
  const previous = patch.target ? getPath(root, patch.target) : root;
  const value = {
    ...(previous && typeof previous === "object" ? previous : {}),
    ...patch.value,
  };
  if (patch.target) {
    setPath(root, patch.target, value);
    return root;
  }
  return value;
}
