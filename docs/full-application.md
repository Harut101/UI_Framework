# Full Application: schema-generated Reports Catalog

Tab 3 is a host for a separate ApplicationRuntime session. It supplies the environment, React-Redux provider, router service, render-error boundary, notification service, and optional inspector. It never manually renders the application header, navigation, catalog controls, or report list.

## Source of truth

- src/schemas/application/reporting.json defines the shell, app state, app datasources, named app actions, and the catalog route.
- src/schemas/views/reporting.catalog.json defines the entire catalog tree, filters, visibility, named actions, requests, and dependency policy.
- src/schemas/reporting.ts bundles and validates these JSON definitions. It does not implement business behavior.

The application shell is application-shell → application-header + data-tree (targeting primary-navigation) + route-outlet. The generic data adapter loads and merges child link data; all navigation parent definitions come from the backend. See [dynamic-navigation.md](dynamic-navigation.md). RouteOutlet resolves the browser pathname through application.viewSource, fetches a full ViewDefinition from /api/ui/views and activates the normal ViewRuntime. Primary navigation supplies different hrefs for Reports, Users, tenants, domains and recovery pages. See [remote View routing](production/remote-view-routing.md). The header and primary navigation bind only app namespaces. The catalog owns view namespaces. Leaving Tab 3 disposes that session; the playground's other tabs have their own session.

## Dataflow

A module facet and its matching dropdown both bind filters.module. Their ordinary onSelect/onChange callbacks call the named selectModule action. That state.set action updates viewState, producing $state.filters.module in listener middleware. DependencyGraph identifies the reports source once; DataSourceManager debounces for 180ms, cancels obsolete work, resolves current request parameters, and calls the backend. The response enters viewData.reports. BindingEngine selectors supply items/loading/error/selectedId to ReportList through RuntimeNode.

ReportList receives no filters and performs no API calls. GenericNavigation receives items and selection callbacks and performs no API calls. ReportCard is the same implementation used by the Components catalog. No domain wiring was added to runtime infrastructure.

The advanced row uses exactly visibility: "$state.ui.showAdvancedFilters". Its switch calls setAdvancedFilters → state.set. Visibility changes use React-Redux subscriptions, with no datasource dependency reaction.

Clear filters is one state.patch; multiple changed dependencies schedule one reload. Module, framework, report type, collection, owner, and published-only values all participate in the backend request. Search is debounced and Enter can reload immediately.

## Details and execution

Opening a card executes a sequence of named actions: clear the old run result, select the report ID, show the panel, and load the selectedReport datasource. The request path is /api/reports/{id}, with params.id bound to $state.selectedReportId. Closing cancels/invalidates details and clears selection; Escape also closes, and focus returns to the prior control when available.

Run report executes named beginRun → api.request. It posts to /api/reports/{id}/run, stores the receipt in lastRun, clears the busy flag, and shows a generic success/error notification. The details panel renders row count, completion time, and receipt ID. The backend remembers last-run timestamps in process memory. There are no external report jobs or persisted records.

RequestDefinition.params is a generic runtime addition. Resolved parameter values are URI-encoded by the HTTP transport; missing identifiers fail safely instead of requesting a collection. There are no report-specific URL rules in runtime code.

## API fixture

The backend exposes all six requested endpoints:

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | /api/app/navigation | Guardian-style navigation parent data and child-source definitions |
| GET | /api/v0/msGraph/tenants | Remote tenant link data |
| GET | /api/v0/msAd/domains | Remote domain link data |
| GET | /api/v0/recovery/effectiveNavigationProperties | Recovery link data merged with static backend children |
| GET | /api/me | Fictional demo profile |
| GET | /api/report-facets | Global counts and filter options |
| GET | /api/reports | Filtered reports, count, and subtitle |
| GET | /api/reports/:id | Report detail and last-run timestamp |
| POST | /api/reports/:id/run | Completed demo receipt with row count |

There are 24 seeded reports across six modules, three frameworks, and three report types. Counts reflect real fixture records rather than copying the reference image's 127 count. Filters combine with AND. Search matches names, descriptions, coverage, and control identifiers case-insensitively. Unknown detail/run IDs return JSON 404s. Facet counts describe the entire seeded catalog.

## Visual and reusable components

The supplied screenshot guides the dark navy/cyan shell, breadcrumb, left facets, compact filter strip, gradient callout, and stacked cards. Application/layout/reporting components are ordinary React components, registered through registerApplicationComponents alongside the 19 core catalog components. Responsive layouts retain all collection choices and expose module/framework/type choices through dropdowns when the facet column is condensed.

The reference's AI callout is represented by a labeled demo keyword suggestion; no AI service is connected. Out-of-scope primary destinations are visibly disabled. The active Reports catalog destination is routed through a named app action.

## Verification

Tests use the real Express endpoints and full ApplicationHost/RuntimeNode rendering. They cover shell composition from JSON, app profile/navigation loading, facet callbacks to backend reloads, advanced visibility without reloads, combined filter debounce, patch reset deduplication, details/run/close, focus, error recovery, and app/view state separation. Separate API tests cover every endpoint, truthful counts, query combinations, collections, missing IDs, and path parameters. Existing architecture tests enforce isolated components and generic runtime layers.

## Reports / Users rewiring proof

The Demo Schema selector and side-by-side JSON comparison now let the same application session render Reports Catalog or Users Catalog. See [architecture-proof.md](architecture-proof.md) for lifecycle guarantees, exact wiring differences, and GET /api/users.


## Dynamic fragment workbench

Both catalog views include a schema-generated wide SidePanel hosting two independent remote items fragments and nested notes. GET /api/ui/fragments/items-panel/:contextId supplies the complete local state/data/action/root contract; GET /api/ui/fragments/item-note/:itemId supplies a selected child fragment. Existing Microsoft 365 and Active Directory legacy trees remain distinct. See [full-fragment-demo.md](full-fragment-demo.md) for the complete flow and manual walkthrough.


## Action-selected dynamic panels

Reports and Users share one schema-outlet driven by panel.open/schemaId/request. Each initiating action supplies a full endpoint path and query object. New user uses /api/ui/users/create; report actions use /api/ui/reports/run; Microsoft 365/Active Directory use /api/ui/object-panels. The outlet binds the complete request from state, including GET/POST and body and has no fixed endpoint. The remote content is a self-contained FragmentDefinition with local state/actions. Legacy endpoints remain compatible. See [dynamic panel contract](production/dynamic-panels.md).
