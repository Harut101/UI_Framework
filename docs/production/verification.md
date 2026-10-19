# Проверка документации и проекта

Дата: **2026-10-19**. Проверено в текущем рабочем дереве; commit/release id не назначен.

| Команда | Результат |
| --- | --- |
| npm run docs:check | Успешно: 730 полей/props/API-членов, 37 registry types, 66 runtime-модулей, 6 валидных JSON-примеров |
| npm run lint | Успешно: ESLint без предупреждений; architecture audit — 130 source files и 15 JSON schemas |
| npm run typecheck | Успешно |
| npm test -- --maxWorkers=2 | Успешно: 393 теста в 33 файлах |
| npm run build | Успешно: TypeScript и Vite production build |

Vite сообщает advisory о chunk больше 500 kB: основной JS — 1 035,38 kB, gzip — 298,95 kB. Оптимизация bundle не входит в изменение документации.

Изменены справочные материалы, JSON-примеры и инструменты их проверки; runtime, backend и бизнес-компоненты не изменялись.

docs:check сопоставляет справку с текущими TypeScript declarations и registry, проверяет описания, локальные ссылки и примеры через существующие validators. Он не доказывает корректность каждого смыслового утверждения и не заменяет production security/performance review. Полные unit/integration tests проверяют текущую реализацию в пределах существующего набора.

Новый browser E2E прогон не выполнялся: это изменение документации, не UI. Успешная сборка не является подтверждением production-готовности; фактические границы описаны в [эксплуатации и ограничениях](production-operations.md).


## Проверка remote View navigation (2026-10-19)

После перехода Full Application на загрузку ViewDefinition по navigation URL:
- npm run lint: pass, architecture audit 130 source files / 15 schema files.
- npm run typecheck: pass.
- npm test -- --maxWorkers=2: 412 tests / 36 files passed.
- npm run build: pass; advisory о JS chunk >500 kB сохраняется (1 039,99 kB, gzip 300,54 kB).
- npm run docs:check: 744 property/API members, 37 component types, 66 runtime modules, 7 JSON examples.

Проверено в реальном браузере: Reports → Users через primary navigation; раскрытие Microsoft 365 DATA children → Contoso View; раскрытие Active Directory → domain View; переключение вкладки Domains меняет local state/bound text. HTTP/React tests также покрывают direct link, Back/Forward, schema error/retry, scope cleanup и StrictMode. Loader tests проверяют abort, dedup и late responses игнорирующего signal транспорта. Все navigation leaf URL проверены через реальный backend на валидную полную ViewDefinition.

Это отдельный прогон после исходного documentation-only snapshot выше. Реализация remote navigation описана в [контракте](remote-view-routing.md).

Финальные правки developer selector и отступов remote navigation View дополнительно проверены 14 целевыми tests (remote routing/API + schema rewiring), lint и build (включая tsc --noEmit). docs:check повторно прошёл. Полный прогон 412 tests выполнен перед этими локальными UI-правками.

## Проверка action-selected panels (2026-10-19)

После перехода на panel.open/schemaId/contextId и GET /api/ui/panels:

- npm run lint: pass; architecture audit 130 source files / 17 schema files.
- npm run typecheck: pass.
- npm test -- --maxWorkers=2: 416 tests / 37 files passed.
- npm run build: pass; Vite advisory о chunk >500 kB сохраняется (1 043,49 kB, gzip 301,79 kB).
- npm run docs:generate и docs:check: pass, 744 properties/API members, 37 component types, 66 runtime modules, 7 JSON examples.

Новые четыре HTTP/React integration tests покрывают backend FragmentDefinition validation/errors, открытие без выбранного объекта, изменение локальной формы, смену схемы внутри открытой панели, local API action, reuse definition cache с новым scope, смену одного contextId, отмену pending запроса и разные Microsoft 365/Active Directory trees. Legacy bare-tree endpoint и прежние Reports/Users/fragment workbench tests прошли в общем прогоне.

Реальный браузер: New user без выбора объекта → ввод имени → Run report panel → Run changes report (та же schemaId, другой contextId) → Start report run → Demo run accepted. Скриншот сохранён как dynamic-schema-panel.png в visualization workspace текущей задачи. Контракт и ограничения: [Динамические панели](dynamic-panels.md). Core runtime и бизнес-компоненты в этом изменении не менялись; вся связка задана View JSON и backend fragment definitions.

## Проверка dynamic schema request (2026-10-19)

Инициатор теперь задаёт полный request.path и query; SchemaOutlet не содержит адрес /api/ui/panels.

- Полный прогон: 429 tests / 38 files passed.
- После финальной правки, исключающей повторную интерпретацию пользовательского query текста как expressions: 46 целевых tests / 4 files passed, включая новый regression test (в файле dynamic-schema-request теперь 14 tests). Полный набор после этой локальной правки повторно не запускался.
- Финальные lint/architecture audit: pass, 130 source files / 17 JSON schemas.
- Финальный build с tsc --noEmit: pass. Vite advisory >500 kB остаётся: основной JS 1 044,97 kB, gzip 302,10 kB.
- docs:generate: pass, 744 properties/API members, 37 component types, 66 runtime modules, 7 JSON examples.

Реальный браузер: New user загружает форму с отдельного endpoint; Run report panel заменяет дерево в том же открытом контейнере. HTTP integration tests подтверждают фактические разные request.path, изменение query/context, независимый scope, cache reuse и cancellation. Сохранён dynamic-schema-request.png в visualization workspace задачи.

Контракт: [источник динамического содержимого](dynamic-panels.md). Это изменение загрузки source, а не реализация глобального popup/overlay service. Cross-scope state.set и implicit parent action lookup не добавлялись.

## Исправления архитектурного ревью (2026-10-19)

Все семь замечаний закрыты: полный schema request, literal resolved DATA, reactive View request, handler protection, normalized host URL policy, independent parent navigation/expansion, schema-owned branding.

- npm run lint: pass; architecture audit 132 source files / 17 JSON schemas.
- npm test -- --maxWorkers=2: 450 tests / 40 files passed, в том числе 20 новых regression tests.
- npm run build: pass, включая tsc --noEmit.
- npm run docs:generate и docs:check: pass; 751 properties/API members, 37 component types, 68 runtime modules, 7 JSON examples.
- Vite advisory о chunk >500 kB сохраняется: JS 1 047,51 kB / gzip 302,92 kB.

[Закрытие замечаний и evidence](../reviews/2026-10-19-runtime-architecture-audit.md). Глобальный popup/overlay host не добавлялся: это отдельный feature contract.

Browser verification после исправлений: GET user schema → POST report schema → изменение body-контекста в открытой панели → успешный demo report action; Reports → Users через primary navigation загружает Users View. Screenshot: architecture-review-fixed.png в visualization workspace задачи.
