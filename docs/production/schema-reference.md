# Полный формат author JSON

[Оглавление](README.md) · [точные типы всех полей](contracts-api-reference.md) · [примеры](examples.md)

## Слои определений и обязательность

JSON содержит plain objects/arrays, строки, конечные числа, boolean/null. Комментарии, функции, undefined, NaN/Infinity, циклы, getters и live runtime handles не являются wire-данными. На границе Remote FragmentDefinition применяется JSON validation; raw JS application objects нужно валидировать до конструирования runtime.

### ApplicationDefinition

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| id | string | Да, непустое | ID определения приложения. Runtime создаёт отдельный instance/scopeId. |
| initialState | JsonObject | Да; пустое {} допустимо | Начальный application state, независимая structuredClone при initialize. |
| dataSources | Record<string,DataSourceDefinition> | Да; {} | App-owned DATA, доступ через $appData или локальный $data shell. |
| actions | Record<string,ActionDefinition> | Да; {} | App-local named actions. Handler shell ищет их только здесь. |
| schemaSources | Record<string,SchemaSourceDefinition> | Нет | Именованные источники неизвестных UI-деревьев; inline outlet не требует этой секции. |
| shell | ComponentDefinition | Да | Всё дерево application shell: header/navigation/outlet. Ровно один route-outlet. |
| routes | RouteDefinition[] | Да | Legacy bundled routing. При viewSource должен быть []. Без viewSource первый route задаёт fallback; [] рендерит пустой outlet. |
| views | Record<string,ViewDefinition> | Да | Bundled definitions для legacy route.viewId. Remote View mode не использует этот словарь, в demo {}. |
| viewSource | ViewSourceDefinition | Нет | Общий backend resolver полной ViewDefinition по browser pathname. Все поля: [remote routing](remote-view-routing.md). |

Название application UI задаётся обычными props/bindings shell. title/version/$schema/permissions/imports не являются текущими полями ApplicationDefinition.

### ViewDefinition

Наследует id, initialState, dataSources, actions, schemaSources из общего RuntimeScopeDefinition.

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| id | string | Да | ID определения View, не URL и не live scopeId. |
| title | string | Да, непустое | Название для host/tooling; само по себе заголовок UI не рисует. |
| initialState | JsonObject | Да | Шаблон состояния View, $state внутри View. |
| dataSources | dictionary | Да | View-local DATA. |
| actions | dictionary | Да | View-local named actions. |
| schemaSources | dictionary | Нет | View-local источники UI JSON. |
| root | ComponentDefinition | Да | Дерево View; route-outlet внутри него запрещён. |

При смене owning View прежний scope и его потомки уничтожаются. Application state/data сохраняются. Одновременные независимые View в одном environment пока не поддержаны.

### FragmentDefinition: wire-ответ

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| type | "fragment" | Да | Discriminator самостоятельного scope. |
| id | string | Нет; "fragment" | Имя шаблона. Не должно быть уникально между работающими экземплярами. |
| state | JsonObject | Нет; {} | Клонируемый локальный state. Поле называется state, а не initialState. |
| dataSources | Record<string,FragmentDataSourceDefinition> | Нет; {} | Локальные DATA; onInit является fragment alias onScopeInit. |
| actions | dictionary | Нет; {} | Локальные named actions, включая продолжения API/sequence. |
| schemaSources | dictionary | Нет | Собственные named sources, в том числе для nesting. |
| root | FragmentComponentDefinition | Да | Дерево, которое рендерится после готовности state/idle DATA entries. |

Explicit null вместо state/dataSources/actions — ошибка. Неизвестные поля envelope отвергаются. Другая оболочка kind/schemaVersion/initialState/inputs не поддержана. В normalized внутренней модели id/state/dataSources/actions заполнены, onInit заменён onScopeInit, у каждого узла есть id. NormalizedLoadedFragment.scope равен fragment либо host для legacy bare ComponentDefinition.

### ComponentDefinition: каждый узел

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| id | string | Да в Application/View; remote node может опустить | Уникальность в одном дереве, React key обычных children. Метаданные узла не становятся props.id автоматически. |
| type | string | Да | Семантический ключ ComponentRegistry. Не имя JS-модуля и не CSS selector. |
| props | JsonObject | Нет; нет статических props | Статические публичные props адаптера. Без автоматического вычисления $. |
| bindings | Record<prop,Expression или BindingDefinition> | Нет | Reactive props в текущем scope. |
| visibility | boolean или Expression | Нет; true | Boolean результата определяет render condition. При false children размонтируются. |
| handlers | Record<callback,HandlerDefinition> | Нет | Генерируемые callbacks → local named action. |
| children | ComponentDefinition[] | Нет | Упорядоченные обычные дети, наследующие scope. Используйте это поле вместо props.children. |
| source | SchemaSource | Для schema-outlet обязательно | Имя источника или inline definition. На обычном адаптере не является public prop. |
| enabled | boolean или Expression | Для outlet optional; true | Разрешение приобретения/отображения схемы. Отличается от visibility. |
| key | string/number/boolean/null либо Expression | Для outlet optional; null | Пользовательская identity выбранного содержимого. Объекты/массивы валидатор запрещает, хотя базовый TS key шире. |
| lifecycle | {scopeLifetime?} | Для outlet optional | Только lifetime живой активации. |
| loading | ComponentDefinition | Для outlet optional | Parent-scoped fallback загрузки; без него registry spinner. |
| error | ComponentDefinition | Для outlet optional | Дополнительный parent-scoped fallback; стандартный ErrorMessage/Retry остаётся. |

У remote nodes id генерируется из tree path, избегая явных id. Он не является identity кеша или стабильным бизнес-ID.

RuntimeNode получает implementation из registry и объединяет static props → generated handlers → bound props. Binding с тем же именем перекрывает static/handler prop; не связывайте callback props через bindings. children задаёт RuntimeNode из schema children. Внутренний selector marker __visible не является prop API.

JSON validator проверяет существование type, общую структуру, expressions и actions, но не полную предметную форму каждого props/API-ответа. Required props/callbacks адаптера перечислены в [components-reference](components-reference.md). TypeScript optional не означает наличие fallback во всех компонентах.

### BindingDefinition

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| source | Expression | Да | Чтение из namespace, например $data.items.data.items. |
| default | JsonValue | Нет; undefined | Подставляется только если read вернул null/undefined. Literal; не вычисляется как expression. |

Краткая запись: "value":"$state.query". Полная: "items":{"source":"$data.items.data.items","default":[]}. Default массив/объект сохраняет reference, пока определение не заменено. Подробнее — [expressions](expressions-actions.md).

### HandlerDefinition

Единственное поле action:string, обязательно. Это own-key текущего actions. Дополнительные поля или inline {type,target,value} запрещены. Callback payload находится в $event; бизнес-адаптер передаёт plain JSON-compatible объект, не DOM event.

### RouteDefinition

Этот контракт сохраняет bundled mode. Для navigation URL → HTTP ViewDefinition используйте application.viewSource, описанный в [remote routing](remote-view-routing.md).

| Поле | Тип | Обязательно/default | Семантика |
| --- | --- | --- | --- |
| path | string | Да | Path React Router внутри hosting route. |
| viewId | string | Да | Ключ application.views. |

Дубли path и отсутствующие view definitions проверяются. Host должен проверить типы route/path, ограничить маршруты и выбрать конкретный fallback path. Схема не содержит публичных route params/query namespaces. Смена pathname/viewId/revision заменяет ViewRuntimeHost; один только query string не входит в его React key.

## SchemaSourceDefinition и InlineSchemaSource

| Путь | Требование/default | Значение |
| --- | --- | --- |
| schemaSources.<name> | Имя локального словаря | Именованный источник UI JSON. |
| named.request | Обязательно | SchemaRequestDefinition либо StateExpression, возвращающее request целиком. |
| named.load | Обязательно | Политика schema acquisition. |
| named.load.strategy | Обязательно "onDemand" | Загружать, когда outlet приобретает ресурс. |
| named.load.definitionCache | Нет; none | none/scope/view/application. |
| named.load.cache | Нет | Legacy alias; одновременно с definitionCache запрещён. |
| outlet.source | Строка или inline object | Строка должна существовать в owning scope.schemaSources. |
| inline.request | Обязательно | Та же схема запроса. |
| inline.definitionCache | Нет; none | Policy прямо на inline source, без load. |
| inline.cache | Нет | Legacy alias только definition cache. |
| lifecycle.scopeLifetime | Нет; activation | activation/outlet, отдельно от definition cache. |

SchemaRequestDefinition: method?:GET/POST (default GET), path:string (обязательно), query?:JsonObject|StateExpression, body?:JsonValue. params/headers/credentials/timeoutMs не входят в schema-source wire contract. Источники application уровня не могут использовать view-cache без owning View и named $viewState/$viewData-зависимости. Есть особенности общей tree validation; runtime prepare дополнительно требует owner view для policy view.

## Границы совместимости и validation

Неизвестные keys: FragmentDefinition envelope и inline schema source/lifecycle проверяются строго; Application/View/actions/request/component objects не имеют единого blanket additionalProperties=false. Не используйте случайное принятие неизвестного поля как поддержку возможности.

Ограничения remote definition: JSON size 1 MiB проверяется после получения/JSON parsing, JSON depth 128, component tree 1000 nodes/64 depth, fragment ancestry 32. Двойная защита ancestry не позволяет повторить resolved request в своей цепочке; независимые sibling outlets могут его разделять. Network byte/time limits в transport — отдельная обязанность.

Запрещённые сегменты path: пустой, __proto__, prototype, constructor. Путь с точкой разделяется на сегменты. Для state/datasource/action/schema-source IDs выбирайте простые имена без точек и специальных prototype-ключей.

Контракт current code не является формальной JSON Schema Draft-документацией/валидатором Ajv. Полные точные TS-объявления приведены в [API appendix](contracts-api-reference.md), а отличия compile-time/runtime указаны здесь и в production guide.


Schema-source request.path допускает локальный /api/ шаблон либо полное namespace expression, возвращающее локальный /api/ путь. request.query допускает объект либо StateExpression, возвращающее объект. Оба значения разрешаются в scope инициатора до HTTP и входят в identity. См. [источник динамического содержимого](dynamic-panels.md). Обычные action/datasource request declarations сохраняют прежние формы path/query.


## Request boundary после архитектурного ревью

SchemaSourceDefinition.request, InlineSchemaSource.request и ViewSourceDefinition.request принимают object-template SchemaRequestDefinition либо StateExpression на весь request. Object-template сохраняет существующие field expressions. Whole request binding возвращает уже вычисленные literal method/path/query/body; повторного resolve query/body нет. Default method GET, поддерживается POST. Неизвестные request поля отвергаются.

Declaration validation проверяет локальный абсолютный path и expressions, но не привязывает все приложения к /api/. Resolved request проходит RuntimeEnvironment.requestPolicy (default allowedPathPrefixes=["/api/"]) до transport, включая подстановку {params} в API actions. Literal/template/bound пути проверяются одинаково после URL normalization. External URL не поддерживаются этим local-path wire contract; custom transport может маршрутизировать локальный path к своему backend.

Bindings и handlers одного узла не могут содержать одноимённый prop. Конфликт отклоняется с component id/property до render. Callback из handlers имеет защитный приоритет и при programmatic unvalidated дереве.
