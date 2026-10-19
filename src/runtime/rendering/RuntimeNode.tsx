import { createContext, memo, useContext, useMemo } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { BindingEngine } from "../binding/BindingEngine";
import { ComponentBinder } from "./ComponentBinder";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import type { RuntimeScope } from "../shared/RuntimeScope";
import type { ComponentDefinition } from "../shared/types";

export const RuntimeContext = createContext<{
  runtime: RuntimeScope;
  registry: ComponentRegistry;
} | null>(null);
export const NodeDefinitionContext = createContext<ComponentDefinition | null>(null);
const binder = new ComponentBinder();
export const RuntimeNode = memo(function RuntimeNode({
  definition,
}: {
  definition: ComponentDefinition;
}) {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error("RuntimeNode must be inside a runtime scope");
  const { runtime, registry } = context;
  const bindingEngine = useMemo(
    () => new BindingEngine(runtime.environment.resolver),
    [runtime],
  );
  const selectBindings = useMemo(
    () => bindingEngine.createSelector(definition.bindings, runtime, definition.visibility),
    [bindingEngine, definition.bindings, definition.visibility, runtime],
  );
  const bound = useSelector(selectBindings, shallowEqual);
  const props = useMemo(
    () => binder.bind(definition, runtime.actionEngine, runtime),
    [definition, runtime],
  );
  const Component = registry.get(definition.type);
  const children = useMemo(
    () =>
      definition.children?.map((child) => (
        <RuntimeNode key={child.id} definition={child} />
      )),
    [definition.children],
  );
  if (!bound.__visible) return null;
  const { __visible: _visible, ...bindings } = bound;
  return (
    <NodeDefinitionContext.Provider value={definition}><Component {...props} {...bindings}>
      {children}
    </Component></NodeDefinitionContext.Provider>
  );
});

