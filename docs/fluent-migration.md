# Fluent UI v9 migration

The UI implementation layer now uses `@fluentui/react-components` and `@fluentui/react-icons`. Schema types, component props/callbacks, registry mappings, runtime execution, datasource policies, and backend behavior are preserved.

## Audit and migration map

The initial audit found 19 catalog adapters, 8 application components, native HTML controls across all three tabs, manual modal/focus code, report/user overlays, custom status/skeleton visuals, lucide icons, and six global stylesheets recreating control appearance. No Fluent v8, menus, popovers, radio groups, progress bars, or existing tooltip implementation was installed.

| Public component / UI | Fluent implementation |
| --- | --- |
| Button | Button; existing primary/secondary/ghost values map internally |
| TextInput | Field + Input |
| SearchInput | Field + SearchBox; Enter and clear emit existing plain callbacks |
| Select | Field + Dropdown + Option; controlled values and disabled options |
| Checkbox / Switch | Fluent Checkbox / Switch |
| Text / Title | Text with paragraph/heading semantics |
| Card | Card + CardHeader + Text |
| GenericNavigation | Button + Badge + Text + Spinner |
| GenericList | Button + Text + Spinner |
| ReportCard | Card + Badge + Text + Button + semantic icons |
| UserCard | Card + Avatar + Badge + Text + Button |
| SidePanel / ReportDetails | OverlayDrawer + DrawerHeader/Body; Fluent focus handling |
| PageHeader | Fluent Text inside a lightweight layout wrapper |
| ApplicationHeader | Breadcrumb + Avatar + Button + Tooltip + Text + icons |
| PrimaryNavigation | Fluent Button/Text/icons inside the dark navigation layout |
| SuggestionCallout | Card + Text + Button |
| ReportList / UserList | Existing card composition; Button, Spinner, Skeleton for feedback |
| Playground tabs | TabList + Tab; router URLs and three destinations preserved |
| Tooling selects / buttons | Same Select adapter / Fluent Button |
| JSON editor | Fluent Textarea native slot; existing selection/indent/scroll commands |
| Contract tables | Fluent Table primitives |
| Comparison / inspector disclosures | Accordion primitives |
| Architecture modal | Dialog + DialogSurface/Body/Title/Content/Actions |
| Notifications | Toast / Toaster / ToastTrigger / Link |

All 19 catalog entries still show their public props, callbacks, React example, schema example, and live shared implementation. The implementation label is accurate for both Fluent adapters and custom layout wrappers. Existing JSON samples are unchanged.

## Intentional layout wrappers

Page, Stack, Row, SplitLayout, CatalogLayout, ApplicationShell and the structural portion of PageHeader remain simple grid/flex wrappers. Fluent v9 has no necessary one-to-one layout abstraction for these contracts. They use Fluent design tokens through CSS aliases and `makeStyles`; Fluent owns control state, focus, keyboard interaction and accessibility.

Remaining custom UI is structural HTML for layouts, JSON line numbers/indentation commands, metadata, code examples, runtime logs, and schema comparison content. These do not duplicate a standard control. No native button/input/select/textarea/dialog/details/label/progress implementations remain in business/playground JSX; the actual native elements are produced by Fluent itself. No menus, popovers, radio controls or determinate progress widgets were needed by the existing application, so no new business contracts or artificial interactions were added.

## Theme boundary

- `src/main.tsx`: the single application FluentProvider, outside BrowserRouter and Playground.
- `src/theme/guardianTheme.ts`: the Guardian-inspired v9 light theme, brand ramp, and custom chrome/editor tokens.
- `src/theme/tokens.css`: a compatibility bridge from layout semantic names to Fluent/provider variables; it contains no independent color palette.
- `src/components/uiStyles.ts`: component styling with `makeStyles`, Fluent tokens and merged classes.
- `src/components/icons.tsx`: one semantic icon resolver. JSON never names a concrete Fluent icon.

Existing Guardian Classic values were reused from the related `cayo.uischema.core` theme and office palette: navy `#2B3442`, cyan `#00B0F0`, Fluent blue `#0078D4`, hover `#006CBE`, pressed `#005BA1`, primary/secondary text `#323130` / `#605E5C`, and error `#CF2A28`. White-text actions use Fluent blue; cyan remains the brand highlight.

Large legacy widget CSS was removed. Remaining CSS defines layout, Guardian dark chrome, editor-specific presentation, and the arrangement of Fluent components. It does not reimplement switches, checkbox tracks, dropdown popups, focus traps, modal backdrops, button variants, or spinners.

## Packages and focus integration

Added Fluent v9 components and Fluent icons; removed `lucide-react`. No v8 library was introduced.

The installed Fluent/Tabster dependency tree otherwise mixed Keyborg major versions that share global focus state. `package.json` pins one Keyborg 3.498.0 implementation through npm overrides. The APIs consumed by Fluent/Tabster match; tests cover StrictMode mount/unmount, and browser verification covers dropdown activation and dialog keyboard handling. This fixes the observed disposal conflict rather than suppressing its errors. Modal-trigger buttons use Fluent `useRestoreFocusTarget`, with no custom focus trap or document key listener.

## Architecture proof and validation

Protected runtime, schemas and backend files were fingerprinted before editing and compared after migration: no changes. ComponentRegistry behavior and its schema keys are unchanged. There are no Fluent imports in runtime code, Fluent-specific schema types, business Redux/API access, inline actions, or domain-specific navigation dependencies.

`npm run lint` includes an AST/schema audit that now additionally checks native control duplication, Fluent leakage into the runtime/schemas, business namespace expressions, and legacy icon imports.

Existing integration tests now interact with real Fluent Dropdown options, Accordion panels and portalled drawers/dialogs, rather than assuming native selects or inline overlays. They retain actual backend/query/state assertions, app/view scope preservation, cancellation, safe bindings and Reports/Users rewiring. Additional tests cover callback adaptation, disabled options, unknown icons/missing selections, StrictMode focus dependency cleanup, and toast dismissal. Tests use the same FluentProvider/theme and do not mock Fluent controls. jsdom-only observer shims support layout APIs; browser QA verifies actual focus and keyboard behavior.

Manual checks cover all three tabs, Dropdown pointer/keyboard selection, the visibility sample, Reports filtering/details/run/toast, Users/Engineering selection/profile, architecture dialog Escape/Tab, and the runtime inspector. Screenshots document the final UI. Standard checks are lint, typecheck, unit/integration tests and production build.

Fluent adds client bundle weight; the build currently reports a non-blocking large-chunk warning. Route/vendor chunk optimization can be handled separately without changing runtime contracts.

References: [Fluent v9 package guidance](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-components), [Fluent Drawer guidance](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-drawer).

Final verification: lint and the architecture audit pass; typecheck passes; all 156 tests across 16 files pass; production build succeeds with the documented bundle-size warning. The final clean browser session reported no errors or warnings.
