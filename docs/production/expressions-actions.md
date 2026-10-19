# Expressions, bindings, visibility и все generic actions

[Оглавление](README.md) · [формат узла](schema-reference.md) · [runtime layers](runtime-layers.md)

## Scope-aware namespaces

| Namespace | Application scope | View scope | Fragment scope |
| --- | --- | --- | --- |
| $state | appState | viewState | fragments[currentScopeId].state |
| $data | appData | viewData | fragments[currentScopeId].data |
| $viewState / $viewData | undefined | owning View | owning View или undefined у app-owned fragment |
| $appState / $appData | owning Application | owning Application | owning Application |
| $event | Payload текущего действия, если передан | То же | То же |
| $response | Последний API response chain, если есть | То же | То же |

$event/$response — execution context, не постоянные поля Redux. BindingEngine рендера передаёт state/scope без event/response; эти namespaces там не дают событие последнего клика.

Resolver работает по переданному Redux snapshot, не читает скрыто mutable current state environment. Совместимый вызов без scope трактует $state/$data как View; deprecated scopeId доступен для старых fragment callers. Новые integrations всегда передают RuntimeScope.

## Синтаксис и безопасность чтения

- Полная строка, начинающаяся с $, — namespace path: $state.filters.query; $data.items.data.items. Собственные свойства объектов/массивов, array index как .0.
- Нет eval, JS, вызовов функций, арифметики, сравнения, !, &&, ternary, bracket syntax, optional chaining, string interpolation в обычных значениях.
- "Hello $state.name" остаётся строкой. "$state.enabled === true" не boolean expression. Для derived условий используйте явное state/данные или расширение generic resolver с отдельным контрактом.
- Plain JSON object/array в action/request рекурсивно разрешается; props, initialState/state templates и binding.default являются literal.
- Missing/null intermediate/не-own property → undefined; binding применяет default через nullish fallback. Неизвестный namespace или unsafe/пустой сегмент → ошибка.
- Строка "$128" в action value/request expression context будет ошибкой namespace. В props это допустимый literal. Escape/literal wrapper для expression value не реализован.
- Dot syntax не адресует ключ с буквальной точкой. Динамические object-key вычисления не поддержаны.

Visibility равна Boolean(resolve(expression)); "false" как строка данных truthy, []/{} тоже truthy. Для предсказуемости передавайте boolean. Default visibility=true. Действия/HTTP не запускаются самим вычислением visibility; размонтирование дочернего outlet при этом может завершить его scope.

BindingEngine.createSelector(bindings,scope,visibility) мемоизируется RuntimeNode; результат сравнивается Object.is по ключам и useSelector shallowEqual. В default []/{} используются references определения. Без meaningful изменения selected props обычный React node не должен обновляться из-за чужого state.

## Именованное действие и generic type

~~~json
{
  "actions": {
    "setQuery": {
      "type": "state.set",
      "target": "query",
      "value": "$event.value"
    }
  }
}
~~~

setQuery — локальное имя. state.set — generic type в ActionRegistry. Нельзя вызвать отсутствующее имя "state.set" как неявное действие. Нет parent lookup, sibling lookup или cross-scope write.

ComponentBinder создаёт callback, вызывающий execute(actionId,{event,scope}). Catch callback-ошибки пишет diagnostics и вызывает notify(error). Прямой программный вызов engine.execute возвращает Promise и может reject; integration обязан обработать его.

## Поля каждого ActionDefinition

### state.set

| Поле | Требование/default | Поведение |
| --- | --- | --- |
| type | "state.set", обязательно | Generic handler. |
| target | Непустой relative path, обязательно | query или filters.module. $state.query и другие namespace targets запрещены. |
| value | JsonValue, обязательно | Вычисляется в текущем state/event/response scope. |

Записывается только owning state. Промежуточные отсутствующие/scalar/array ancestors setPath заменяет объектами. Нет delete operation. Не сохраняйте undefined/не-JSON результаты API/event в persisted state без внешней валидации: runtime внутренние StateObject шире wire JSON.

### state.patch

| Поле | Требование/default | Поведение |
| --- | --- | --- |
| type | "state.patch", обязательно | Generic shallow merge. |
| target | Optional | Отсутствует → merge корня state; иначе merge по relative target. |
| value | JsonObject, обязательно | Значения рекурсивно разрешаются resolver. |

Merge **поверхностный**: {filters:{module:"x"}} заменяет весь filters объект при patch корня. Чтобы сохранить соседей filters, задайте target:"filters", value:{"module":"x"}. Если target отсутствует/не object, основа merge пустая. Это не deep merge и не транзакция.

### api.request

| Поле | Требование/default | Поведение |
| --- | --- | --- |
| type | "api.request", обязательно | Выполнить RequestDefinition через transport. |
| request | Обязательно | method/path/params/query/body, см. data reference. |
| target | Optional | Сохранить весь response в local state по relative path; это не $data entry. |
| onSuccess | Optional local actionId | Выполнить после success/write с теми же scope/event и новым $response. |
| onError | Optional local actionId | При transport error выполнить с $response={error:message}. |

Общий signal принадлежит scope; dispose aborts его и предотвращает позднюю state запись/continuation. API onSuccess failure не считается HTTP failure и не запускает onError.

Каждый корневой execute копирует caller context: конкурентные chains не перезаписывают response друг друга. Nested sequences/continuations разделяют context внутри одной chain. Обработанная onError позволяет sequence продолжиться; необработанная ошибка прерывает sequence. AbortSignal клиента не гарантирует отмену уже выполненной сервером операции.

**URL отличие:** handler api.request вызывает обычный resolver на request, но не resolvePath. Используйте path:"/api/reports/{id}/run", params:{"id":"$state.selectedId"}. Встроенная строка "/api/.../$state.id" здесь не подставится; datasource/schema-source выполняют специальную подстановку.

### datasource.reload / datasource.invalidate

| Поле | Требование | Поведение |
| --- | --- | --- |
| type | Один из двух литералов | Reload сразу загружает; invalidate сбрасывает. |
| source | Обязательное локальное имя | Должно существовать в dataSources этого scope; это имя, не expression/URL. |

reload отменяет предыдущую работу и debounce, запускает сейчас и возвращает Promise завершения load. Обычная API ошибка записывается в DataEntry и load resolve; для последующего logic проверяйте $data.<source>.error/status отдельным механизмом. invalidate отменяет запрос/таймер и устанавливает idle/loading:false/data:null/error:null, без автоматического reload. Data dependencies других ресурсов могут реагировать на изменение data.

### navigate

type:"navigate", to:string обязательны. to разрешается resolver и должен дать string. Handler вызывает host navigate(to). Runtime не вводит URL allowlist/authorization, не превращает произвольную ссылку в безопасную. Destination policy реализует host. Навигация, вызывающая view disposal, может остановить оставшиеся шаги chain.

### notification.show

type:"notification.show", message:string обязательны; tone?:info/success/error default info. message разрешается resolver и преобразуется String(value ?? ""). Нет скрытого toast-хранилища в бизнес-компонентах; notify внедряется host.

### sequence

type:"sequence", actions:string[] обязательны. Пустой массив допустим. Имена выполняются последовательно await в текущем scope/context, читая актуальный state на каждом шаге. JSON cycle validation и execute stack отвергают циклы. Нет rollback/atomicity: более ранние state/API effects сохраняются при поздней ошибке. Для серверных изменений используйте серверный transaction/idempotency контракт.

## Callback payload contract

| Callback | Payload |
| --- | --- |
| Button onClick, панели onClose, onRetry | undefined |
| TextInput/SearchInput/Select onChange | {value:string} |
| Switch/Checkbox onChange | {value:boolean} |
| GenericNavigation/GenericList/Tabs onSelect | {value:string id} |
| SearchInput onSearch | {value:string}, Enter |
| PrimaryNavigation onSelect | {value:item.id,href:item.href} |
| PrimaryNavigation onExpandedChange | {value:string[] canonical keys} |
| NavigationGroup onExpandedChange | {value:boolean} |
| UserList onSelect | {value:user.id,user:UserSummary} |
| ReportCard/ReportList onOpen, ReportDetails onRun | {value:report.id} |
| UserCard onSelect/onMessage | {value:user.id} |
| SuggestionCallout onAccept | {value:suggestion} |
| ApplicationHeader onToggleNavigation | {value:boolean} |

Полный актуальный callback type каждого компонента — [component reference](components-reference.md). Required callback должен быть связан handler. Нельзя рассчитывать на DOM event.target.value.

## Execution API и сервисы

ActionEngine.execute(id,context={},stack=[]) принимает optional context.scope (default owner), event, response. Передача другого scope запрещена даже при одинаковом definition id. Inactive scope не выполняет работу. ActionRegistry выбирает handler по definition.type. Handler получает definition, ScopedExecutionContext, engine, stack; named actions и generic types хранятся отдельно.

ActionServices: runtimeScope/scope/instance/store/resolver/dataSources/diagnostics/transport/navigate/notify/active/signal. Это runtime-only зависимости; в JSON/Redux/business props они не передаются. Точные поля и signatures — [contracts/API](contracts-api-reference.md).

Для нового action type обновляют union ActionDefinition, validator, createActionRegistry, handler и справочник. Новый тип не должен связываться с конкретным компонентом/предметным модулем.
