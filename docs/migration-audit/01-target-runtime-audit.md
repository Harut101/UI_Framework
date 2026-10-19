# 01 — Независимый аудит целевого runtime (UI_Framework)

Объект: commit `ed2b970`, ветка `main` (контекст — [00-context.md](00-context.md)). Полный реестр полей — [target-contract-inventory.json](target-contract-inventory.json). Матрица возможностей — [target-feature-matrix.csv](target-feature-matrix.csv).

## Уровни утверждений

- **[Ф] Факт** — проверено чтением кода с `file:line` и/или тестом, проходящим в текущем прогоне, и/или probe-скриптом (раздел 13). Наличие класса фактом работоспособности не считается: для поведения указан тест или probe.
- **[П] Предположение** — вывод по коду без исполнения (например, производительность или поведение React-границы ошибок в непротестированном сценарии).
- **[Р] Рекомендация** — предложение для этапа миграции. Не описание текущего состояния.

Пути даны от корня UI_Framework; `src/runtime/` сокращён до `rt/`.

---

## 0. Главные выводы

| # | Вывод | Уровень | Доказательство | Значимость для миграции |
| --- | --- | --- | --- | --- |
| K1 | Один Redux store на `RuntimeEnvironment`. Fragments не создают store/Provider | Ф | `rt/shared/RuntimeEnvironment.ts:31` единственный вызов `createRuntimeStore`; `rt/redux/createRuntimeStore.ts:48` единственный `configureStore`; AST-правила `scripts/architecture-audit.mjs:28-30,36-39`; тест `tests/runtime-scope.test.ts:45` | Базовый инвариант соблюдён |
| K2 | **Только одна активная View на environment.** Создание второй View уничтожает первую | Ф | `rt/shared/RuntimeEnvironment.ts:77-80` (`previousView?.dispose()`), единственные слайсы `viewState`/`viewData` (`rt/redux/createRuntimeStore.ts:19-25`), probe P10 | **Высокая**: параллельные View (split/dialog-as-view/несколько маршрутов) невозможны без изменения store shape |
| K3 | `$state`/`$data` адресуют текущий scope. `$viewState`/`$appState` — предков. Нет implicit parent action lookup | Ф | `rt/shared/scopeAddress.ts:6-21`, `rt/binding/ExpressionResolver.ts:7-24`, `rt/actions/ActionEngine.ts:15-19,55-56`; тесты `tests/scope-bindings.test.ts:43`, `tests/scoped-actions.test.ts:80,95,197` | Соблюдено. Legacy bare-tree ответы намеренно используют host scope (`rt/fragment/normalizeFragmentDefinition.ts:78-83`) |
| K4 | React rendering не зависит от DependencyGraph | Ф | `DependencyGraph` импортируют только `rt/shared/RuntimeEnvironment.ts:1` и `rt/shared/validation.ts:3` (grep); `RuntimeNode` подписан через `useSelector` (`rt/rendering/RuntimeNode.tsx:27-31`); тест `tests/full-application.test.tsx:110` | Соблюдено |
| K5 | Definition cache (JSON) и runtime lifetime (scope) разделены | Ф | `rt/schema/SchemaFragmentManager.ts:25-28` (`entries` vs `requests`), `rt/schema/SchemaOutlet.tsx:53-63` (retention); матрица 4×2 `tests/schema-outlet-lifecycle.test.tsx:45`, `:109` | Соблюдено |
| K6 | Валидация **не строгая**: неизвестные поля в actions/dataSources/requests/named schema sources/components принимаются молча. Опечатки (`visibilty`, `onClik`) не обнаруживаются | Ф | `rt/shared/validation.ts:96-290` (нет проверки лишних ключей, кроме fragment envelope и inline source); probes P5–P5e | **Высокая** для авторов схем и автоматической конвертации из старого формата |
| K7 | Bindings/handlers не сверяются с публичным контрактом компонента: у registry нет метаданных props/callbacks | Ф | `rt/rendering/ComponentRegistry.ts:4-21` (только `Map<type, ComponentType>`); `rt/shared/validation.ts:259-286`; probe P5d | **Высокая**: required props (`items`) без binding падают в адаптере (`items.map`) уже во время render |
| K8 | `api.request` принимает `$expr` в `request.path` на этапе валидации, но не подставляет его при исполнении | Ф | `rt/shared/validation.ts:70` валидирует токены; `rt/actions/handlers/apiRequest.ts:16-19` использует `resolve`, а не `resolvePath`; probe P1 → путь `"/api/x/$state.id"` уходит в transport | Средняя. Задокументировано (`docs/production/expressions-actions.md:88`), но validator это не ловит |
| K9 | В runtime есть deployment/домен-специфичные константы: обязательный префикс `/api/`, Guardian-поле `childLinksSourceUrl`, захардкоженные registry-типы `error-message`/`spinner` и англоязычные тексты | Ф | `rt/shared/validation.ts:71-72` ("Demo requests must use a local /api/ path"), `rt/data-tree/treeData.ts:57-62`, `rt/schema/SchemaOutlet.tsx:73-80` | Средняя: нужно параметризовать до интеграции с ServiceManager/другими API |
| K10 | Бизнес-компоненты изолированы от Redux/API/runtime | Ф | `scripts/architecture-audit.mjs:24,33,40-41`, `tests/architecture.test.ts:8`; grep `useSelector|fetch(` в `src/components` пуст | Соблюдено. Но в компонентах есть inline styles и demo/brand-строки (раздел 14) |
| K11 | StrictMode: создание View/Fragment защищено microtask-ownership. Application lifecycle **не** имеет runtime-хоста — каждый host пишет свой | Ф | `rt/rendering/RuntimeScopeHost.tsx:15-24`; хосты `src/playground/Playground.tsx:23-27`, `src/playground/application-tab/FullApplicationTab.tsx:62-66`; признано в `docs/production/scopes-fragments.md:40` | Средняя: нужен `ApplicationRuntimeHost` |
| K12 | Отмена/stale-guards есть для datasource, schema acquisition и inline DATA. `api.request` защищён только scope-сигналом: параллельные вызовы одного action пишут target в порядке завершения | Ф (код) / П (последствия) | `rt/datasource/DataSourceManager.ts:145-174`, `rt/schema/SchemaFragmentManager.ts:109-131`, `rt/actions/handlers/apiRequest.ts:27-46`; теста на out-of-order нет | Средняя: нет policy takeLatest/queue для команд |
| K13 | Нет route params/query namespace, guards, nested или remote routing | Ф | `rt/routing/RouteOutlet.tsx:15-47`, `rt/routing/ViewSchemaLoader.ts:4-8`; grep `useParams` пуст | **Высокая** для приложений с deep-link-навигацией |
| K14 | Нет `$inputs` (parent → fragment), нет операторов в выражениях и нет escape для литерала `$...` | Ф | `rt/shared/json.ts:18-21`, `rt/shared/validation.ts:41-64`, `docs/production/expressions-actions.md:27` | Высокая для переноса сложной логики видимости/вычислений |
| K15 | Все существующие проверки зелёные (393/393 tests) | Ф | [00-context.md](00-context.md) | Тесты подтверждают текущий контракт, а не полноту контракта для production |

---

## 1. Архитектура в целом

```text
RuntimeEnvironment (1 store, resolver, Diagnostics, ActionRegistry, DependencyGraph, SchemaFragmentCache, transport/navigate/notify)
  └─ RuntimeScope(application) ─┬─ RuntimeScope(view)  [единственная активная]
                                │     └─ RuntimeScope(fragment)* ── fragment* (≤32)
                                └─ RuntimeScope(fragment)* (app-owned, без view)
Render:  ApplicationHost → RuntimeNode(shell) → route-outlet → ViewRuntimeHost → RuntimeScopeHost → RuntimeNode(root)
         → schema-outlet → FragmentRuntimeHost → RuntimeScopeHost → RuntimeNode(fragment root)
```

**[Ф]** Путь UI-события: `ComponentBinder` (`rt/rendering/ComponentBinder.ts:6-23`) → `ActionEngine.execute` (`rt/actions/ActionEngine.ts:41-63`) → handler из `ActionRegistry` (`rt/actions/createActionRegistry.ts:12-22`) → `runtimeActions.set/patch` → reducers → `useSelector` в `RuntimeNode` (`rt/rendering/RuntimeNode.tsx:27-31`).

**[Ф]** Путь side effects: listener middleware (`rt/redux/listenerMiddleware.ts:13-21`) → `getChangedPaths` (`rt/redux/changedPaths.ts:8-47`) → `DependencyGraph.affected` (`rt/datasource/DependencyGraph.ts:75-87`) → группировка по scopeId (`rt/shared/RuntimeEnvironment.ts:32-38`) → `DataSourceManager.dependenciesChanged` (`rt/datasource/DataSourceManager.ts:49-78`).

---

## 2. ApplicationRuntime, ViewRuntime, FragmentRuntime

| Компонент | Факты | Тесты |
| --- | --- | --- |
| `ApplicationRuntime` | Тонкий subclass: `super(definition, "application", environment)`, `rt/application/ApplicationRuntime.ts:4-11`. Своей логики нет | `tests/runtime-scope.test.ts:45,192` |
| `ApplicationHost` | Создаёт `ViewSchemaLoader` и `RouteRuntimeContext`, затем рендерит `shell` через `RuntimeNode` (`rt/application/ApplicationHost.tsx:10-44`). Runtime **не создаёт и не стартует** — это делает внешний host | `tests/full-application.test.tsx:70` |
| `ViewRuntime` | Subclass с `type 'view'`; parent по умолчанию — `environment.ensureApplicationScope()` (`rt/view/ViewRuntime.ts:4-8`, `rt/shared/RuntimeScope.ts:31`) | `tests/runtime-scope.test.ts:91,184` |
| `ViewRuntimeHost` | `useCallback(create)` → `RuntimeScopeHost` (`rt/view/ViewRuntimeHost.tsx:8-13`). Scope заменяется при смене reference `definition` | `tests/react.test.tsx:84` |
| `FragmentRuntime` | Нормализует envelope **повторно** (вход уже нормализован в `SchemaOutlet`), проверяет глубину ≤32 fragment-предков, создаёт `RuntimeScope('fragment')` (`rt/fragment/FragmentRuntime.ts:10-20`) | `tests/fragment-runtime.test.ts:111-161` |
| `FragmentRuntimeHost` | `useCallback(create)` по `[definition, parent, registry, origin]` → `RuntimeScopeHost` (`rt/fragment/FragmentRuntimeHost.tsx:9-17`) | `tests/fragment-runtime-react.test.tsx:48-140` |

**[Ф]** Bootstrap-совместимость: standalone `ViewRuntime` без приложения создаёт `runtime.application` (`rt/shared/RuntimeEnvironment.ts:49-55`). Позже реальное приложение «усыновляет» детей и обновляет регистрации графа (`:65-76`). Тест — `tests/runtime-scope.test.ts:91`, `tests/scoped-datasources.test.ts:276`.

**[Ф]** Вторую явную application environment отвергает: `RuntimeEnvironment.ts:60-61`.

**[Р]** Добавить в runtime `ApplicationRuntimeHost`, симметричный `RuntimeScopeHost`: создание и `start` в ownership-microtask, dispose в cleanup. Сейчас это логика host-кода.

---

## 3. RuntimeScope и lifecycle

| Шаг | Реализация | Тест |
| --- | --- | --- |
| Конструктор: правила parent | application без parent, fragment требует parent, view требует application-parent; parent должен быть активен в том же environment (`rt/shared/RuntimeScope.ts:29-35`) | `tests/runtime-scope.test.ts:78` |
| Identity | `${definition.id}:${++nextScopeId}` — module-global счётчик (`:36`); не персистентен | `tests/runtime-scope.test.ts:55` |
| Composition | `SchemaFragmentManager`, `DataSourceManager`, `ActionEngine` на scope; shared resolver/registry/transport (`:38-47`) | `tests/runtime-scope.test.ts:45` |
| initialize (eager в конструкторе, idempotent) | `structuredClone(initialState)`, idle DataEntry; `dataSources.initialize()` регистрирует граф **до** `registerScope`; при ошибке откат (`:65-87`) | `tests/runtime-scope.test.ts:106,134`; `tests/scoped-datasources.test.ts:268` |
| active() | Не disposed, предки активны, адрес в store совпадает (`:89-95`) | `tests/scope-bindings.test.ts:77` |
| start | `if (active()) dataSources.start()` (`:97`); idempotent через `started` (`rt/datasource/DataSourceManager.ts:41-48`) | `tests/runtime-scope.test.ts:155` |
| dispose | disposed → abort signal → рекурсивно дети → datasources → schema → unregister → `disposeScope` в Redux (`:99-109`); idempotent | `tests/runtime-scope.test.ts:167-202` |

**[Ф]** Stale-guard на уровне reducer: `set/patch/dataChanged/disposeScope` для неактивного адреса игнорируются (`rt/redux/createRuntimeStore.ts:40-43`); probe P11.

**[П]** `active()` на каждый вызов читает `store.getState()` и рекурсивно обходит предков. Он вызывается в селекторах `SchemaOutlet` на каждый dispatch. При глубокой вложенности и большом числе outlets это стоит CPU. Не измерялось.

---

## 4. RuntimeNode, ComponentRegistry, ComponentBinder

**[Ф]** `RuntimeNode` (`rt/rendering/RuntimeNode.tsx:15-51`):

- `memo`; `BindingEngine.createSelector` мемоизирован по `[bindings, visibility, runtime]` (`:27-30`); `useSelector(..., shallowEqual)` (`:31`).
- Порядок props: static `props` → generated handlers → bindings (`:47`). Binding с именем callback перекрывает handler (так задокументировано: `docs/production/schema-reference.md:74`).
- `children` из схемы всегда передаются JSX-детьми, поэтому `props.children` из JSON перекрывается (`:47-49`).
- React key детей — `child.id` (`:40`). Уникальность проверяет validator (`rt/shared/validation.ts:232`).
- `visibility=false` → `return null` (`:44`): дочерние outlets размонтируются и dispose (тест `tests/schema-outlet-lifecycle.test.tsx:146`).
- Собственной error boundary нет. Ошибки адаптера ловит ближайшая `FragmentRenderBoundary` (только для загруженных fragments) или boundary хоста (`src/playground/schema-tab/PreviewErrorBoundary.tsx`).

**[Ф]** `ComponentRegistry` (`rt/rendering/ComponentRegistry.ts:4-21`): `Map<string, ComponentType>`; повторный `register` перезаписывает; `get` бросает `Unknown component type`. **Метаданных props/callbacks/required нет.**

**[Ф]** `ComponentBinder.bind` (`rt/rendering/ComponentBinder.ts:6-23`): для каждого handler создаёт `(event) => void engine.execute(action, {event, scope}).catch(...)`. Ошибка пишется в diagnostics (`kind: 'error'`) и уходит в `notify(message,'error')`. Тесты: `tests/runtime-infrastructure.test.ts:254`, `tests/scoped-actions.test.ts:145,153`.

**[Ф]** Registry-типы не проверяются на соответствие handler-ключей callback-пропсам. Probe P5d: `handlers.onClik` и `bindings.lable` у `button` проходят валидацию.

---

## 5. ExpressionResolver и BindingEngine

**[Ф]** Синтаксис: только целая строка, начинающаяся с `$` (`rt/binding/ExpressionResolver.ts:37`). Корни: `$state $data $viewState $viewData $appState $appData $event $response` (`:20-23,39-43`). Объекты и массивы разрешаются рекурсивно, ключи проверяет `pathParts` (`:49-58`). Остальные значения — литералы (`:59`).

**[Ф]** Безопасность путей: запрещены `__proto__/prototype/constructor` и пустые сегменты (`rt/binding/paths.ts:1-7`). Читаются только own-properties (`:12`). Неизвестный namespace бросает исключение (`ExpressionResolver.ts:44-45`). Тесты: `tests/runtime.test.ts:61`, `tests/runtime-infrastructure.test.ts:59`.

**[Ф]** `resolvePath` (`:28-35`) подставляет `$token` внутри строки пути как один URI-сегмент: допустимы string/number/boolean, пустое значение — ошибка. Используется в datasource (`rt/datasource/DataSourceManager.ts:154`), schema source (`rt/schema/SchemaFragmentManager.ts:78`) и tree DATA (`rt/data-tree/treeData.ts:64`), **но не в `api.request`** (раздел 6, K8).

**[Ф]** Unscoped legacy-проекция: без `scope` выражение `$state` указывает на `viewState`; deprecated `scopeId` (`ExpressionResolver.ts:9-19`, `rt/shared/types.ts:44-52`). Тест: `tests/scope-bindings.test.ts:70`.

**[Ф]** `BindingEngine` (`rt/binding/BindingEngine.ts:11-46`): `value ?? binding.default`, поэтому `null` тоже заменяется default (`:39`). Default — литерал со стабильной ссылкой. Visibility — `Boolean(resolve(...))` (`:43-44`). Селектор возвращает предыдущий объект, если все значения `Object.is`-равны (`:20-24`). Тесты: `tests/scope-bindings.test.ts:120-161`, `tests/react.test.tsx:30`.

**[Ф]** Валидатор допускает `$event`/`$response` в bindings, visibility, `enabled` и `key` (`rt/shared/validation.ts:41-64,271,277,255`), но при рендере они всегда `undefined`: `BindingEngine` передаёт только `{state, scope}` (`BindingEngine.ts:34`). Probe P5e. Задокументировано в `docs/production/expressions-actions.md:16`.

**[Ф]** Ограничения языка: нет операторов, сравнений, отрицания, интерполяции и escape для литерала `"$..."` в action/request-контекстах. Задокументировано: `docs/production/expressions-actions.md:22-28`.

---

## 6. ActionEngine, ActionRegistry и generic handlers

**[Ф]** `ActionEngine.execute` (`rt/actions/ActionEngine.ts:41-63`):

1. `executionScope`: чужой scope → `Cross-scope action execution is not supported` (`:15-19`).
2. Неактивный scope → **тихий return** без ошибки (`:47`).
3. Корневой вызов копирует контекст `{scope,event,response}`. Вложенный вызов использует общий контекст цепочки (`:50-52`).
4. Цикл в stack → ошибка (`:53-54`).
5. Только own-key `scope.actionDefinitions` (`:55-56`) — без parent/prototype lookup.
6. Handler из shared registry (`:62`). Незарегистрированный тип → `Unregistered action type` (`rt/actions/ActionRegistry.ts:25-29`).

| Handler | Поведение (факты) | Ошибки | Тесты |
| --- | --- | --- | --- |
| `state.set` | `assertLocalStateTarget` → `resolve(value)` → `runtimeActions.set` (`rt/actions/handlers/stateSet.ts:13-22`); `setPath` заменяет scalar/array-предков объектами (`rt/binding/paths.ts:24-29`, probe P3) | Target с `$` или небезопасный путь → throw | `tests/scoped-actions.test.ts:115,133` |
| `state.patch` | Shallow merge корня или target (`rt/redux/patchState.ts:4-15`). **Массив в target распыляется в объект с индекс-ключами** (probe P2) | Как у `state.set` | `tests/runtime.test.ts:87`, `tests/scoped-actions.test.ts:125` |
| `api.request` | `resolve(request)` **без `resolvePath`** (`rt/actions/handlers/apiRequest.ts:16-19`) → `transport(request, scope.signal)` (`:27`). При ошибке: если scope неактивен → return; если есть `onError` → `$response={error}` и вызов `onError`; иначе rethrow (`:28-37`). Успех → запись в target (если указан) → `onSuccess` (`:38-48`) | Ошибка в `onSuccess` не вызывает `onError` | `tests/runtime.test.ts:101,112`, `tests/scoped-actions.test.ts:164-221`, `tests/runtime-infrastructure.test.ts:297` |
| `datasource.reload` | `context.scope.dataSources.reload(source)` (`rt/actions/handlers/datasource.ts:2-5`) | Unknown source → throw (`rt/datasource/DataSourceManager.ts:121-126`) | `tests/scoped-actions.test.ts:226` |
| `datasource.invalidate` | Отмена запроса и таймера, idle/null (`DataSourceManager.ts:177-185`) | То же | `tests/runtime.test.ts:165` |
| `navigate` | `resolve(to)` должен дать string → `services.navigate` (`rt/actions/handlers/navigate.ts:8-12`) | Не string → throw. Allowlist нет | `tests/scoped-actions.test.ts:236` |
| `notification.show` | `String(resolve(message) ?? "")`, tone по умолчанию `info` (`rt/actions/handlers/notification.ts:5-7`) | — | `tests/scoped-actions.test.ts:236` |
| `sequence` | Последовательный `await` (`rt/actions/handlers/sequence.ts:8-9`). Без rollback; ошибка прерывает цепочку | Цикл → throw (validation и runtime) | `tests/runtime.test.ts:93,120`, `tests/scoped-actions.test.ts:104` |

**[Ф]** Concurrency `api.request`: нет per-action generation/AbortController. Два параллельных вызова одного action оба пишут `target`, побеждает последний завершившийся (`apiRequest.ts:38-46`). Тест `tests/scoped-actions.test.ts:185` проверяет только изоляцию `$response`, не порядок записей.

**[Р]** Ввести policy конкурентности команд (`takeLatest`/`queue`/`exclusive`) и сделать request templating единым (`resolvePath` или единая `{param}`-модель) для всех трёх путей.

---

## 7. Redux store, slices, selectors, listener

**[Ф]** Форма состояния (`rt/shared/types.ts:33-43`): `appState, appData, viewState, viewData, fragments{scopeId:{state,data}}, schemaFragments, applicationInstance, viewInstance`.

**[Ф]** Корневой reducer (`rt/redux/createRuntimeStore.ts:31-45`):

- Адаптирует `disposeView` → `disposeScope`.
- `initialize` с небезопасным id → throw; повторный `initialize` активного адреса — no-op.
- Действия для неактивного адреса игнорируются.

**[Ф]** Слайсы (`appStateSlice.ts:6-23`, `appDataSlice.ts:4-17`, `viewStateSlice.ts`, `viewDataSlice.ts`, `fragmentsSlice.ts:7-31`, `schemaFragmentSlice.ts:4-11`) — только `extraReducers` на общих `runtimeActions` (`rt/redux/runtimeActions.ts:15-32`).

**[Ф]** `configureStore` с default middleware (`createRuntimeStore.ts:48`): в dev включены serializable/immutable checks. Probe P9: функция и `Date` из `$event` записываются в `appState`, RTK пишет в `console.error` "A non-serializable value was detected". В production проверок нет — значение сохраняется молча.

**[Ф]** Listener: predicate `current !== previous`; diff `getChangedPaths` по app/view/fragments (без `schemaFragments`); observer вызывается один раз на dispatch (`rt/redux/listenerMiddleware.ts:13-21`, `rt/redux/changedPaths.ts:8-47`). Тесты: `tests/runtime-infrastructure.test.ts:112,127`, `tests/scoped-datasources.test.ts:173,182`.

**[Ф]** Публичных memoized selectors (reselect) в runtime нет. Селекторы создаются на узел через `BindingEngine.createSelector` и inline в `SchemaOutlet`/`DataTreeRuntime`/`RuntimeScopeHost`.

**[П]** `schemaFragments` хранит полные JSON-определения в Redux. Это увеличивает работу dev-проверок сериализуемости. Не измерялось.

---

## 8. DataSourceManager и DependencyGraph

**[Ф]** Стартовые стратегии (`rt/datasource/DataSourceManager.ts:41-48`):

- app: `onAppInit` и `onScopeInit`;
- view: `onViewInit` и `onScopeInit`;
- fragment: `onScopeInit` (wire-alias `onInit` нормализуется в `rt/fragment/normalizeFragmentDefinition.ts:62-64`).

`manual` при старте не загружается. Валидация стратегий по scope — `rt/shared/validation.ts:127-132`; тест `tests/runtime.test.ts:234`.

**[Ф]** `dependenciesChanged` (`:49-78`):

- работает только после `start` и при активном scope;
- реальное изменение проверяется `Object.is` старого и нового resolved-значения;
- нужен `reload: 'onDependencyChange'`;
- текущий запрос и таймер отменяются, затем trailing debounce `debounceMs ?? 0`.

Тесты: `tests/runtime-infrastructure.test.ts:148-226`, `tests/scoped-datasources.test.ts:117-230`.

**[Ф]** `load` (`:142-175`):

- previous data сохраняется в `loading`/`error`;
- stale-guard по `controller` identity, `signal.aborted` и `active`;
- ошибка разрешения пути превращается в `status: 'error'` без HTTP.

Тесты: `tests/runtime.test.ts:147,157`, `tests/scoped-datasources.test.ts:197,258`.

**[Ф]** `fetchTransport` (`rt/datasource/api.ts:14-38`):

- база — `window.location.origin`;
- query без `null/undefined/""`, остальное через `String()`, поэтому объект становится `[object Object]`;
- body — `JSON.stringify` с Content-Type JSON;
- не-2xx → `body.message` или `Request failed (status)`;
- 2xx всегда `response.json()`, поэтому 204 → ошибка;
- headers/auth/timeout отсутствуют.

**[Ф]** `{param}`-подстановка выполняется **в transport** (`rt/datasource/api.ts:7-13`): только string/number, boolean отвергается. `$expr`-подстановка в `resolvePath` boolean допускает. Custom transport должен реализовать `{param}` сам. Тест: `tests/reporting-api.test.ts:64,68`.

**[Ф]** `DependencyGraph` (`rt/datasource/DependencyGraph.ts:12-88`):

- одна копия на environment (`rt/shared/RuntimeEnvironment.ts:17`);
- регистрация атомарна с проверкой циклов data→data (`:40-69`);
- handles не удаляют более новые регистрации (`:66-68`);
- `affected` — линейный перебор всех регистраций (`:83-85`).

Тесты: `tests/scoped-datasources.test.ts:47-91`.

**[Ф]** `dependsOn: ["$data"]` отвергается как self-cycle (probe P7). Это не задокументировано в `docs/production/data-navigation.md`.

**[Ф]** Inline DATA leases (`DataSourceManager.ts:80-106`) пишут entries с id `inline:%7B...` в тот же `$data` scope (probe P8): namespace `$data` смешивает declared и inline-ресурсы.

**[П]** `affected()` — O(регистрации × пути × изменения) на каждый dispatch с изменениями. Для сотен datasources это может стать заметным. Не измерялось.

---

## 9. Routing и route-outlet

**[Ф]** `RouteOutlet` (`rt/routing/RouteOutlet.tsx:26-47`): `<Routes>` из `routes[]`; `*` → `<Navigate replace to={routes[0].path}/>`; пустой `routes` → `null`. `RoutedView` использует key `${pathname}:${viewId}:${revision}` (`:19`), поэтому любая смена pathname пересоздаёт View.

**[Ф]** `ViewSchemaLoader.load` — синхронный own-key lookup по in-memory map (`rt/routing/ViewSchemaLoader.ts:4-8`). Remote view loading нет.

**[Ф]** Валидация маршрутов (`rt/shared/validation.ts:299-304`): проверяются дубли `path` и `views[route.viewId]` — **обычным property lookup**. Probe P4: `viewId: "toString"` проходит (наследуемое свойство). Probe P4b: `path: 42` проходит. В runtime `ViewSchemaLoader` использует `hasOwn` и бросает исключение уже при рендере.

**[Ф]** В runtime нет namespace для route params/query, нет guards, nested routes и навигационных событий (grep `useParams`, `$route` пуст). Задокументировано: `docs/production/schema-reference.md:98`.

---

## 10. SchemaFragmentManager, SchemaOutlet, outlet lifecycle

**[Ф]** `prepare` (`rt/schema/SchemaFragmentManager.ts:64-89`):

- named source ищется plain-доступом `schemaSources?.[source]`, но validator требует own-key (`rt/shared/validation.ts:245`);
- cache owner: `none`/`scope` → declaring scope; `view` → ближайшая View (иначе throw); `application` → app;
- resource id = `JSON.stringify([owner, definition.id, sourceName, definition, key, request ?? error])` — не каноничен к порядку ключей (так задокументировано: `docs/production/scopes-fragments.md:52`).

**[Ф]** `acquire` (`:91-152`):

- `requests` (controller, promise, consumers) отделены от `entries` (JSON);
- cache hit тоже валидируется текущим validator (`:124`);
- JSON клонируется (`:126`);
- release в microtask: при `loading` или `none` вызывается `remove` с abort, иначе удаляется только запись coordination (`:141-149`).

Тесты: `tests/schema-fragments.test.ts:27-122`, `tests/schema-fragment-lifecycle.test.ts:28-93`.

**[Ф]** `SchemaOutlet` (`rt/schema/SchemaOutlet.tsx:28-81`):

- `enabled`/`key`/`prepared` вычисляются селектором в parent scope (`:35-44`); нескалярный key → `null`;
- `activationId = [parentScopeId, useId(), resourceId, retry]` (`:51`);
- retention при `scopeLifetime: 'outlet'` (`:53-63`);
- acquire/reload в effect (`:64-70`);
- render: success → `FragmentRenderBoundary` + `LoadedFragment`; error → **стандартный `ErrorUI` + опциональный `definition.error`** (оба); loading → `definition.loading` или registry `spinner`.

**[Ф]** Рекурсия и глубина: `ancestry.includes(requestIdentity) || length>=32` → throw внутри boundary (`:22`); лимиты JSON 1 MiB, дерево 1000 узлов / глубина 64 (`rt/fragment/normalizeFragmentDefinition.ts:10-17`). Тест: `tests/fragment-runtime-react.test.tsx:157`.

**[Ф]** `definitionCache: 'view'` внутри FragmentDefinition проходит валидацию (`validateScope(scope,'fragment')` не знает о предках). Для app-owned fragment `prepare` бросает `Schema source has no owning view for view cache` (probe P6). **[П]** В React исключение возникает в селекторе вложенного `SchemaOutlet`. Его поймает `FragmentRenderBoundary` родительского outlet, и весь fragment покажет "Unable to render loaded content". React-тестом это не покрыто.

**[Ф]** Lifecycle-матрица (activation/outlet × none/scope/view/application), StrictMode, смена key/source/request, отмена pending, retry, legacy-режим — `tests/schema-outlet-lifecycle.test.tsx:45-146`.

**[Ф]** Runtime зависит от registry-типов `error-message` и `spinner` и англоязычных строк (`SchemaOutlet.tsx:73-80`). Без этих регистраций outlet бросит `Unknown component type`.

---

## 11. Dynamic navigation DATA

**[Ф]** `data-tree` — инфраструктурный адаптер (`rt/data-tree/DataTreeRuntime.tsx:9-33`), зарегистрирован в `src/components/registry.ts:42`.

- Валидирует items (`readTreeNodes`: лимиты 1000 узлов и глубина 32; `rt/data-tree/treeData.ts:8-31`).
- Проецирует дерево селектором (`projectDataTree`, `:51-76`).
- Берёт inline leases для раскрытых узлов (`DataTreeRuntime.tsx:22-26`).
- Генерирует `onRetryChildren` (`:29-32`).
- Передаёт props target-компоненту (`props.component`, не `data-tree`; `rt/shared/validation.ts:238-241`).

**[Ф]** Guardian-shorthand: `childLinksSourceUrl` получает префикс `/api/`; absolute и protocol-relative URL отвергаются (`treeData.ts:60-62`). Явный `childrenSource` имеет приоритет. `itemsPath` по умолчанию `items` (для массива — `''`). Merge: static, затем remote, dedup по id, `childrenOrders` (`:33-44`). Тесты: `tests/tree-data.test.ts:22-83`, `tests/tree-navigation-react.test.tsx:40-100`.

**[П]** Селектор `DataTreeRuntime` на каждый dispatch пересчитывает проекцию и `JSON.stringify` всей проекции как signature (`treeData.ts:74-75`). При большой навигации это может быть затратно. Не измерялось.

---

## 12. Fluent UI adapters и бизнес-компоненты

**[Ф]** Runtime не импортирует `@fluentui/*` (AST-правило `scripts/architecture-audit.mjs:19`). Fluent используется только в `src/components/**` и playground.

**[Ф]** Публичные callbacks передают plain payload `{value}` и не передают DOM event. Пример — `src/components/primitive/TextInput.tsx:5`. Полная таблица — в [inventory](target-contract-inventory.json) (`registryComponents`).

**[Ф]** Найденные отклонения в бизнес-слое:

- inline `style={{...}}` — `src/components/layout/Row.tsx:4`, `Stack.tsx:4`, `SplitLayout.tsx:4`, `src/components/application/PrimaryNavigation.tsx:25`;
- демо/бренд-строки в presenter: `"GUARDIAN WORKSPACE"`, `"Connected demo workspace"` (`PrimaryNavigation.tsx:41,44`);
- англоязычные тексты без i18n во всех адаптерах;
- registry-типы `navigation-group`, `navigation-group-content`, `navigation-item` зарегистрированы (`src/components/registry.ts:44`), но не используются ни одной схемой (grep по `src/schemas`, `backend/data`, `docs/examples`). Это остаток до Task 8.

**[Ф]** Required props при отсутствии binding не проверяются. Адаптеры с `items.map`/`options.find`/`breadcrumbs.map` упадут при `undefined`: `GenericList`, `GenericNavigation`, `Tabs`, `Select`, `ApplicationHeader`, `ReportList`, `UserList`, `PrimaryNavigation`. Отдельного теста на это нет. Задокументировано как обязанность host: `docs/production/production-operations.md:27-29`.

---

## 13. Результаты поведенческих probes

Скрипт и полный вывод: [00-context.md](00-context.md). Probes импортировали runtime-модули напрямую. `git status` после запуска чистый.

| Probe | Сценарий | Наблюдение | Вывод |
| --- | --- | --- | --- |
| P1 | `api.request` с `path: "/api/x/$state.id"` | Валидация OK; transport получил `"/api/x/$state.id"` | K8 подтверждён |
| P2 | `state.patch` target → массив `[1,2]` | `{"0":1,"1":2,"extra":true}` | Doc `expressions-actions.md` ("не object → пустая основа") неточен для массивов |
| P3 | `setPath('items.0.name')` при `items` — массив | Массив заменён объектом `{"0":{...}}` | Нет записи по индексу; задокументировано для `setPath` |
| P4/P4b | route `viewId: "toString"` / `path: 42` | Оба проходят validation | Gap валидатора |
| P5/P5b/P5c/P5d | Лишние поля (`format`, `when`, `headers`, `pollMs`, `visibilty`, `lable`, `onClik`) | Всё принято | K6/K7 |
| P5e | binding `$event.value` | Принято | Всегда `undefined` при рендере |
| P6 | Fragment с `definitionCache: 'view'` под app | Валидация OK; `prepare` throw | Позднее обнаружение ошибки |
| P7 | `dependsOn: ["$data"]` | `Circular datasource dependency` | Недокументированное ограничение |
| P8 | Inline lease в app | `appData` содержит ключ `inline:%7B...` | Смешение namespace |
| P9 | `state.set` значения `$event` с `Date` и функцией | Сохранено (`typeof fn === 'function'`), RTK dev-warning ×2 | Нет JSON-guard на запись |
| P10 | Две ViewRuntime подряд | Первая `active=false`, `viewState` — второй | K2 |
| P11 | `set` для несуществующего fragment-instance | State reference не изменился | Stale-guard работает |

---

## 14. Специальные проверки (по заданию)

| Требование | Результат | Доказательство |
| --- | --- | --- |
| Один store на application environment | **Выполнено** [Ф] | K1. Playground намеренно держит два независимых environment (`src/playground/Playground.tsx:20`, `src/playground/application-tab/FullApplicationTab.tsx:26`) |
| Scope-aware namespaces/actions/dataSources/dependencies | **Выполнено** [Ф] | Разделы 3, 5, 6, 8; `tests/scope-bindings.test.ts`, `tests/scoped-actions.test.ts`, `tests/scoped-datasources.test.ts` |
| Нет implicit parent action lookup | **Выполнено** [Ф] | `rt/actions/ActionEngine.ts:55-56`; `tests/scoped-actions.test.ts:80,197`. Оговорка: legacy bare trees исполняют actions **host-scope** по дизайну |
| React rendering независим от DependencyGraph | **Выполнено** [Ф] | K4 |
| Definition cache отделён от runtime lifetime | **Выполнено** [Ф] | K5; `tests/schema-outlet-lifecycle.test.tsx:109,115` |
| Cancellation | **Выполнено** для datasource/schema/inline [Ф]; **частично** для `api.request` (только scope-dispose) | Разделы 6, 8, 10 |
| Stale results | **Выполнено** для datasource/schema/inline/Redux-адресов [Ф]; **нет** ordering-guard для `api.request` | K12 |
| Cleanup | **Выполнено** рекурсивно [Ф] | `rt/shared/RuntimeScope.ts:99-109`; `tests/runtime-scope.test.ts:167-202`, `tests/schema-fragment-lifecycle.test.ts:76` |
| StrictMode | **Выполнено** для View/Fragment/inline DATA [Ф]; **не в runtime** для Application | K11; `tests/fragment-runtime-react.test.tsx:123`, `tests/tree-navigation-react.test.tsx:81`, `tests/react.test.tsx:108` |
| Нет бизнес-условий в runtime | **Report/user-условий нет** [Ф]. Есть deployment/контрактные константы (`/api/`, `childLinksSourceUrl`, `error-message`/`spinner`) | K9. AST-audit — blocklist конкретных демо-имён (`scripts/architecture-audit.mjs:43-45`), а не доказательство отсутствия всех доменных условий |
| Изоляция бизнес-компонентов от Redux/API/runtime | **Выполнено** [Ф] | K10 |

---

## 15. Расхождения: документация / TypeScript / validation / runtime

| # | Где | Документация | TypeScript | Validation | Runtime | Уровень |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | `api.request.request.path` с `$expr` | Предупреждение: использовать `{param}` (`docs/production/expressions-actions.md:88`) | `string` | Принимает `$` токены (`rt/shared/validation.ts:70`) | Не подставляет (`rt/actions/handlers/apiRequest.ts:16-19`) | Ф |
| D2 | Неизвестные поля | "Нет blanket additionalProperties=false" (`docs/production/schema-reference.md:120`) | Закрытые interfaces | Принимает | Игнорирует | Ф |
| D3 | `state.patch` на массив | "Если target… не object, основа merge пустая" (`docs/production/expressions-actions.md:72`) | `value: JsonObject` | — | Массив распыляется в объект | Ф (probe P2) |
| D4 | `ComponentDefinition.key` | Scalar | `JsonValue` (`rt/rendering/types.ts:16`) / `FragmentKey \| Expression` (`rt/schema/types.ts:40`) | Только scalar (`validation.ts:254`) | Нескалярный → `null` (`SchemaOutlet.tsx:39`) | Ф (задокументировано) |
| D5 | Outlet-поля на любом узле | Только для schema-outlet | Есть у любого `ComponentDefinition` (`rt/rendering/types.ts:13-18`) | Проверяются только при `type==='schema-outlet'` | Игнорируются остальными | Ф |
| D6 | `SchemaRequestDefinition.params` | "params не входят в schema-source wire" (`docs/production/schema-reference.md:116`) | Нет поля (`rt/schema/types.ts:9`) | Принимает (`validation.ts:74,84`) | Работает через `fetchTransport` (`rt/datasource/api.ts:7-13`) | Ф |
| D7 | `$event`/`$response` в bindings | "не дают событие" (`docs/production/expressions-actions.md:16`) | `Expression` включает их | Принимает | Всегда `undefined` | Ф |
| D8 | `definitionCache:'view'` в fragment под app | "требует owner view" (`docs/production/schema-reference.md:116`) | Допустимо | Принимает | Throw в `prepare` | Ф (probe P6) |
| D9 | `route.viewId`/`route.path` | "Host должен проверить типы route/path" (`docs/production/schema-reference.md:98`) | `string` | `views[...]` без hasOwn; path без проверки типа | `hasOwn` при рендере | Ф (probe P4) |
| D10 | Историческая миграционная документация | `docs/runtime-scope-migration.md:43-45` ссылается на удалённый `backend/data/ui/forest-recovery.json` и `/api/ui/navigation/forest-recovery`; `:469` ставит `$inputs` в deliverable фазы 4 | — | — | `$inputs` не реализован | Ф (помечено как historical baseline, `docs/runtime-scope-migration.md:7`) |
| D11 | `ApplicationHost.definition` vs `ApplicationRuntime.definition` | "Должны оставаться согласованными" (`docs/production/runtime-layers.md:134`) | Отдельные параметры | Нет проверки | Playground передаёт разные объекты (routes с другим viewId): host получает `demoApplicationDefinition(catalog)` (`src/playground/application-tab/FullApplicationTab.tsx:61,78`), runtime — `reportingApplicationDefinition` (`:63`) | Ф (tooling, не runtime) |
| D12 | `dependsOn:["$data"]` | Не упомянуто | `StateExpression` допускает | Self-cycle error | — | Ф (probe P7) |

Документация в целом точна и честно перечисляет ограничения (`docs/production/production-operations.md:93`). Большинство расхождений — разрыв «задокументировано, но validator не enforce», а не ложные утверждения.

---

## 16. Backend, playground tooling и inspector (отдельно от runtime)

**[Ф] Backend** (`backend/app.ts:1-18`): Express 5, демо-данные, без auth.

- Маршруты: `/api/ui/object-details/:id` (legacy bare trees: `backend/routes/schema.ts:142-147`), `/api/ui/fragments/items-panel/:contextId` и `/item-note/:itemId` (envelopes: `backend/routes/fragments.ts:33-49`), `/api/app/navigation` + `/api/v0/*` (DATA: `backend/routes/navigation.ts:73-78`), reports/users/items/demo.
- Backend импортирует frontend-контракты (`backend/routes/reporting.ts:82`, `backend/data/navigation.ts:1`), обратного импорта нет (AST-правило `scripts/architecture-audit.mjs:27`).
- Контекст во фрагмент передаётся **литералом, вклеенным backend-ом** (`backend/routes/fragments.ts:39`) — обход отсутствующего `$inputs`.

**[Ф] Playground**: `src/playground/**` создаёт environment и ApplicationRuntime в `useLayoutEffect` (`src/playground/Playground.tsx:23-27`), исполняет app-action извне (`FullApplicationTab.tsx:68-71`), даёт редактор схем (`src/playground/schema-tab/SchemaPlaygroundTab.tsx`) с debounce 300 ms и `parseViewDefinition` (`rt/shared/parseViewDefinition.ts:18-24`).

**[Ф] Inspector**: read-only проекции (`src/playground/application-tab/inspectorModel.ts:56-132`), читают `environment.listScopes()` и `dependencyGraph.registrations()`. `Diagnostics` хранит 100 записей в памяти (`rt/shared/Diagnostics.ts:40`); исключения observer изолированы (`:19-23`). Тесты: `tests/scope-inspector.test.ts`, `tests/runtime-inspector.test.ts`. Runtime не импортирует playground (AST-правило `scripts/architecture-audit.mjs:34`).

**[Ф] Проверочные скрипты**: `architecture-audit.mjs` — AST/regex blocklist; `verify-documentation.mjs` сверяет сгенерированные справочники с TS AST и registry и валидирует 6 примеров. Смысловых утверждений docs он не проверяет (признано в `docs/production/verification.md:17`).

---

## 17. Тестовое покрытие: сильные стороны и пробелы

**Сильные стороны [Ф]:** scope isolation, cancellation и stale-guard с transport, игнорирующим abort; StrictMode; lifecycle-матрица cache×lifetime; real HTTP через Express; render counts.

**Пробелы [Ф]** (тестов не найдено по списку `describe/it`):

1. Out-of-order завершение параллельных `api.request` одного action (K12).
2. Отсутствующие required props у адаптеров и поведение при неверной форме API-ответа.
3. Строгость валидации: лишние поля и опечатки (тестов на отказ нет, потому что отказа нет).
4. `definitionCache:'view'` в app-owned fragment (D8) в React.
5. Маршруты с параметрами, deep link, back/forward кроме базового `tests/react.test.tsx:51`.
6. `navigation-group*` (не используются), `warning-banner`/`tabs` — только через HTTP JSON (`tests/schema-api.test.ts:21`) без render-assert на их props.
7. Производительность и долгие сессии: рост inline DATA и definition cache без TTL/LRU.
8. Browser E2E: runner отсутствует.

---

## 18. Рекомендации для этапа миграции [Р]

1. **Strict schema mode**: JSON Schema/zod-контракты на все wire-объекты с `additionalProperties:false` и описанием registry-компонентов (props, required, callbacks, payload types). Validator сверяет bindings/handlers с контрактом.
2. **Multi-view store**: заменить `viewState/viewData/viewInstance` на `views[scopeId]` (по аналогии с `fragments`) до переноса экранов, где одновременно живут несколько View.
3. **Routing contract**: `$route.params/query` (read-only namespace), guards через host-policy, lazy/remote `ViewSchemaLoader`.
4. **Единый request templating** для action/datasource/schema/tree; transport-конфиг (baseURL, headers/auth injection, timeout, 204/empty body); убрать `/api/`-ограничение из validator в host-policy.
5. **Command concurrency policy** для `api.request` (generation guard, `takeLatest` по умолчанию для target-записей).
6. **Fragment inputs** (`$inputs`), как в целевом контракте `docs/runtime-scope-migration.md:114`.
7. **Expression extensions** с отдельным контрактом (сравнение, отрицание, литерал-escape) — без eval.
8. **ApplicationRuntimeHost** в runtime; i18n-слой для инфраструктурных текстов; параметризуемые fallback-типы (`spinner`/`error-message`).
9. **Отделить Guardian-shorthand** (`childLinksSourceUrl`) в адаптер данных host-а.
10. **JSON-guard на запись** в state/data (или документированная политика) и опциональная валидация формы API-ответа.
11. Удалить или пометить неиспользуемые registry-типы; убрать inline styles, если целевой UI-слой (forge) это запрещает.
12. Добавить browser E2E и performance-бюджеты (селекторы `SchemaOutlet`/`DataTreeRuntime`, `DependencyGraph.affected`).

---

## 19. Неизвестное и вне объёма

- Реальная нагрузочная производительность: не измерялась [П].
- Поведение в браузере: в этом аудите вручную не проверялось. Опираемся на jsdom/HTTP-тесты и исторический walkthrough из `docs/runtime-final-audit.md` (не воспроизводился).
- Сравнение с `cayo.uischema.core`/ServiceManager: следующий этап. Соответствие имени "cayo.ui.schemacore" → `cayo.uischema.core` не подтверждено.
- Безопасность (authz, CSP, XSS через props): не аудировалась, кроме проверки safe-path и отсутствия eval.
