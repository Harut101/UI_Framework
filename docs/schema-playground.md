# Editable Schema Playground

The Schema Playground tab has a JSON editor on the left and a real runtime preview on the right. It uses the same ComponentRegistry and reusable UI implementations as the Components catalog.

## Execution path

```text
JSON text
  → parseViewDefinition
  → JSON.parse + validateViewDefinition
  → ViewDefinition
  → ViewRuntimeHost / ViewRuntime
  → RuntimeNode
  → registered React components
```

The playground does not interpret component trees, resolve bindings, dispatch state actions, or perform datasource requests. It only manages the draft, sample selection, validation results, and lifecycle of a validated definition. BindingEngine, ActionEngine, Redux, and DataSourceManager retain their existing responsibilities.

## Editor behavior

The editor is an accessible, locally hosted textarea with line numbers, cursor status, two-space indentation/outdent, indented newlines, and syntax-error line feedback. It avoids Monaco's worker/asset setup and adds no dependencies or remote assets.

- Valid edits apply after 300ms, or immediately using Apply now / Ctrl or Command + Enter (Ctrl or Command + S also applies).
- Format JSON pretty-prints parseable JSON. Whitespace-only changes do not reset a running view.
- Reset restores the selected sample and reinitializes its view state, even when the editor text already matches the sample.
- Loading a different sample disposes the old ViewRuntime and cancels its requests.
- Parse or structural validation errors keep the last valid preview alive and display diagnostics below the editor.
- Applying a changed valid definition creates a fresh ViewRuntime; app scope remains active.
- Tab indents and Shift+Tab outdents. Ctrl or Command + M, or the Tab mode button, switches Tab to normal focus navigation to avoid trapping keyboard users.

`PreviewErrorBoundary` contains rendering and lifecycle failures inside the preview. A corrected valid definition or sample change automatically clears the boundary. Retry preview reinitializes the last accepted definition. Callback/action errors remain handled by ComponentBinder, and datasource errors remain loading/error entries rather than render exceptions.

## Samples

| Sample | What it demonstrates |
| --- | --- |
| A · Simple form | TextInput, Select, Switch, nested state paths, named actions, and a saved-message visibility condition |
| B · Visibility demo | checked ← $state.showAdvanced; onChange → setShowAdvanced → state.set → Redux → BindingEngine selector → RuntimeNode visibility |
| C · State bindings & actions | The original text/button vertical slice, kept as the default sample |
| D · Datasource demo | GET /api/items, search dependencies, safe empty defaults, loading, selection, reload, simulated failures, slow requests, and cancellation |
| E · Nested layout demo | Page, PageHeader, SplitLayout, Stack, Card, ReportCard, UserCard, SidePanel, and named action sequences |

The samples are bundled JSON definitions. `samples.ts` only provides editor labels/descriptions and serializes those definitions; all composition and behavior are still in the JSON.

## Backend datasource

`backend/routes/items.ts` serves `backend/data/demoItems.ts` as `{ items: [...] }`:

- `GET /api/items` returns six fictional workspace items after a short delay.
- `search` filters title, description, and category text.
- `fail=true` returns a controlled 503 error.
- `slow=true` uses a 1.2s delay to exercise loading and stale-request cancellation.

The datasource sample declares its request, dependsOn paths, and onViewInit/onDependencyChange policy. Its list binding is:

```json
{
  "items": {
    "source": "$data.items.data.items",
    "default": []
  }
}
```

Missing/null intermediates resolve to undefined and use binding defaults. Malformed, unknown-namespace, and unsafe paths are rejected during validation, preserving the running preview. Static props and initial state are literals; dollar-prefixed text is not interpreted there. Structural validation cannot infer every component's full prop contract, so incompatible prop shapes are caught by the render boundary.

## Optional inspector

Runtime inspector below the editor displays `$appState`, `$appData`, `$state`, and `$data` using a store subscription in playground tooling. It is never imported by business components. The inspector reflects the running view, including the last valid view while the draft is invalid; failed/unmounted views show empty view namespaces.

## Verification

Tests cover all five definitions, typed validation, editor indentation, live application, retained previews, format/reset semantics, visibility through real actions/store/selectors, safe missing-path defaults, datasource initialization/cancellation, render failure recovery, and the four inspector namespaces. Backend tests exercise the actual items route, filtering, failures, and recovery.
