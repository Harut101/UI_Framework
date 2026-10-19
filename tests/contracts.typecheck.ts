import type { ApplicationDefinition } from '../src/runtime/application/types';
import type { ViewDefinition } from '../src/runtime/view/types';
import type { ComponentDefinition, HandlerDefinition } from '../src/runtime/rendering/types';
import type { BindingDefinition } from '../src/runtime/binding/types';
import type { ActionDefinition } from '../src/runtime/actions/types';
import type { DataSourceDefinition } from '../src/runtime/datasource/types';
import type { RouteDefinition } from '../src/runtime/routing/types';

const handler: HandlerDefinition = { action: 'updateMessage' };
const binding: BindingDefinition = { source: '$state.message', default: 'Waiting' };
const action: ActionDefinition = { type: 'state.set', target: 'message', value: '$event.value' };
const source: DataSourceDefinition = { type: 'api', request: { method: 'GET', path: '/api/demo-message' }, dependsOn: ['$appState.refresh'], load: { strategy: 'onViewInit', reload: 'onDependencyChange' } };
const node: ComponentDefinition = { id: 'message', type: 'text', props: { className: 'message' }, bindings: { value: binding }, visibility: '$state.visible', handlers: { onClick: handler }, children: [] };
const view: ViewDefinition = { id: 'hello', title: 'Hello', initialState: { message: 'Waiting' }, actions: { updateMessage: action }, dataSources: { sample: source }, root: node };
const route: RouteDefinition = { path: '/', viewId: view.id };
const app: ApplicationDefinition = { id: 'app', initialState: {}, dataSources: {}, actions: {}, shell: { id: 'shell', type: 'page' }, routes: [route], views: { hello: view } };
// @ts-expect-error Bindings cannot use undeclared namespaces.
const invalidBinding: BindingDefinition = { source: '$unknown.message' };
// @ts-expect-error A handler cannot carry an inline action definition.
const invalidHandler: HandlerDefinition = { action: { type: 'state.set', target: 'message', value: 'x' } };
// @ts-expect-error Schema static props must be JSON serializable, not callback functions.
const invalidProps: ComponentDefinition = { id: 'x', type: 'button', props: { onClick: () => undefined } };
// @ts-expect-error The action discriminant rejects domain-specific action types.
const invalidAction: ActionDefinition = { type: 'report.select', target: 'message', value: 'x' };
void [app, invalidBinding, invalidHandler, invalidProps, invalidAction];
