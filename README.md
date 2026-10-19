# Schema-Driven Application Runtime Playground

A React + TypeScript architecture demo using Fluent UI v9 behind library-independent adapters with three tabs: **Components**, **Schema Playground**, and **Full Application**. Tab 3 switches Reports Catalog and Users Catalog JSON through the same runtime, registry, navigation component, and layouts.

## Complete architecture and schema reference

The [production integration reference (Russian)](docs/production/README.md) documents every schema section/property, all generic actions, namespaces, component props/callbacks/defaults, scope/data/schema lifecycle, every runtime layer/API, and current production limitations. It includes a TypeScript/registry coverage check and validated complete JSON examples.

Run npm run docs:check to verify documentation coverage and examples. After a deliberate contract change, update descriptions and run npm run docs:generate before checking.

## Run and verify

Use Node.js 22.13+ (Node 24 recommended).

```sh
npm ci
npm run dev
# http://127.0.0.1:5173 — API on port 3001

npm run lint
npm run typecheck
npm run docs:check
npm test
npm run build
npm start
# Built frontend + API on http://127.0.0.1:3001
```

Lint runs ESLint and an AST/schema architecture audit. Tests include unit, React integration, and real Express API checks. `npm run audit:architecture` runs the boundary audit alone.

## Project structure

```text
src/
  runtime/        Shared application/view/fragment execution infrastructure
  components/     Isolated primitive, layout, navigation, reporting, users UI
  contracts/      Shared API/UI data contracts
  schemas/
    application/  Application shell, app actions/data, routes
    views/        Readable Reports, Users, and editor sample JSON
  playground/     Tabs, schema selector/comparison, inspector, architecture modal
backend/
  routes/         Demo Express APIs
  data/           Seeded report/user fixtures
scripts/          Architecture audit
tests/           Unit, contract, rendering, lifecycle, API, and proof tests
docs/            Detailed architecture and demo documentation
```

## Runtime layers

| Layer | Responsibility |
| --- | --- |
| shared / application / view / fragment | RuntimeScope composes initialization, local resources and recursive disposal |
| schema | SchemaOutlet acquires JSON and activates explicit envelopes; legacy trees retain host scope |
| rendering | RuntimeNode renders; ComponentRegistry maps types; ComponentBinder creates callbacks |
| binding | BindingEngine selects reactive props/visibility; ExpressionResolver reads safe paths |
| actions | ActionEngine resolves named actions; ActionRegistry selects generic handlers |
| datasource | Scope-owned managers handle API lifecycle; one environment graph matches qualified dependencies and composite resource ids |
| redux | App/view slices, independent fragment entries, stale-instance guards, scope-qualified changed paths and listener middleware |
| routing | RouteOutlet loads a ViewDefinition through ViewSchemaLoader |

`$state`/`$data` read the current RuntimeScope; `$viewState`/`$viewData` read its owning view, and `$appState`/`$appData` read its owning application. Fragment-local values live under `fragments[scopeId].state/data` in the same store. Owning-view reads are undefined for application-level scopes. Application scope survives view changes. Each new view initializes fresh state/data and disposes the old view's timers/requests. The Full Application tab loads complete ViewDefinitions from the backend using the current navigation URL. Application viewSource defines the resolver endpoint; legacy bundled routes/views remain supported. See [remote View routing](docs/production/remote-view-routing.md).

## Two independent data flows

```text
UI event → generated callback → ActionEngine → generic action handler → Redux
         → React-Redux/useSelector → BindingEngine selector → RuntimeNode → props

Redux state change → listenerMiddleware → scope-qualified changed paths
  → DependencyGraph → DataSourceManager → backend → Redux data
  → React-Redux subscription → UI rerender
```

- **bindings** = reactive props.
- **visibility** = reactive render condition.
- **handlers** = public callbacks → named actions.
- **dependsOn** = datasource lifecycle dependency.

React subscriptions drive rendering. One environment DependencyGraph identifies datasource work by { scopeId, sourceId }; the owning DataSourceManager decides when/how to reload. Fragment $state/$data dependencies are local; explicit $viewState/$viewData/$appState/$appData reads use ancestor identities. Multiple paths from one patch reload a matching source once. Missing paths use safe defaults. Expressions never evaluate JavaScript.

## Add a component

1. Create an ordinary React component under `src/components/` with typed props and callbacks.
2. Register its schema type in `src/components/registry.ts`.
3. Compose it in JSON using static props, bindings, visibility, handlers, and children. Add catalog metadata/examples for components exposed in Tab 1.

Business components import no runtime, Redux, schema, or API services. There are no component-specific runtime hooks.

## Add an action type

Extend `ActionDefinition` in `src/runtime/actions/types.ts`, add a generic handler under `actions/handlers/`, register it in `createActionRegistry.ts`, and extend schema validation/tests. Handler callback wiring always references a named action. ComponentBinder passes the current RuntimeScope; execute(name, { event, scope }) resolves only the dictionary in that scope. Sequences and API callbacks preserve scope and response context. State targets are relative local paths; cross-scope execution/writes and implicit parent lookup are unsupported.

Built-ins: `state.set`, `state.patch`, `api.request`, `datasource.reload`, `datasource.invalidate`, `navigate`, `notification.show`, `sequence`.

## Add a datasource

Declare it in the owning application/view definition; bind components to its data entry:

```json
{
  "items": {
    "type": "api",
    "request": {
      "method": "GET",
      "path": "/api/items",
      "query": { "search": "$state.filters.search" }
    },
    "dependsOn": ["$state.filters.search"],
    "load": {
      "strategy": "onViewInit",
      "reload": "onDependencyChange",
      "debounceMs": 180
    }
  }
}
```

A list binding can be `{ "items": { "source": "$data.items.data.items", "default": [] } }`. Use `onAppInit` for app sources, or `manual` for explicit loads. URL path parameters use `path: "/api/resources/{id}"` and `params: { "id": "$state.selectedId" }`.

## Create a ViewDefinition

Save JSON with `id`, `title`, `initialState`, `dataSources`, `actions`, and `root`. Add named actions before referencing them in handlers. Bundle and validate the definition, then add a route/view entry in the application definition. The playground schema selector can choose that definition without adding runtime behavior.

See [reporting.catalog.json](src/schemas/views/reporting.catalog.json) and [users.catalog.json](src/schemas/views/users.catalog.json) for complete examples.

## Add a FragmentDefinition

Return JSON with only `type: "fragment"` and `root` required; optional `id`, `state`, `dataSources`, `actions` and `schemaSources` make the response self-contained. Remote node ids can be omitted. FragmentRuntime normalizes it and composes the existing RuntimeScope. The shared view/fragment lifecycle host initializes local Redux state/idle data and starts init policies before rendering through RuntimeNode. Use `onInit` (or `onScopeInit`) for fragment datasource startup.

`$state`/`$data` are fragment-local; explicit view/app namespaces read ancestors. Named handlers resolve only local actions. Legacy bare component trees remain host-scoped. Definition-cache reuse never shares live scopes; default deactivation/remount creates fresh state. See [dynamic schema loading](docs/dynamic-schema-loading.md) and [migration status](docs/runtime-scope-migration.md).

## Reports vs Users proof

The same **GenericNavigation** emits `{ value }` in both views:

| JSON wiring | Reports | Users |
| --- | --- | --- |
| Named action | selectModule | selectDepartment |
| State target | filters.module | filters.department |
| Dependency | $state.filters.module | $state.filters.department |
| Datasource/API | reports / GET /api/reports | users / GET /api/users |
| Result | ReportList | UserList composing the shared UserCard |

The selector preserves the application runtime, environment, store, registry, shell, and app data while replacing the view scope. Tests verify both backend queries and reject late old-view responses. The comparison reads excerpts from the actual JSON files.

## Presentation tooling

Tab 3's collapsible **Runtime Inspector** is marked **PLAYGROUND TOOLING**. It shows schema IDs, four state/data namespaces, registered component types, current datasource definitions/statuses, dependency relationships, resolved action writes, and datasource lifecycle events. Clear logs affects diagnostics only. History is bounded and includes scope/view labels.

The **Architecture** modal explains the two reaction paths and the four schema contracts. Both tools are outside the generated application. They subscribe read-only; runtime/business code never imports them. Generic structured diagnostics and registry-name introspection provide observability without changing execution policy. Diagnostic observer failures are isolated from runtime execution.

The boundary audit checks business Redux/API access, component-specific hooks, domain-specific runtime behavior, navigation datasource logic, inline handler actions, and forbidden event infrastructure. No shortcuts are required for either demo.

The backend uses fictional seed data. Report runs are in-memory demo receipts; the AI callout is a labeled keyword suggestion. Persistence, authentication, external jobs, and connected AI remain outside this demo.

More: [runtime architecture](docs/runtime-architecture.md), [schema flexibility proof](docs/architecture-proof.md), [component catalog](docs/component-catalog.md), [schema editor](docs/schema-playground.md), [runtime inspector](docs/runtime-inspector.md).

UI implementation: [Fluent migration map, theme, and boundaries](docs/fluent-migration.md).

Dynamic schema loading: [architecture, contracts and demo walkthrough](docs/dynamic-schema-loading.md). Select an object under Dynamic object details in either Full Application catalog. Tab 2 also includes Dynamic Fragment.


## Recursive schema outlets

An outlet can declare its request inline, without schemaSources:

```json
{
  "id": "details",
  "type": "schema-outlet",
  "enabled": "$state.detailsOpened",
  "key": "$state.selectedObjectId",
  "source": {
    "request": { "method": "GET", "path": "/api/ui/details/$state.selectedObjectId" },
    "cache": "view"
  }
}
```

Definition cache policies none/view/application (also scope) reuse JSON independently of local state. The default lifecycle.scopeLifetime is activation; outlet explicitly retains the same mounted fragment scope while disabled. Real unmount, source/key/request changes and ancestor disposal always clean it up. Nested explicit fragments own independent scopes in the same store; legacy bare trees keep the host scope. See the [lifecycle matrix and implementation decisions](docs/runtime-scope-migration.md).

## Navigation data

All primary navigation parents come from the backend. Reporting demonstrates static children; Microsoft 365 and Active Directory load remote child data; Forest Recovery merges static and remote links with explicit ordering. The generic data-tree runtime adapter uses the existing DataSourceManager and passes prepared props to isolated PrimaryNavigation. Navigation uses data loading; SchemaOutlet handles unknown component structures. See [contracts, flow and merge/lifecycle rules](docs/dynamic-navigation.md).

## Full dynamic fragments

In either Full Application catalog, select **Open fragment workbench**. Two outlets load the same backend FragmentDefinition into independent scopes; search/failure/slow/advanced controls and reload are entirely schema-wired. Selecting an item loads a nested notes fragment over HTTP. Change context or close the panel to demonstrate recursive cleanup and fresh local state. See the [walkthrough, API contracts and verification](docs/full-fragment-demo.md).

## Runtime inspector and final audit

Tab 3's collapsible **PLAYGROUND TOOLING** inspector shows live application/view/fragment ownership, independent definition-cache and scope-lifetime policies, local state/resources/actions and actual graph registrations. Action values, datasource requests and schema HTTP/cache activity are separate diagnostic projections. Opening/closing/clearing tooling never drives business behavior.

The [final architecture audit](docs/runtime-final-audit.md) records the 13 invariants, changed files, verification results, browser walkthrough and remaining limitations. The [scope migration plan](docs/runtime-scope-migration.md) retains historical decisions and the implemented lifecycle matrix.
