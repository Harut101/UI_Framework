# RuntimeScope, cache и рекурсивный lifecycle

[Оглавление](README.md) · [author поля](schema-reference.md) · [API](contracts-api-reference.md)

## Redux и ownership

~~~json
{
  "appState": {},
  "appData": {},
  "viewState": {},
  "viewData": {},
  "fragments": {
    "<scopeId>": { "state": {}, "data": {} }
  },
  "schemaFragments": {},
  "applicationInstance": null,
  "viewInstance": null
}
~~~

applicationInstance/viewInstance — внутренние scopeId guards, не author initialState. schemaFragments хранит status/schema acquisition; namespace $schema отсутствует. Live scopes/controllers/engines/timers/promises/validators/leases остаются вне Redux.

RuntimeScope: scopeId/type/parentScope/applicationScope/viewScope/definition, composed dataSources/actionEngine/schemaFragments, initialize/start/active/dispose/signal. Legacy scope=app соответствует type=application; instance — alias scopeId. [API appendix](contracts-api-reference.md) описывает каждое поле/член.

ApplicationRuntime/ViewRuntime — тонкие facades общего scope; FragmentRuntime нормализует envelope и композирует тот же scope. ScopeRuntime — export alias. Один environment имеет одно приложение и одну active View. Standalone View compatibility может получить bootstrap app и позже adopt реального корня в том же store; это не multi-app manager.

## Последовательность FragmentRuntime

1. Parent outlet разрешает enabled/key/source request.
2. SchemaFragmentManager получает lease и HTTP/cached JSON.
3. Ответ валидируется/нормализуется относительно своего envelope либо legacy host.
4. Общий RuntimeScopeHost в ownership-checked microtask создаёт FragmentRuntime.
5. Устанавливаются parent/app/view references, клонируется state.
6. Создаются idle DataEntry; регистрируются local resources/dependencies/scope.
7. Redux initialize публикует адрес. Scope-owned engine читает локальные actions из definition.
8. start запускает onInit/onScopeInit datasource.
9. Readiness gate разрешает RuntimeNode(root) с fragment context.

Обычные children наследуют scope. StrictMode bridge отменяет незавладевшую replay generation до создания fragment/request. Это не гарантия отсутствия всех root ApplicationRuntime dev replay requests: host application effect может начать и отменить свой replay, что видно в diagnostics.

## Разные identities

| Identity | Значение |
| --- | --- |
| ComponentDefinition.id | Узел одного дерева; author либо normalizer, React key. |
| SchemaOutlet.key | Пользовательский scalar/expression выбранного объекта. |
| Resource id | Cache owner + host definition.id + source/declaration + key + resolved request/error: HTTP dedup/JSON cache. |
| Activation identity | Parent scope + outlet mount token + resource + retry generation. |
| scopeId | Live definition.id:process counter; independent state/resources. |

Schema resource key — JSON.stringify tuple, без hashing/canonical property sort. Перестановка source keys может поменять identity при том же HTTP. Он может содержать query/body; не используйте его как бизнес-ID и редактируйте sensitive поля перед production logging. Canonical tree DATA identity имеет другую сортировку.

ScopeId не стабилен across reload/HMR/process. Совпадение definition.id/key не восстанавливает уничтоженный scope. Cached JSON не содержит live Redux state/handles/closures.

## Definition cache

| Policy | Owner | Удаление |
| --- | --- | --- |
| none | Declaring scope для identity | Без reuse следующего independent acquisition; active consumers могут dedup. Last release удаляет resource. |
| scope | Declaring scope | Dispose owner. |
| view | Owning View | Dispose owning View; без View policy недоступна. |
| application | Owning app | Dispose приложения. |

Cached entry: owner/cache/schema JSON. Transient request отдельно: controller/promise/consumers/entry/metadata. Redux SchemaFragmentEntry: source/key/scope/owner/requestingScopeId/cache/status/loading/schema/error/requestPath/requestIdentity. requester и cache owner могут различаться. Cache entry не доказывает наличие живого fragment scope.

## Scope lifetime: отдельная ось

activation default: enabled=false уничтожает scope. outlet: own scope/registrations/effects сохраняются при disable, пока outlet смонтирован. Hidden children размонтируются, значит nested outlets dispose. Legacy bare response от lifecycle не становится самостоятельным scope.

| Событие | activation | outlet | JSON cache |
| --- | --- | --- | --- |
| enabled=false | Dispose subtree | Own scope/effects живут, descendants unmount | Отдельная policy |
| enabled=true после disable | Новый scope | Тот же mounted owner | Cached JSON может использоваться; reconnect retained scope не новый acquisition |
| Реальный unmount | Dispose subtree | Dispose subtree | По cache owner policy |
| Source/key/resolved request change | Replace/dispose old | То же | Разные identities, старый JSON может остаться |
| Явный Retry/refresh | Replace generation | То же | Удаляется выбранный resource и приобретается заново |
| View disposal | Owned descendants dispose | То же | view cache очищается, app cache может остаться |
| Application disposal | Все descendants dispose | То же | Весь environment cache/requests очищается |

Definition eviction и scope ownership — разные concerns; internal SchemaFragmentCache.remove не публичный manager произвольных scopes. Состояния активного acquisition наблюдаются через lease/subscriptions; используйте outlet refresh/generation, не прямую мутацию maps.

Два outlets одного JSON имеют независимые scopeId/state/data/actions/dependencies. Release одного не aborts общий pending HTTP, пока есть второй consumer. Last pending release/owner disposal aborts; controller/resource generation/activity guards отвергают stale resurrection.

## Ошибки, nesting и legacy

Loading/error/Retry локальны SchemaOutlet. FragmentRenderBoundary изолирует subtree render/activation error и сбрасывается по resetToken. Для ошибок shell/родителя нужен host app boundary. DATA error меняет local DataEntry, не запускает schema Retry автоматически.

Nested outlet использует parent fragment context, explicit child envelope создаёт независимый scope. Local actions не наследуются.

Bare ComponentDefinition нормализуется scope:"host": пользуется host state/actions, не объявляет resources. Удаление legacy tree не сбрасывает tenantAlias/activeTab хоста. Переход на envelope меняет namespaces/lifetime и требует compatibility migration.

## Disposal и ограничения

initialize eager/idempotent, start idempotent. Dispose: mark disposed → abort signal → recursive children → datasource/schema cleanup → unregister → Redux dispose. Initialize после dispose — ошибка. Stale writes игнорируются guards.

Remote JSON≤1 MiB после получения/JSON parsing; JSON depth≤128; component nodes≤1000/depth≤64; nesting≤32; resolved request repetition в ancestry отвергается. Network limits задаёт host.

Retention не persistence/offline cache. Нет TTL/LRU, fragment inputs, pinned response format, restore scope state из definition cache или per-fragment Provider.
