import dynamicJson from '../../schemas/views/playground/dynamic-fragment.json';
import formJson from '../../schemas/views/playground/simple-form.json';
import visibilityJson from '../../schemas/views/playground/visibility.json';
import bindingJson from '../../schemas/views/hello-runtime.json';
import datasourceJson from '../../schemas/views/playground/datasource.json';
import layoutJson from '../../schemas/views/playground/nested-layout.json';
export type SchemaSampleId = 'simple-form' | 'visibility' | 'state-binding' | 'datasource' | 'nested-layout' | 'dynamic-fragment';
export interface SchemaSample { id: SchemaSampleId; label: string; description: string; source: string }
export const schemaSamples: SchemaSample[] = [
  { id: 'simple-form', label: 'A · Simple form', description: 'Controlled fields write nested view state through named actions.', source: JSON.stringify(formJson, null, 2) },
  { id: 'visibility', label: 'B · Visibility demo', description: 'A switch updates showAdvanced; the binding selector controls visibility.', source: JSON.stringify(visibilityJson, null, 2) },
  { id: 'state-binding', label: 'C · State bindings & actions', description: 'A named state.set action updates text through the real Redux subscription.', source: JSON.stringify(bindingJson, null, 2) },
  { id: 'datasource', label: 'D · Datasource demo', description: 'Backend requests, safe binding defaults, dependency reloads, and cancellation.', source: JSON.stringify(datasourceJson, null, 2) },
  { id: 'nested-layout', label: 'E · Nested layout demo', description: 'Compose shared cards, headers, panels, and layouts in a JSON tree.', source: JSON.stringify(layoutJson, null, 2) },
  { id: 'dynamic-fragment', label: 'F · Dynamic Fragment', description: 'Open a panel whose component tree arrives over HTTP through SchemaOutlet.', source: JSON.stringify(dynamicJson, null, 2) },
];
export const defaultSchemaSample = schemaSamples.find(sample => sample.id === 'state-binding')!;
