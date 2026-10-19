import type { ComponentType } from "react";
import type { StateObject } from "../shared/types";

export class ComponentRegistry {
  private components = new Map<string, ComponentType<StateObject>>();
  register<P extends object>(type: string, component: ComponentType<P>) {
    this.components.set(type, component as ComponentType<StateObject>);
    return this;
  }
  get(type: string) {
    const component = this.components.get(type);
    if (!component) throw new Error(`Unknown component type: ${type}`);
    return component;
  }
  has(type: string) {
    return this.components.has(type);
  }
  list(): readonly string[] {
    return [...this.components.keys()].sort();
  }
}
