# Загрузка ViewDefinition по URL навигации

[Оглавление](README.md) · [полная ApplicationDefinition](../examples/guardian.application.full.json)

## Контракт приложения

~~~json
{
  "viewSource": {
    "request": { "method": "GET", "path": "/api/ui/views" },
    "pathQueryParam": "path",
    "onLoaded": "rememberView"
  },
  "routes": [],
  "views": {}
}
~~~

Это фрагмент ApplicationDefinition; остальные обязательные поля есть в полном примере.

| Поле | Обязательность/default | Назначение |
| --- | --- | --- |
| viewSource | Optional | Включает загрузку полной ViewDefinition по текущему browser pathname. |
| viewSource.request | Required | SchemaRequestDefinition: path, optional GET/POST method (default GET), query/body. Expressions разрешаются в application scope. |
| viewSource.pathQueryParam | Optional, path | Query-параметр, в который loader добавляет pathname, включая hosting prefix. Разрешены безопасные ASCII-имена. Одноимённое значение request.query заменяется. |
| viewSource.onLoaded | Optional | Application-local named action после успешной validation, до активации View. Payload: {pathname,viewId,title}. Ошибка callback идёт в diagnostics; View продолжает активацию. |
| routes | Required, [] для remote mode | В remote mode маршруты individual navigation items не перечисляются. Непустой routes вместе с viewSource отклоняется. |
| views | Required, {} в demo | Remote mode не читает bundled definitions и не использует их как fallback. Старые приложения без viewSource сохраняют routes/viewId/views. |

Текущий pathname не включает search/hash. Изменение только query string не перезагружает definition и не заменяет View scope. Для такой семантики нужен отдельный контракт.

## Полный путь исполнения

1. Backend /api/app/navigation и node-local children sources возвращают navigation DATA с href.
2. PrimaryNavigation отдаёт {value,href}; named application action вызывает navigate.
3. React Router изменяет browser pathname.
4. RouteOutlet получает ViewSourceDefinition из application context.
5. ViewSchemaLoader.acquire разрешает application expressions и добавляет pathname в API query.
6. Backend сопоставляет URL полной ViewDefinition.
7. Loader проверяет JSON, предел 1 MiB и validateViewDefinition с общим registry.
8. Optional onLoaded вызывает named application action. В demo он обновляет currentPath и breadcrumbs.
9. Существующий ViewRuntimeHost создаёт общий RuntimeScope и рендерит root через RuntimeNode.
10. OnViewInit datasources и последующие actions/bindings работают обычным scoped runtime.

Пример: /application/users даёт GET /api/ui/views?path=%2Fapplication%2Fusers. Unknown path даёт 404/error UI, без подмены другим экраном.

## Lifecycle, ошибки и cancellation

Shell/application scope/store остаются. При смене pathname прежняя View и все fragment descendants dispose уже на loading-этапе. Новая View не создаётся до validation. Direct links, refresh и Back/Forward используют тот же loader.

Spinner/ErrorMessage/Retry берутся из общего ComponentRegistry. Ошибка загрузки остаётся внутри outlet. FragmentRenderBoundary также изолирует render/activation error загруженной View. Retry увеличивает generation и получает свежий JSON.

Активные leases одинакового application scope/request/generation делят HTTP и Promise. Lease хранит только definition result и transient request coordination, не ViewRuntime. Last release в microtask удаляет запись и aborts запрос. Replay StrictMode успевает reacquire до первого HTTP side effect. Application dispose aborts pending acquisition. Promise отвергается сразу при abort, даже если transport игнорирует signal; поздний response не активирует View.

Это не persistent definition cache: после ухода со страницы и возврата JSON загружается снова, scope всегда новый. Поведение fragment definitionCache/scopeLifetime не изменено.

## Навигация и tooling

PrimaryNavigation получает selectedHref из $appState.currentPath; непустой URL имеет приоритет над selectedId. Back/Forward обновляют выделение через onLoaded action. Компонент получает только props/callbacks.

Navigation children остаются DATA. SchemaOutlet продолжает загружать nested FragmentDefinition/legacy subtrees внутри View. Remote View loader не создаёт отдельный renderer, action engine или store.

Full Application Demo Schema selector теперь меняет URL, а не подставляет bundled View. Side-by-side comparison использует author fixtures как tooling, inspector показывает фактически активный scope и загруженный JSON. Schema loading log различает metadata.viewSchema и fragment metadata.schemaResource; datasource lifecycle отдельный.

## Файлы и проверка

- src/runtime/routing/types.ts, ViewSchemaLoader.ts, RouteOutlet.tsx
- src/runtime/application/ApplicationHost.tsx
- backend/routes/views.ts, backend/data/navigation.ts
- src/schemas/application/reporting.json
- tests/remote-view-loader.test.ts
- tests/remote-view-routing.test.tsx
- tests/remote-view-api.test.ts

Backend demo использует явную таблицу URL и общие View producers. Reports/Users author JSON переиспользуются backend и справочными инструментами; main runtime получает JSON через HTTP. Добавление URL не требует feature branches внутри runtime.

Server должен авторизовать navigation и schema resolution. Скрытый navigation item не заменяет server authorization. Demo map не заменяет production access policy. Payload limit проверяется после JSON parsing; network byte/time limits, API shape validation, schema versioning и redaction принадлежат host.


## Реактивный source request

RemoteView подписан на вычисленный ViewSchemaLoader.prepare request через Redux selector. Изменение используемых $appState/$appData path/query/body при прежнем pathname заменяет View scope, отменяет предыдущую schema lease и игнорирует late result. Равный resolved request не вызывает нового acquire: onLoaded может менять нерелевантные breadcrumbs без цикла. Изменения search/hash по-прежнему не являются trigger без отдельного контракта.

ViewSource.request принимает прежний object-template или StateExpression на весь request. Host policy и literal resolved values общие со SchemaOutlet. prepare получает Redux snapshot; acquire использует этот же prepared request, а не повторно разрешает другой snapshot.
