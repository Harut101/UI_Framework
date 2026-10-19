# DATA: запросы, зависимости и navigation

[Оглавление](README.md) · [actions](expressions-actions.md) · [scope lifecycle](scopes-fragments.md)

## DataSourceDefinition: каждое поле

| Поле | Тип / required / default | Семантика |
| --- | --- | --- |
| type | "api", обязательно | Единственный встроенный generic datasource type. |
| request | RequestDefinition, обязательно | HTTP request в owning RuntimeScope. |
| dependsOn | StateExpression[], optional [] | Явные зависимости; выражение в request само по себе edge не регистрирует. |
| load | object, обязательно | Стартовая/автоматическая policy. |
| load.strategy | literal, обязательно | App: onAppInit/onScopeInit/manual; View: onViewInit/onScopeInit/manual; Fragment: onInit/onScopeInit/manual. |
| load.reload | onDependencyChange/manual, optional manual behavior | Только onDependencyChange запускает автоматическое обновление. |
| load.debounceMs | number, optional 0 | Trailing debounce dependency changes, finite 0..2147483647 мс. |

onInit — alias только wire FragmentDefinition, нормализуется onScopeInit. manual initial strategy может сочетаться с reload:onDependencyChange: нет стартового запроса, последующие зависимости обновляют источник после start scope.

load/reload выполняются сразу, отменяют debounce/прежний запрос. invalidate возвращает idle без HTTP. Полей polling/retryCount/TTL/optimistic/responseMapping нет.

~~~json
{
  "items": {
    "type": "api",
    "request": {
      "method": "GET",
      "path": "/api/items",
      "query": { "search": "$state.query" }
    },
    "dependsOn": ["$state.query"],
    "load": {
      "strategy": "onViewInit",
      "reload": "onDependencyChange",
      "debounceMs": 180
    }
  }
}
~~~

## RequestDefinition и transport

| Поле | Тип / требование | Поведение |
| --- | --- | --- |
| method | GET/POST/PUT/DELETE, обязательно | PATCH отсутствует в union/validator. |
| path | string, обязательно | Валидатор требует /api/ prefix. |
| params | JsonObject, optional | Подстановка {id} из params.id через encodeURIComponent; nonempty string/number. |
| query | JsonObject, optional | Resolver в scope. null/undefined/"" пропускаются, остальные значения String, включая false/0. |
| body | JsonValue, optional | Resolver, затем JSON.stringify; при наличии Content-Type:application/json. |

SchemaRequestDefinition/ChildrenSourceDefinition.request уже: method?:GET/POST default GET; path/query/body без params. Более широкое принятие generic runtime validator не обещает undocumented wire-поля.

Datasource/SchemaFragmentManager/tree DATA дополнительно вызывают resolvePath для $tokens внутри path. Каждое значение string/number/boolean кодируется одним сегментом; missing/empty/object → ошибка без HTTP. api.request action этого шага не делает: используйте {id}+params.

fetchTransport использует window.location.origin, AbortSignal и JSON. headers/credentials/auth/timeoutMs/baseURL/retry не входят в wire request; другой transport внедряется ApiTransport(request,signal):Promise<unknown>. Не-2xx: JSON message либо Error("Request failed (status)"). Success всегда response.json(); 204/не-JSON вызовет ошибку. Content-Type ответа не проверяется отдельно.

Префикс /api/ не является security allowlist/canonicalization. Host должен нормализовать URL, ограничить origin/path/method/redirects и авторизовать операции. Сетевые byte/time/concurrency limits отдельные.

## DataEntry: $data.<sourceId>

| Поле | Тип | Начальное значение | Назначение |
| --- | --- | --- | --- |
| status | idle/loading/success/error | idle | Lifecycle. |
| loading | boolean | false | Текущая загрузка. |
| data | unknown | null | Decoded response последнего success. |
| error | string/null | null | Последняя обычная ошибка. |

Loading/error сохраняют previous data; success заменяет data/очищает error; invalidate ставит null. Cancellation не status: superseding → новая loading, invalidate → idle, dispose → удаление entry; last pending inline release → idle. Не стройте UI на вымышленном status=cancelled.

$data.items.data.items означает datasource items → response → поле items. API data shape автоматически не валидируется; используйте проверенный контракт и безопасный default [].

## DependencyGraph и listener

Resource identity: {scopeId,sourceId}. Registration: target + paths:[{scopeId,area:state/data,path:string[]}]. Локальные $state/$data адресуют owner; $viewState/$viewData — owning View; app namespaces — application. Alias paths могут совпасть.

getChangedPaths сравнивает Redux snapshots: объекты рекурсивно, массивы/scalars заменой своего пути. Init/dispose scope дают root addresses. Изменения schemaFragments не DATA namespace.

Listener → DependencyGraph.affected → группировка по scopeId → manager.dependenciesChanged. Matching требует одинаковые scopeId/area и prefix overlap. Замена filters затрагивает filters.module. Manager проверяет реальное Object.is значение зависимости before/after и reload policy. Несколько affected paths одного patch дают один reload target.

Регистрация/проверка cycles атомарны; stale unregister handle не удаляет новый edge. Graph не планирует transactional/topological await между API: upstream может сначала быть null/previous. Учитывайте это в API dependencies.

Новая relevant mutation сразу aborts текущий запрос, сбрасывает trailing timer. Запрос разрешает свежий snapshot при старте. signal + controller identity + scope.active отвергают stale success/error, даже если transport игнорирует abort.

## Navigation DATA: TreeDataNode

| Поле | Тип/default | Назначение |
| --- | --- | --- |
| id | nonempty string, обязательно | ID среди siblings, часть expansion key. |
| name | string, optional | Guardian display name; name либо label необходимы. |
| label | string, optional | Приоритет над name. |
| href | string, optional | Destination leaf; не authorization policy. |
| icon | string, optional | Семантическая иконка. |
| disabled | boolean, default false behavior | UI запрет взаимодействия. |
| links | TreeDataNode[], optional [] | Static children. |
| children | TreeDataNode[], optional [] | Дополнительные static children, объединяются с links. |
| childLinksSourceUrl | string, optional | Guardian shorthand remote DATA URL; v0/... получает /api/. Absolute/protocol-relative shorthand отвергается. |
| childrenSource | ChildrenSourceDefinition, optional | Явное node-local DATA loading, приоритет над shorthand URL. |
| childrenOrders | string[], optional [] | Ordered child ids после merge; остальные стабильно после них. |

ChildrenSourceDefinition.request: method?:GET/POST default GET, path:string, query?:JsonObject, body?:JsonValue. itemsPath?:string: по умолчанию items для объекта и пустой путь для bare array; "" явно выбирает весь response. Выражения читают owning data-tree scope. Новый RuntimeScope не создаётся.

Merge: static сначала, remote затем; dedup по id, первая позиция сохраняется, поздние metadata перекрывают ранние, nested links/children рекурсивно объединяются. childrenOrders сортирует указанные ids. Никаких branches по tenant/domain/recovery.

DataTreeRuntime props: component:string required, items default [], expandedIds default [], error optional; остальные props относятся к target adapter. component должен существовать и не быть data-tree. Runtime получает leases, проецирует DATA и генерирует onRetryChildren, передавая обычные props в registry target.

## Подготовленные TreeItem/ApplicationNavigationItem

id/label/href/icon/disabled — display/selection metadata; key — canonical expansion identity; children — TreeItem[]; expandable — наличие детей/source; childrenLoading — pending; childrenError — string/null. Root key=id; nested key=JSON.stringify(ancestor ids). expandedIds хранит key, selected callback.value остаётся item.id.

ApplicationNavigationItem дополнительно допускает depth (отступ), optional key/children/expandable/loading/error и fallback реализации PrimaryNavigation. Полные поля — [contracts appendix](contracts-api-reference.md).

## DATA leases, cache и ошибки

Inline DATA id — canonical sorted request JSON, percent-encoded без dotted-path разделителей. В scope одинаковые запросы разделяют DataEntry/загрузку. Last pending release отменяет и сбрасывает idle; success data живут до owning scope disposal. Error не retry автоматически при раскрытии: onRetryChildren вызывает reload.

Dynamic inline resources не создают фиктивных graph edges: expansion/request identity управляет selector/effect. Unknown navigation data — не повод использовать SchemaOutlet; он нужен для неизвестной структуры UI.

Tree validation ограничивает 1000 nodes/nesting 32. Сетевые limits отдельные; API response shapes требуют проверки host.
