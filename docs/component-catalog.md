# Shared component catalog

The Components tab is a lightweight, Storybook-like catalog implemented inside the playground. No Storybook dependency is needed.

## Shared library

All 19 public implementations live in `src/components` and are mapped by `createComponentRegistry` in `src/components/registry.ts`.

| Category | Components / schema types |
| --- | --- |
| Primitives | Button / `button`, TextInput / `text-input`, SearchInput / `search-input`, Select / `select`, Switch / `switch`, Checkbox / `checkbox`, Text / `text`, Title / `title` |
| Layout | Card / `card`, Stack / `stack`, Row / `row`, Page / `page`, PageHeader / `page-header`, SplitLayout / `split-layout`, SidePanel / `side-panel` |
| Navigation & data | GenericNavigation / `generic-navigation`, GenericList / `generic-list` |
| Reporting | ReportCard / `report-card` |
| Users | UserCard / `user-card` |

Every implementation receives ordinary React props and invokes ordinary callback props. Components do not import Redux, schemas, runtime contexts, ActionEngine, or DataSourceManager and do not make requests. Form/selection callbacks consistently emit a plain `{ value }` payload; Button and SidePanel emit parameterless callbacks. The shared `{ value }` interface is a UI contract, independent of schema expressions.

SearchInput emits onChange while typing/clearing and optional onSearch on Enter. GenericNavigation emits an item ID without deciding how navigation works. GenericList can render static rows when onSelect is absent. ReportCard and UserCard emit intents containing IDs; opening records, fetching data, and sending messages are responsibilities of their parent or schema wiring. SidePanel is a controlled inline layout, not a modal or portal.

## Catalog infrastructure

- `catalog.ts`: descriptions, exhaustive public prop/callback metadata, React examples, schema nodes, and named action examples.
- `types.ts`: a typed metadata helper deriving every prop/callback key from the real React component interfaces. Adding or removing a public prop requires updating its documentation.
- `fixtures.ts`: typed sample data used only by the previews.
- `ComponentPreview.tsx`: resolves components through the registry passed from Playground, supplies ordinary props and callbacks, and owns local preview state. Reset remounts the preview and clears callback output.
- `ComponentsTab.tsx`: searchable grouped sidebar, live preview, contracts, and copyable React/schema examples.
- `catalog.css`: catalog presentation. `src/components/components.css` owns reusable component styling.

The same registry instance is passed to the catalog and schema rendering hosts. Previews call `registry.get(entry.type)` and render that implementation. There are no duplicate playground-only implementations. Registry still has just one responsibility: schema type → React component. Catalog metadata stays outside it.

Bindings in documented JSON examples assume the owning schema supplies matching state and datasource entries. Named action definitions are shown separately so handlers never contain inline actions. Examples demonstrate public contracts; they do not add API-bound business workflows to the playground.

## Validation

Tests verify exact registration identity and full catalog coverage, validate all schema/action examples, and typecheck all React snippets against the source components with an in-memory TypeScript program. Interaction tests cover callbacks, search, disabled/loading/empty states, reset, card intents, panel dismissal, and reuse of GenericNavigation through RuntimeNode → named state.set → Redux.

To add a component, implement its ordinary typed props, add its mapping to `sharedComponents` and `createComponentRegistry`, then add a typed catalog entry and fixture props. The coverage tests catch missing registration or documentation.
