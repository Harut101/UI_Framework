import type { ViewDefinition } from '../view/types';
export class ViewSchemaLoader {
  constructor(private readonly views: Readonly<Record<string, ViewDefinition>>) {}
  load(viewId: string): ViewDefinition {
    const definition = Object.hasOwn(this.views, viewId) ? this.views[viewId] : undefined;
    if (!definition) throw new Error(`Unknown view definition: ${viewId}`);
    return definition;
  }
}
