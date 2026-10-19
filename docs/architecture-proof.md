# Architecture proof: one runtime, two JSON catalogs

Tab 3 has a Demo Schema selector outside the schema-generated application. Reports Catalog and Users Catalog load different ViewDefinition JSON files into the same ApplicationHost/RouteOutlet pipeline.

## Readable definitions

- src/schemas/views/reporting.catalog.json
- src/schemas/views/users.catalog.json

Both use generic-navigation through the same ComponentRegistry entry and the same GenericNavigation function. Both reuse Stack, Row, PageHeader, CatalogLayout, SearchInput, and Select. UserList is a pure component that composes the existing UserCard; it receives records, loading/error state, selection, and callbacks, with no Redux, schema, datasource, or filter knowledge.

## JSON defines the difference

| Contract | Reports | Users |
| --- | --- | --- |
| Component type | generic-navigation | generic-navigation |
| Navigation items | $data.facets.data.modules | $data.users.data.departments |
| Selected value | $state.filters.module | $state.filters.department |
| onSelect action | selectModule | selectDepartment |
| Action type | state.set | state.set |
| Action target | filters.module | filters.department |
| Dependency | $state.filters.module | $state.filters.department |
| Request | GET /api/reports?module=active-directory | GET /api/users?department=engineering |
| List items | $data.reports.data.items | $data.users.data.items |
| List component | report-list | user-list → UserCard |

The navigation emits an ordinary value payload. Its named action, target path, dependency, request expression, and destination list binding are all defined in JSON. GenericNavigation never branches on the item ID or catalog mode. RuntimeNode, BindingEngine, ExpressionResolver, ActionEngine, ActionRegistry, DataSourceManager, DependencyGraph, listener middleware, and routing code were not changed for Users Catalog.

The status navigation is another instance of GenericNavigation. Disabled users calls a named state.patch action that clears the department and sets filters.status. The status dropdown instead calls a named state.set action that retains the department. These different relationships are also JSON, and a patch affecting two paths schedules one debounced request.

## What stays alive on switching

The selector changes the route's viewId in playground tooling. The existing RouteOutlet replaces the ViewRuntime, disposing its requests, timers, state, and data. The same ApplicationRuntime, RuntimeEnvironment, Redux store, registry, application shell DOM, app state, and app data remain active. A fresh view scope prevents report filters from leaking into users and vice versa. Switching back resets that view's filters to its JSON initialState.

The shell breadcrumb changes through a named app action. The selector, architecture comparison, and runtime inspector are playground tools outside the application shell. They do not render or interpret business component trees. The comparison reads the actual navigation node, referenced named action, datasource, and list node from each imported definition. No duplicate example wiring is maintained.

## Users API and UI

GET /api/users supports department, status, and search. Filters combine with AND, and search is case-insensitive across name, email, role, department, and location. Twelve fictional users use example.com emails, four departments, and active/invited/disabled status. The response includes filtered records/count/subtitle and global navigation counts/options. Missing matches return an empty list safely.

Selecting a UserCard captures its plain user payload through a named action and opens the existing SidePanel using bindings. Closing it is another named state action. There is no user-specific runtime or API hook.

## Verification

The schema-rewiring tests render the actual Tab 3 selector against the real Express APIs. A single navigation implementation is instrumented for both view scopes. Tests verify the report module query, the user department query, stable application/runtime/store/registry/shell, unchanged app datasource counts, per-view reset, status navigation, UserCard composition/profile display, request cancellation, and a late response from an old view that ignores AbortSignal.

Comparison excerpts are checked against the actual JSON definitions. API tests cover department/status/search combinations and global counts. Architecture tests reject report/user-specific navigation logic, runtime domain cases, and runtime/API access from business components.
