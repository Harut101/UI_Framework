> The Fluent UI migration now supplies this palette through guardianTheme and FluentProvider. See [current implementation](fluent-migration.md). The notes below record the preceding CSS theme pass.

# Guardian visual theme

This is a CSS-only theme update. Runtime, React component behavior, registry, contracts, schemas, backend, and tests are unchanged. All three tabs keep their existing structure and interactions.

## Existing values reused

The related workspace project already defines Guardian Classic styling:

- `../cayo.uischema.core/src/Cayo.UI.Schema.Api/wwwroot/Themes/Classic/theme.json`: navigation/header `#2B3442`, highlight `#00B0F0`, logo `#25C6FF`, orange `#FF801E`, error `#CF2A28`.
- `Classic/office-palette.json`: Fluent primary `#0078D4`, hover `#006CBE`, pressed `#005BA1`, text `#323130` / `#605E5C`, control border `#8A8886`.
- The Dark palette also uses `#00B0F0` as themePrimary. Forge consumes these palettes through its existing Fluent theme infrastructure.

These values are reused as standalone CSS tokens, without importing a sibling repository or adding another theme library. They are a snapshot of the existing theme, with source attribution; upstream changes can be applied in one file.

## Central definition

`src/theme/tokens.css` is imported by `src/styles.css`. Guardian base values feed semantic roles for app/canvas/surface/hover, navigation, accents, text, borders/focus, statuses, code, callout, and shadows. Component and playground CSS consume these roles with `var(--...)`. No color literals remain in the other six stylesheets or React components.

Cyan is retained for brand identity. White-text actions and global selection use the existing darker Fluent blue: white on bright cyan does not provide sufficient normal-text contrast. Light selected facets and technical badges use the darker accent-text role. Success green and warning amber prioritize legibility on light surfaces over copying bright legacy fills into text.

## Files changed

- `src/theme/tokens.css` — new centralized, attributed palette and semantic roles.
- `src/styles.css` — tokens import, navy shell, tabs, shared buttons/focus, neutral canvas.
- `src/components/components.css` — common controls, cards, navigation, text, statuses.
- `src/playground/components-tab/catalog.css` — white preview/contract surfaces, blue selection, dark examples.
- `src/playground/schema-tab/schema-playground.css` — dark editor, neutral preview, clear validation states.
- `src/playground/application-tab/application.css` — Guardian shell, light facets, report/user cards, strong callout CTA.
- `src/playground/application-tab/inspector.css` — consistent developer tooling and architecture modal.
- `docs/guardian-theme.md` — provenance, scope, verification and design notes.

## Contrast verification

WCAG relative-luminance calculations for the semantic foreground/background pairs:

| Pair | Ratio |
| --- | ---: |
| Primary text / white | 12.98:1 |
| Secondary text / workspace | 5.91:1 |
| Placeholder / white | 5.56:1 |
| Muted navigation / navy | 8.31:1 |
| White / primary or selected blue | 4.53:1 |
| Technical/selected text / light accent | 4.76:1 |
| Success / success surface | 4.82:1 |
| Warning / warning surface | 5.68:1 |
| Error / error surface | 4.72:1 |
| Code text / editor | 12.25:1 |
| Line numbers / gutter | 6.52:1 |
| White / callout CTA endpoints | 6.01:1 / 11.17:1 |
| Control border / white | 3.53:1 |
| Focus ring / white | 4.53:1 |

These text pairs pass the 4.5:1 normal-text threshold; control borders/focus pass 3:1. Browser checks cover actual rendered text pairs, primary hover, keyboard focus, disabled controls, invalid schema feedback, inspector/modal, and Reports/Users views. This is targeted visual/contrast verification, not a full accessibility certification. Brand/logo colors are decorative identity, not body text.

## Visual review notes

Screenshots capture Components, Schema Playground and Reports Catalog at the existing desktop viewport. Navigation, cards, facets, editor and tooling now share one palette. No desktop horizontal overflow was observed. Existing responsive layout rules remain; this change does not redesign their behavior.

The callout retains a warm accent strip and a restrained dark gradient CTA. Both are intentional special treatments centralized in tokens. Brand owners may want to review exact cyan/logo fidelity and the callout gradient against current Guardian brand guidance; no remaining functional or legibility blocker was observed.
