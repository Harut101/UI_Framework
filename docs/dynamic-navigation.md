# Dynamic navigation data

Task 8 models navigation as backend-owned data for known UI. SchemaOutlet remains for unknown component structure, such as the different object detail panels. No navigation parent entries or recovery-specific actions/sources live in ApplicationDefinition.

## Ownership and files

| File | Responsibility |
| --- | --- |
| backend/data/navigation.ts | Guardian-style parent definitions, child URLs, static links and explicit ordering; seeded tenant/domain/recovery links |
| backend/routes/navigation.ts | GET /api/app/navigation and local Guardian-style child data endpoints |
| src/contracts/tree.ts | Raw TreeDataNode/ChildrenSourceDefinition and prepared TreeItem contracts |
| src/runtime/data-tree/treeData.ts | Bounded JSON validation, source resolution, recursive projection and pure merge/order functions |
| src/runtime/data-tree/DataTreeRuntime.tsx | Generic registered data-tree adapter, selectors and node-local data leases; receives target component type from JSON |
| src/runtime/datasource/DataSourceManager.ts | The existing scope-owned manager also acquires inline data resources; same transport, Redux statuses, cancellation and stale-write guards |
| src/components/application/PrimaryNavigation.tsx | Isolated Fluent presentation with controlled selection/expansion and ordinary callbacks |
| src/schemas/application/reporting.json | Root navigation datasource, generic data-tree target, bindings and named selection/expansion actions |

## Three data patterns

Static children need no HTTP:

```json
{
  "id": "reporting",
  "name": "Reporting",
  "links": [{ "id": "reporting.catalog", "name": "Catalog workspace", "href": "/application/catalog" }]
}
```

Remote children are link data:

```json
{
  "id": "tenants",
  "name": "Microsoft 365",
  "childLinksSourceUrl": "v0/msGraph/tenants"
}
```

The generic Guardian URL alias maps relative v0/... URLs to /api/v0/...; there are no id-specific branches. A node can instead supply its own explicit childrenSource, which takes precedence over childLinksSourceUrl:

```json
{
  "id": "domains",
  "name": "Active Directory",
  "childrenSource": {
    "request": { "method": "GET", "path": "/api/v0/msAd/domains" },
    "itemsPath": "items"
  }
}
```

Hybrid nodes combine static and remote data:

```json
{
  "id": "recovery",
  "name": "Forest Recovery",
  "links": [{ "id": "jobs", "name": "Recovery Jobs", "href": "/application/catalog" }],
  "childLinksSourceUrl": "v0/recovery/effectiveNavigationProperties",
  "childrenOrders": ["overview", "jobs", "objects", "plans"]
}
```

The child endpoints return `{ "items": [...] }`, containing link objects. Bare arrays are also accepted. itemsPath can select a nested response array; an empty path selects a bare array. Returned children may themselves declare sources. Raw links have no component types, bindings or action handlers.

## Merge and lifecycle rules

1. Combine links and the accepted children alias; deduplicate siblings by id.
2. Overlay remote metadata on duplicate static ids and combine their nested static children. Neither input is mutated.
3. Emit ids listed in childrenOrders first, in that order. Ignore repeated/unknown order ids. Remaining entries preserve insertion order: static first, new remote entries next.
4. Load remote children only while that node and its ancestors are expanded. Static children remain available during loading or failure. Child errors/retry remain local.
5. Resolve node request expressions with the owning RuntimeScope. A resolved request change acquires a different resource. Canonical request identity includes method/path/query/body and ignores object property order.
6. Concurrent leases within one scope share one request/result. Last-consumer release cancels pending work; controller identity and scope activity reject late responses. StrictMode replay does not duplicate requests.
7. Successful child data is cached in the owning scope until disposal, including across collapse/reopen and navigation renderer unmount. Errors require explicit retry. These are data resources, independent of schema definition-cache and FragmentRuntime lifetime policies.
8. Scope disposal aborts requests and removes local data through the existing recursive RuntimeScope cleanup. Separate fragment scopes never share live child-resource state, even for identical requests.

Expansion keys are root ids or encoded ancestry tuples for nested nodes. They distinguish repeated sibling ids under different parents. Selection still emits the link id/href through named rememberNavigation/navigateToSelection actions. The current demo leaf links target the existing catalog route; new destination screens are outside Task 8.

## Runtime flow

```text
GET /api/app/navigation -> appData.navigation -> data-tree binding
 -> prepared PrimaryNavigation props

Expand callback -> ComponentBinder -> named state.set -> appState expansion keys
 -> DataTreeRuntime selector/effect -> existing DataSourceManager inline lease
 -> backend child DATA -> scoped Redux data -> generic merge/order -> UI props

Select link -> ComponentBinder -> named sequence
 -> selectedNavigationId -> navigate(event.href)
```

The application schema configures the infrastructure adapter explicitly:

```json
{
  "id": "primary-navigation",
  "type": "data-tree",
  "props": { "component": "primary-navigation" },
  "bindings": {
    "items": { "source": "$appData.navigation.data.items", "default": [] },
    "selectedId": "$appState.selectedNavigationId",
    "expandedIds": "$appState.navigation.expandedIds"
  },
  "handlers": {
    "onSelect": { "action": "selectNavigation" },
    "onExpandedChange": { "action": "setNavigationExpansion" }
  }
}
```

RuntimeNode and GenericNavigation are unchanged. The adapter chooses its renderer from ComponentRegistry; it does not import PrimaryNavigation or branch on any business id. PrimaryNavigation has no Redux/runtime imports, fetching, URL/source interpretation or merge logic. Node-local requests are selector-driven on-demand resources, not synthetic DependencyGraph UI edges; declared datasource dependsOn behavior is unchanged. Runtime Inspector lists inline resources/statuses alongside declared sources without driving them.

## Verification

New tree-data and React navigation suites cover static/remote/hybrid composition, duplicate ids, ordering, response extraction, nested data, scope-aware requests, concurrency, retry, cancellation, ignored-abort results, scope disposal, StrictMode and provider-free PrimaryNavigation callbacks. Full Application adds a real HTTP walkthrough for all three Guardian parents. Existing Reports/Users schema rewiring, scoped runtime and object-schema tests remain regressions. Validation passed: typecheck; lint/architecture audit (129 source files, 13 JSON schemas); all 376 tests in 30 files; production build. The existing nonblocking Vite chunk-size warning remains. No manual-browser verification is claimed for Task 8.

