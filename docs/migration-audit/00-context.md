# 00 — Контекст аудита

Дата аудита: **2026-10-19**. Аудит выполнен по рабочему дереву без изменений реализации; новые файлы находятся только в `docs/migration-audit/`.

## Целевой репозиторий (объект аудита)

| Параметр | Значение |
| --- | --- |
| Путь | `C:\Users\aruta\Projects\UI_Framework` |
| Remote | `git@github.com:Harut101/UI_Framework.git` |
| Ветка | `main` (up to date с `origin/main` на момент аудита) |
| Commit | `ed2b970c4c6bcd5d0b60fe56a8bed8139e863fe8` — "schema", 2026-10-19 09:34 +0400 |
| Рабочее дерево | Чистое до аудита; после аудита изменён только `docs/migration-audit/` (и gitignored `dist/` пересобран `npm run build`) |
| package.json | `schema-runtime-playground@1.0.0`, `engines` не задан; README рекомендует Node 22.13+ |
| Среда проверки | Windows 11, Node v24.12.0, npm 11.6.2 |
| Стек | React 19.1, react-redux 9.2, @reduxjs/toolkit 2.9, react-router-dom 7.9, @fluentui/react-components 9.74, Express 5, Vite 7, Vitest 3, TypeScript 5.9 |

Объём: 257 файлов без `node_modules/.git/dist`; runtime — 66 модулей в `src/runtime` (≈3 000 строк), 37 registry-типов компонентов, 33 тестовых файла.

## Применимые инструкции

- **AGENTS.md в целевом репозитории отсутствует.** Поиск `find . -iname agents.md` (без node_modules) ничего не нашёл. Применимых AGENTS.md-инструкций для UI_Framework нет.
- `CLAUDE.md` в UI_Framework также отсутствует. CLAUDE.md рабочей директории сессии (`cayo.ui.forge`) описывает другой репозиторий и к объекту аудита не применялся.
- AGENTS.md есть в `cayo.uischema.core` (см. ниже). Он относится к будущему этапу сравнения и на этом этапе не читался.

## Прочитанная документация (отправная точка)

| Документ | Статус |
| --- | --- |
| `docs/production/README.md` и все связанные: `schema-reference.md`, `expressions-actions.md`, `data-navigation.md`, `scopes-fragments.md`, `runtime-layers.md`, `production-operations.md`, `verification.md`, `examples.md`/`examples.json` | Прочитаны полностью |
| `docs/production/components-reference.md`, `contracts-api-reference.md`, `coverage.json` | Сгенерированы `scripts/verify-documentation.mjs`. Проверены через `npm run docs:check`, а не построчно |
| `docs/runtime-scope-migration.md` | Прочитан полностью (779 строк, исторические Tasks 1–10) |
| `docs/runtime-final-audit.md`, `README.md` | Прочитаны полностью |
| Остальные `docs/*.md` | Проверены выборочно (grep на ссылки к несуществующим файлам) |

## Источники для следующего этапа сравнения (только доступность)

На этом этапе эти репозитории **не анализировались** — только зафиксировано, что они доступны.

| Репозиторий | Путь | Ветка | Commit | Remote |
| --- | --- | --- | --- | --- |
| cayo.uischema.core (содержит schema core, вероятно "cayo.ui.schemacore") | `C:\Users\aruta\Projects\cayo.uischema.core` | `feature/35160-hardcoded-colors-replace` | `aa509b9a` (2026-09-15) | Azure DevOps `UISchema/cayo.uischema.core` |
| ServiceManager | `C:\Users\aruta\Projects\ServiceManager` | `develop` | `045dff9a` (2026-10-13) | `cayosoft.visualstudio.com/ServiceManager` |
| cayo.ui.kit (renderer `cayo.ui`) | `C:\Users\aruta\Projects\cayo.ui.kit` | `bugfix/32943-copy-clipboard` | `6c9541a0` | Azure DevOps `UISchema/cayo.ui.kit` |
| cayo.ui.wizards | `C:\Users\aruta\Projects\cayo.ui.wizards` | `feature/35236-eula-activation-text` | `c65423e9` | Azure DevOps |
| cayo.ui.forge | `C:\Users\aruta\Projects\cayo.ui.forge` | `master` | `da96d701` | Azure DevOps `UISchema/cayo.ui.forge` |
| cayo.uischema.admin | `C:\Users\aruta\Projects\cayo.uischema.admin` | `bugfix/35414-fix-nav-icons` | `7dc6d9ab` | Azure DevOps |

**Предположение:** "cayo.ui.schemacore" из задачи соответствует репозиторию `cayo.uischema.core`. Отдельного каталога с именем `*schemacore*` нет. Сопоставление нужно подтвердить перед этапом сравнения. Ветки сравниваемых репозиториев — feature/bugfix, а не основные. Для сравнения нужно выбрать базовые ветки.

## Выполненные проверки

Все команды запускались из корня UI_Framework.

| Команда | Результат |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm test` (`vitest run`) | Exit 0: **33 test files / 393 tests passed**, 46.7 s. В логе нет предупреждений `warning`/`stderr`/`act(` |
| `npm run lint` | Exit 0: ESLint `--max-warnings 0`. Architecture audit: "130 source files, 15 JSON schemas" |
| `npm run docs:check` | Exit 0: "730 properties/API members, 37 component types, 66 runtime modules, 6 valid JSON examples" |
| `npm run build` | Exit 0: `tsc --noEmit` + Vite. Advisory: chunk 1 035.38 kB (gzip 298.95 kB) > 500 kB |
| Поведенческие probes (`node --import tsx`, скрипт вне репозитория) | 11 проверок расхождений, результаты в [01-target-runtime-audit.md](01-target-runtime-audit.md), раздел 13 |

Ограничения:

- Browser E2E runner в проекте не настроен. Ручной browser walkthrough в этом аудите **не выполнялся**.
- React-тесты используют jsdom, HTTP-тесты — реальный Express.
- Производительность (селекторы, линейный граф) не измерялась. Выводы о ней — предположения по коду.
- Probe-скрипт: `C:\Users\aruta\AppData\Local\Temp\claude\c--Users-aruta-Projects-cayo-ui-forge\4b59ad4f-d770-40bc-8c28-3b0e12c7cb7e\scratchpad\probes\probe.mts`. Вывод: `...\scratchpad\probes\probe-output.json`. Временные файлы, в репозиторий не добавлены.
