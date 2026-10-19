# Архитектурное ревью: скрытые привязки и ограничения runtime

Дата: 2026-10-19. Проверено текущее рабочее дерево UI_Framework после перехода панелей на dynamic request.path/query. Это аудит реализации, а не подтверждение production-готовности.

Исходный результат: **6 замечаний P2 и 1 замечание P3**. Не обнаружены feature-specific ветки Reports/Users в RuntimeNode, BindingEngine или DependencyGraph; однако утверждать, что нежелательных хардкодов и скрытых ограничений нет, нельзя.

Runtime, backend, схемы и бизнес-компоненты в рамках ревью не исправлялись. Добавлен только этот отчёт. Временные диагностические React-тесты удалены после выполнения: они подтверждали фактическое нежелательное поведение, а не задавали правильное acceptance behavior.

## Статус после исправлений — 2026-10-19

**Все A1–A7 исправлены и проверены.** Разделы исходного аудита ниже сохраняют описание поведения до исправлений; указанные там номера строк относятся к исходному снимку.

| ID | Исправление | Реализация / acceptance |
| --- | --- | --- |
| A1 | Whole request binding передаёт method/path/query/body; один outlet работает с GET и POST | [resolveSchemaRequest](../../src/runtime/schema/resolveSchemaRequest.ts), [панель](../../src/schemas/views/playground/dynamic-fragment.json), [HTTP tests](../../tests/panel-schema-demo.test.tsx) |
| A2 | Declaration expressions отделены от literal resolved DATA; $sales/$100 не вычисляются повторно | [validateResolvedRequest](../../src/runtime/shared/validation.ts), [boundary tests](../../tests/request-boundary.test.ts) |
| A3 | Remote View подписана на resolved request identity, использует тот же snapshot, отменяет устаревшую lease | [RouteOutlet](../../src/runtime/routing/RouteOutlet.tsx), [ViewSchemaLoader](../../src/runtime/routing/ViewSchemaLoader.ts), [React regressions](../../tests/architecture-regressions.test.tsx) |
| A4 | Conflicts bindings/handlers отвергаются до render; generated callbacks имеют защитный приоритет | [validation](../../src/runtime/shared/validation.ts), [RuntimeNode](../../src/runtime/rendering/RuntimeNode.tsx), [React regressions](../../tests/architecture-regressions.test.tsx) |
| A5 | Общая normalized local URL policy для literal/template/bound/params и транспорта; prefixes задаёт host | [RequestPolicy](../../src/runtime/datasource/requestPolicy.ts), [boundary tests](../../tests/request-boundary.test.ts) |
| A6 | Parent label выбирает href, отдельный Expand/Collapse управляет children; группы без href совместимы | [PrimaryNavigation](../../src/components/application/PrimaryNavigation.tsx), [React regressions](../../tests/architecture-regressions.test.tsx) |
| A7 | Caption/footerText приходят через props/bindings; demo branding определён ApplicationDefinition | [Application JSON](../../src/schemas/application/reporting.json), [PrimaryNavigation](../../src/components/application/PrimaryNavigation.tsx) |

Финальная проверка исправленной реализации:

- npm test -- --maxWorkers=2 — **450 tests / 40 files passed** (включая 20 новых regression tests).
- npm run lint — pass; architecture audit 132 source files / 17 schema files.
- npm run build — pass, включая tsc --noEmit; advisory >500 kB остаётся (JS 1 047,51 kB, gzip 302,92 kB).
- npm run docs:generate и docs:check — pass: 751 properties/API members, 37 component types, 68 runtime modules, 7 JSON examples.

Проверено в реальном браузере после исправлений: New user (GET schema) → Run report panel (POST schema с body) → Run changes report (смена body.contextId при прежнем path/key) → Start report run → Demo run accepted. Закрытие панели и primary navigation Reports → Users загружают Browse all users без потери shell. Сохранён screenshot architecture-review-fixed.png в visualization workspace задачи. Новые callback/parent-href/reactive source edge cases дополнительно проверены acceptance React tests.

Host RequestPolicy задаётся четвёртым аргументом RuntimeEnvironment; default /api/ сохраняет прежнее demo-поведение. Другой local prefix задаётся явно и не требует изменений renderer/validator. Whole-request expression возвращает уже literal значения; прежние object-template sources сохраняются. Header/auth/внешние URL, глобальный popup-host и cache TTL/LRU остаются отдельными возможностями, а не незакрытыми A1–A7.

## Область проверки

| Слой | Проверенные файлы / роли |
| --- | --- |
| Application / View | src/runtime/application/ApplicationRuntime.ts, ApplicationHost.tsx; view/ViewRuntime.ts, ViewRuntimeHost.tsx |
| Scope / ownership | shared/RuntimeScope.ts, RuntimeEnvironment.ts, scopeAddress.ts |
| Rendering | rendering/RuntimeNode.tsx, ComponentRegistry.ts, ComponentBinder.ts, RuntimeScopeHost.tsx |
| Bindings | binding/ExpressionResolver.ts, BindingEngine.ts, paths.ts |
| Actions | actions/ActionEngine.ts, ActionRegistry.ts, createActionRegistry.ts, handlers |
| State / side effects | redux/createRuntimeStore.ts, listenerMiddleware.ts, changedPaths.ts, slices; datasource/DependencyGraph.ts |
| Datasources | datasource/DataSourceManager.ts, api.ts, inlineRequest.ts |
| Fragments | schema/SchemaFragmentManager.ts, SchemaOutlet.tsx; fragment/FragmentRuntime.ts, normalization/host |
| Routing | routing/RouteOutlet.tsx, ViewSchemaLoader.ts |
| Navigation DATA | data-tree/DataTreeRuntime.tsx, treeData.ts; contracts/tree.ts; PrimaryNavigation |
| Composition / UI | application/view JSON, shared registry/adapters, FullApplicationTab и Playground |
| Backend / guardrails | backend/routes/views.ts, schema.ts, navigation.ts; scripts/architecture-audit.mjs; актуальные тесты |

## Подтверждённые замечания

### A1 — P2: инициатор управляет только частью schema request

Место: [dynamic-fragment.json](../../src/schemas/views/playground/dynamic-fragment.json), строки 243–253; тот же outlet в Reports/Users.

Outlet читает path/query из state, но method остаётся GET, а body не передаётся. Если action положит в panel.request POST и body, они молча игнорируются.

Воспроизведено через настоящий ViewRuntime/ActionEngine/SchemaFragmentManager.prepare:

~~~json
{
  "selected": {
    "method": "POST",
    "path": "/api/ui/users/create",
    "query": {},
    "body": { "layout": "compact" }
  },
  "resolved": {
    "method": "GET",
    "path": "/api/ui/users/create",
    "query": {}
  }
}
~~~

Следствие: инициатор не может выбрать schema endpoint, требующий POST/body, без изменения outlet. При неизменных key/path/query смена только method/body не влияет на его resource identity, потому что эти данные до source request не доходят. Это оставшаяся неполнота сценария «что и откуда загружать решает инициатор».

Рекомендация: определить единый контракт передачи полного schema request из initiating action. Поддержать его через существующий SchemaFragmentManager, с отдельной проверкой declaration и resolved request. Definition cache и scope lifetime оставить независимыми. Не добавлять runtime-ветки по названию панели.

Acceptance: один outlet по двум named actions выполняет GET без body и POST с body; смена каждого поля фактического запроса заменяет resource и отменяет pending acquisition; schema key может остаться тем же.

### A2 — P2: navigation DATA повторно интерпретирует уже вычисленный query как выражение

Место: [treeData.ts](../../src/runtime/data-tree/treeData.ts), строки 135–141; [DataSourceManager.ts](../../src/runtime/datasource/DataSourceManager.ts), строки 158–160.

После ExpressionResolver.resolve проектор вызывает validateRequest на уже вычисленном запросе. acquireInline повторяет эту проверку. validateRequest проверяет строки query/body как author expressions.

Воспроизведено:

~~~text
state.query = "$sales"
childrenSource.request.query.search = "$state.query"

projectDataTree:
  childrenError = "Unknown namespace: $sales"
  requestCount = 0

dataSources.acquireInline({method:"GET",path:"/api/children",query:{search:"$sales"}}):
  error = "Unknown namespace: $sales"
  HTTP calls = 0
~~~

Пользовательский ввод с начальным $ превращается в ошибку; похожая проблема недавно устранялась для SchemaOutlet, но осталась в другом pipeline.

Рекомендация: разделить validation author expression declarations и validation буквальных resolved request данных. После resolve проверять method/path/query shape и transport policy, не запускать expression validation пользовательских значений.

Acceptance: $sales, $100 и вложенные query/body строки передаются как данные; неизвестный namespace в самой schema declaration по-прежнему отклоняется.

### A3 — P2: динамический View source не реактивен к своему appState request

Место: [RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx), строки 34–51 и 105; [ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts), разрешение source request при acquire.

ViewSource принимает полный path expression и query expressions, но RemoteView не подписан на их resolved значения. Его identity включает pathname и исходный source, а не resolved request. При неизменном browser URL изменение $appState.schemaPath не вызывает новый acquire.

Подтверждено React-тестом с настоящими ApplicationHost, RouteOutlet, ViewRuntimeHost и Redux:

~~~text
initial appState.schemaPath = /api/ui/one
HTTP schema requests = 1, loaded request = /api/ui/one
named state.set changes appState.schemaPath to /api/ui/two
HTTP schema requests = 1, previous View remains
~~~

Scope-aware resolver здесь корректен, но реакция на изменение входа отсутствует. Это отличается от SchemaOutlet, где resolved request участвует в Redux selector/identity.

Рекомендация: явно определить trigger contract ViewSource. Для реактивного source использовать selector resolved request и его identity. Если перезагрузка должна происходить только при navigation/retry, отразить это ограничение явно в контракте и предоставить отдельный reload-механизм. Не перезагружать View на любое нерелевантное Redux изменение.

Acceptance: выбранный trigger contract покрыт тестом; tenant/schema context может смениться при прежнем pathname; onLoaded changes нерелевантных breadcrumbs не запускают цикл.

### A4 — P2: bindings могут затереть сгенерированный handler callback

Место: [RuntimeNode.tsx](../../src/runtime/rendering/RuntimeNode.tsx), строка 55; [validation.ts](../../src/runtime/shared/validation.ts), независимые проверки bindings и handlers, строки 377 и 407.

Валидатор принимает:

~~~json
{
  "id": "probe",
  "type": "button",
  "bindings": { "onClick": "$state.label" },
  "handlers": { "onClick": { "action": "save" } }
}
~~~

ComponentBinder создаёт функцию onClick, но RuntimeNode применяет bindings после props/handlers. Реальный компонент получает строку/null/undefined вместо callback.

Подтверждено React-тестом: схема проходит validateViewDefinition; зарегистрированный probe получает onClick = "not a callback".

Рекомендация: запретить пересечения bindings/handlers в validation; дополнительно определить приоритет callback props при сборке props. Registry-level проверки callback contracts могут усилить диагностику.

Acceptance: конфликт отклоняется до render с путём свойства; корректные props bindings и local named handlers продолжают работать.

### A5 — P2: правило локального /api/ пути применяется неодинаково

Место: [validation.ts](../../src/runtime/shared/validation.ts), строки 96–97; [ExpressionResolver.ts](../../src/runtime/binding/ExpressionResolver.ts), строки 46–55; [api.ts](../../src/runtime/datasource/api.ts), строка 22.

Полный dynamic path проверяется с нормализацией URL. Literal path declaration проверяется только через startsWith("/api/"). Поэтому один и тот же фактический адрес принимается или отклоняется в зависимости от способа задания.

Воспроизведено:

~~~text
literal source.request.path = "/api/../../outside"
validateSchemaSource succeeds
SchemaFragmentManager.prepare.error = undefined
new URL(request.path, origin).pathname = "/outside"
~~~

Это демонстрирует обход заявленного ограничения prefix, а не доказательство обхода backend-авторизации. Никаких запросов к production API не выполнялось.

Рекомендация: применять единую host transport policy к нормализованному фактическому URL перед HTTP для literal/template/full-expression вариантов. Demo prefix /api/ и same-origin policy сделать явной конфигурацией host, если production API использует другой base URL.

Acceptance: literal/template/bound path с одинаковым resolved URL имеют одинаковый результат policy; custom ApiTransport не блокируется несвязанными demo assumptions на стадии declaration; backend authorization остаётся отдельной обязанностью.

### A6 — P2: navigation node с href и children нельзя выбрать

Место: [PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx), строки 30–32.

Для expandable item onClick всегда вызывает только onExpandedChange. Ветка onSelect доступна исключительно leaf node, хотя TreeDataNode допускает href вместе с children/childrenSource.

Подтверждено React-тестом:

~~~text
item: {id:"parent",label:"Parent",href:"/overview",children:[...]}
click Parent:
  onExpandedChange({value:["parent"]})
  onSelect: 0 calls
~~~

Для navigation DATA, где раздел имеет собственную overview View и дочерние ссылки, overview недоступна. Не меняйте компонент под конкретные tenant/domain/recovery IDs.

Рекомендация: определить независимые affordances выбора и раскрытия, например label/link и отдельный expand button. Альтернатива требует явного контрактного запрета href у групп, а не его молчаливого игнорирования.

Acceptance: parent overview и remote/static children доступны; selection/expansion controlled, компонент использует только props/callbacks.

### A7 — P3: branding и demo-статус зашиты в reusable navigation UI

Место: [PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx), строки 43 и 46.

GUARDIAN WORKSPACE и Connected demo workspace выводятся без props. Изменение brand в ApplicationDefinition/header не меняет эти тексты. Footer также показывает «Connected» при loading/error, хотя данные такого статуса компонент не получает.

Рекомендация: caption/footer/status передавать через props/bindings/children либо оставить их playground tooling. Это не API/Redux coupling и не feature-specific runtime branch, но schema-only переиспользование другого application shell сейчас неполное.

Acceptance: другой ApplicationDefinition меняет branding/footer без редактирования React; статус не обещает подключение без соответствующего входного prop.

## Что не является нарушением само по себе

- Backend map URL → ViewDefinition и seeded данные Reports/Users — допустимые demo definitions. Frontend runtime не должен знать эти IDs; в проверенных rendering/binding/dependency слоях таких веток не обнаружено.
- Имена component types в registry, generic action types и namespace names — часть контракта. Само наличие строк route-outlet/state.set/$state не является business hardcode.
- Изолированный ReportCard может отображать report fields/status. Наличие доменных props в доменном UI-компоненте не равно вызову API или зависимости runtime от отчётов.
- Routes трёх вкладок, selector Reports/Users и fixtures в playground — tooling, не business runtime.
- Один Redux store означает один store на application environment. Playground sandbox и Full Application имеют разные environments намеренно; fragments новых stores/Providers не создают.

## Явные ограничения и решения, требующие production-контракта

1. Prefix /api/ и same-origin fetch зафиксированы в demo policy. Custom transport внедряется, но declaration validation остаётся привязана к prefix. Headers/auth/query serialization/retry/timeout требуют host integration; request headers не появляются автоматически от добавления неизвестного JSON поля.
2. Application validation требует ровно один route-outlet; routes/views обязательны даже при remote viewSource, поэтому remote demo содержит []/{}. Это текущая single-active-View модель, а не feature-specific условие Reports.
3. Remote navigation реагирует на pathname. Search/hash не являются входом View loader. Если route/query context должен влиять на schema request, нужен явный контракт; это не покрыто текущей реализацией.
4. Восемь generic action types задаются TypeScript union, registry и validation switch. Новый тип требует согласованного изменения контракта/handler/validator, а не только register().
5. Global popup/overlay host отсутствует. Local state.set не открывает View-owned контейнер из произвольного fragment scope. Для такого сценария нужен общий generic overlay service с явным owner/disposal, без implicit parent writes и без нового renderer.
6. JSON schema type/props/callback names не имеют полной runtime shape validation по public component contracts. Большинство проверок гарантирует JSON/registry/named action references; неверные обязательные props могут обнаружиться при render. Это уже отражено в production limitations и важно при миграции.
7. Definition cache/inline data cache не имеют TTL/LRU. Inline data resources после release остаются до disposal scope; dynamic query contexts могут увеличивать retained entries. Для долгоживущего application shell нужна явная bounded cache policy.

## Зачем route-outlet находится в shell

В проекте используется type route-outlet. React-компонент из backend JSON не приходит: JSON содержит только строковый schema type, а frontend registry сопоставляет его существующему RouteOutlet.

Текущий путь:

~~~text
backend navigation item.href = /application/users
  → local named navigate action
  → browser pathname
  → RouteOutlet
  → ViewSchemaLoader
  → GET /api/ui/views?path=/application/users
  → validated ViewDefinition
  → ViewRuntimeHost / ViewRuntime
  → RuntimeNode(view.root)
~~~

ApplicationDefinition.shell задаёт место, куда должна быть вставлена текущая View. Header/navigation остаются в application scope, View заменяется и получает свой lifecycle. Application shell сам рендерится через RuntimeNode.

В [application JSON](../../src/schemas/application/reporting.json), строки 147–148:

~~~json
{
  "id": "application-route-outlet",
  "type": "route-outlet"
}
~~~

ViewSource.request.path находится в ApplicationDefinition, а не в RouteOutlet runtime: это настраиваемый backend resolver endpoint. Browser href и schema HTTP endpoint — разные адреса. Backend resolver связывает browser path с нужной ViewDefinition.

RouteOutlet не содержит заранее заданных reporting/users условий. Он отличается от SchemaOutlet уровнем ownership: первый размещает текущую полную View, второй загружает вложенный FragmentDefinition в уже существующий scope. Текущий validator требует одну такую точку View в shell. Удаление узла без другой точки монтирования оставит shell без содержимого View.

Пути реализации: [ApplicationHost](../../src/runtime/application/ApplicationHost.tsx), [RouteOutlet](../../src/runtime/routing/RouteOutlet.tsx), [ViewSchemaLoader](../../src/runtime/routing/ViewSchemaLoader.ts), [ViewRuntimeHost](../../src/runtime/view/ViewRuntimeHost.tsx).

## Подтверждённые invariants

| Проверка | Результат / границы |
| --- | --- |
| Общий RuntimeNode для Reports/Users/fragments | Подтверждено по registry/render path и regression tests |
| GenericNavigation не обращается к API/Redux | Подтверждено inspection + AST audit |
| Остальные business components используют props/callbacks | Не обнаружены запрещённые imports/hooks/network calls; branding/UI замечания выше |
| Named actions local to RuntimeScope | ActionEngine не делает parent lookup/cross-scope writes; scoped tests pass |
| Datasources/dependencies scoped | Identity scopeId/sourceId и scoped changed paths; isolation/dependency tests pass |
| UI не зависит от DependencyGraph | RuntimeNode использует useSelector/BindingEngine; graph применяется listener side effects |
| Lifecycle/cancel/cache/nesting | Существующие fragment/schema/data tests pass; новые edge cases выше не опровергают эти покрытые гарантии |
| Нет EventDispatcher/EventBindingResolver | По исходникам/AST audit не обнаружены |
| Application shell schema-generated | ApplicationHost → RuntimeNode(shell); route placement объявлен JSON |

## Верификация

Выполнено на текущей реализации:

- npm run lint — pass; architecture audit: 130 source files / 17 schema files.
- npm test -- --maxWorkers=2 — **430 tests / 38 files passed**, полный прогон.
- npm run build — pass, включая tsc --noEmit.
- Три дополнительных временных React audit probes — pass: подтверждены A3/A4/A6 с фактическим нежелательным поведением. Они не входят в число 430.
- Node/tsx probes с реальными RuntimeEnvironment/ViewRuntime/ActionEngine/managers — подтверждены A1/A2/A5.
- Новый browser E2E прогон в этом ревью не выполнялся. Интеракции A3/A4/A6 проверены React DOM/Fluent в jsdom; штатные HTTP integration tests используют настоящий Express backend.

Vite предупреждает о chunk >500 kB: JS 1 044,97 kB / gzip 302,10 kB. Это отдельное известное ограничение поставки, а не доказательство архитектурного hardcode.

Успешные существующие тесты и AST audit не доказывают отсутствие хардкодов: audit использует конкретные forbidden patterns, а не полную семантическую модель. Новые воспроизведения находят незакрытые сценарии при зелёном baseline.

## Рекомендуемый порядок исправлений

1. A2 и A4: разделить resolved data/expression validation и защитить handler props; добавить acceptance tests.
2. A1: завершить контракт полного initiating request без fixed method/body assumptions.
3. A3: определить и реализовать trigger policy для resolved View source.
4. A5: согласовать host transport policy и нормализацию actual URL.
5. A6/A7: сделать navigation selection/expansion и branding полностью управляемыми props.
6. Отдельно определить global overlay ownership/lifecycle и registry-driven popup adapter.
7. После согласования production transport/route/cache контрактов расширить архитектурные guardrails. Условие приёмки — новый application/view/fragment сценарий меняет только definitions и разрешённые adapters, не добавляет feature branches в runtime.
