# Runtime Inspector and architecture presentation

Tab 3's Runtime Inspector, Architecture modal, schema selector, and schema comparison are playground tooling. They are rendered outside ApplicationHost and are not registered as business components. Opening/closing tools, clearing logs, and inspecting definitions do not dispatch business actions or perform API requests.

## Inspector data sources

- Schema IDs come from ApplicationDefinition and the active view instance; a disposed view displays `none`.
- `$appState`, `$appData`, `$state`, and `$data` use read-only store subscriptions.
- Registered components come from ComponentRegistry.list(), a detached, sorted name snapshot.
- Current datasource definitions are the application declarations plus the active view declarations. Inactive views are excluded.
- Dependency relationships project the same dependsOn declarations used to construct DependencyGraph. The inspector does not use the graph to drive rendering or execute side effects.
- Status/loading/error values come from current Redux data entries, labeled by app/view scope.
- Action and lifecycle logs subscribe to the existing Diagnostics history. State handlers supply resolved values, target, type, named action, scope, and instance metadata.

## Diagnostics

Structured metadata is optional and generic. DataSourceManager records dependencyChanged, debounced, loading, success, error, cancelled, and invalidated events. The existing runtime store/action/data execution paths and load policies remain unchanged.

The diagnostics buffer keeps the most recent 100 events; each displayed log shows the latest 40 matching events in chronological order. Logs retain view/schema labels across switches. Metadata is snapshotted, unrepresentable values have safe placeholders, and failing observers are contained. Clearing the buffer never clears state, datasources, requests, or schemas. Closing the inspector removes its subscriptions.

## Architecture modal

The first diagram follows UI events through generated callbacks, ActionEngine, Redux, React-Redux, BindingEngine, and RuntimeNode. The second follows datasource side effects through listener middleware, DependencyGraph, DataSourceManager, the backend, Redux data, and UI rerendering. Bindings, visibility, handlers, and dependsOn have separate definitions.

The modal traps keyboard focus, closes with Escape/backdrop/close button, restores focus, and contains its own scroll area. It does not change runtime state. The schema comparison starts collapsed to keep the application ready for presentation.

## Suggested demonstration

1. Open Architecture and explain the two paths.
2. In Reports, select Active Directory; open Runtime Inspector to show the resolved selectModule/state.set write and reports dependencyChanged/loading/success events.
3. Switch Demo Schema to Users with the inspector open. Show unchanged app scope, the new view ID, users definitions, and `$state.filters.department → users`.
4. Select Engineering, then inspect four UserCards and the selectDepartment action.
5. Expand the JSON comparison to show that GenericNavigation is identical and the wiring differs only in the definitions.

Tests cover resolved telemetry, diagnostic isolation, registry snapshots, live inspector updates, zero side effects from tools, mode changes, focus restoration, and the existing report/user flows. `npm run lint` also runs the AST/schema boundary audit.
