# Полные исполняемые JSON-примеры

[Оглавление](README.md) · [поля](schema-reference.md)

| Файл | Использование |
| --- | --- |
| [Полная схема текущего demo](../examples/guardian.application.full.json) | Текущий reportingApplicationDefinition: shell, actions, dataSources и общий viewSource. routes/views пусты; полная ViewDefinition приходит с backend по browser pathname. |
| [ApplicationDefinition](../examples/production/application.json) | Полный shell/header/navigation/route/view в одном JSON. Validate + ApplicationRuntime/ApplicationHost под Router/Provider/FluentProvider. |
| [ViewDefinition](../examples/production/view.json) | Та же View отдельно; можно вставить в Tab 2 Schema Playground. |
| [FragmentDefinition](../examples/production/fragment.json) | Полный backend response для workspace: local state/actions/items/onInit/nested note. Получается HTTP существующего demo, не frontend import. |
| [Navigation DATA](../examples/production/navigation-data.json) | Три схемы данных: static, remote и hybrid. Это не View/ComponentDefinition, в editor View напрямую не вставляется. |
| [Минимальный host View](../examples/fragment-host.view.json) | Select контекста + Switch + inline SchemaOutlet. |
| [Ответ workspace](../examples/items-panel.workspace.fragment.json) | Начальный tutorial snapshot для [русского field guide](../schema-json-guide.ru.md). |

Нужен запущенный demo backend npm run dev. Application example рассчитан на mounting /application/* с route catalog, как текущий playground. Application JSON не вставляется в редактор Tab 2: он принимает ViewDefinition.

## Что демонстрируется

Application: appState/appData, два onAppInit datasources, schema-generated shell/header/data-tree/route-outlet, named selection sequence → navigate, controlled collapse/expansion.

View: state.set/state.patch/api.request/datasource.reload/datasource.invalidate/notification.show/sequence, а navigate находится в application actions — вместе все восемь generic типов. Search → local state → scoped dependency/debounce → /api/items → reactive list. Visibility Switch не зависит от DependencyGraph.

Fetch message: GET /api/demo-message → local messageEnvelope target → named success sequence, $response.message → lastMessage и notification. onError имеет отдельную цепочку с $response.error. Retry DATA и schema Retry разные.

Panel: SidePanel.open управляется View; named schema source itemPanel разрешается в parent View. Backend возвращает independent FragmentDefinition через /api/ui/fragments/items-panel/workspace. Его $state/$data уже локальные; выбор элемента приобретает item-note child по HTTP.

Fragment JSON — снимок шаблона существующего endpoint для workspace. Чтобы публиковать изменённое определение, backend должен отдавать его через утверждённый source; наличие файла docs не меняет ответы API. Имена state/actions/dataSources бизнес-специфичны только в JSON.

## Проверка и адаптация

npm run docs:check читает [manifest](examples.json), вызывает реальные schema validators/normalizer и navigation DATA validator, сравнивает embedded View с отдельным файлом и проверяет наличие всех generic action типов.

Для production замените demo API contracts/auth/permissions/transport по [operations](production-operations.md). Сначала validate definitions и response shapes, затем создавайте runtime. Копирование примера не добавляет серверную авторизацию или persistence.
