# Все контракты, runtime API и модули

[Оглавление](README.md) · [семантика author JSON](schema-reference.md)

Автоматически сверяемый индекс объявленных полей, вложенных type literals, props всех registry functions и публичных class members. Наследуемые поля смотрите у базового типа ниже; сигнатуры сохраняют extends/Omit. Внутренние записи помечены исходным именем модуля. Optional не задаёт default. Это TypeScript/reference appendix, не обещание дополнительных author JSON полей.

## ActionDefinition[api.request]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>onError</code> | <code>string</code> | Да | — | Имя локального действия ошибки API либо callback error boundary; см. точный тип. |
| <code>onSuccess</code> | <code>string</code> | Да | — | Имя локального действия после успешного api.request с сохранением scope/event/response. |
| <code>request</code> | <code>RequestDefinition</code> | Нет | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |
| <code>target</code> | <code>string</code> | Да | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>type</code> | <code>"api.request"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[datasource.invalidate]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>source</code> | <code>string</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |
| <code>type</code> | <code>"datasource.invalidate"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[datasource.reload]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>source</code> | <code>string</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |
| <code>type</code> | <code>"datasource.reload"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[navigate]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>to</code> | <code>string</code> | Нет | — | Назначение navigate; строка или expression, результат обязан быть string. |
| <code>type</code> | <code>"navigate"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[notification.show]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>message</code> | <code>string</code> | Нет | — | Текст уведомления/результата. notification handler преобразует результат выражения в строку. |
| <code>tone</code> | <code>"success" \| "error" \| "info"</code> | Да | — | info/success/error для уведомления; info по умолчанию. |
| <code>type</code> | <code>"notification.show"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[sequence]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actions</code> | <code>string[]</code> | Нет | — | Словарь локальных именованных действий; у sequence это упорядоченный массив имён. |
| <code>type</code> | <code>"sequence"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## ActionDefinition[state.patch]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>target</code> | <code>string</code> | Да | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>type</code> | <code>"state.patch"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |
| <code>value</code> | <code>JsonObject</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ActionDefinition[state.set]

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>target</code> | <code>string</code> | Нет | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>type</code> | <code>"state.set"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |
| <code>value</code> | <code>JsonValue</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ActionEngine

Источник: [src/runtime/actions/ActionEngine.ts](../../src/runtime/actions/ActionEngine.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>constructor</code> | <code>(readonly services: ActionServices, private readonly registry: ActionRegistry)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>definitions</code> | <code>Record&lt;string, ActionDefinition&gt;</code> | Нет | — | Dictionary actions владельца scope, без отдельной копии/global named registry. |
| <code>execute</code> | <code>(id: string, context?: ExecutionContext, stack?: string[]) =&gt; Promise&lt;void&gt;</code> | Нет | — | Выполнить локальное именованное действие; context scope обязан совпасть с владельцем, scope/event/response сохраняются в цепочке. |
| <code>resolve</code> | <code>(value: unknown, context: ExecutionContext) =&gt; unknown</code> | Нет | — | Безопасно разрешить выражения/JSON по context; обычные строки не интерполируются. |
| <code>scope</code> | <code>RuntimeScope</code> | Нет | — | RuntimeScope владельца данного engine; named lookup и writes всегда локальны. |
| <code>services</code> | <code>ActionServices</code> | Нет | — | Scope-bound ActionServices, передаваемые generic handlers; не props UI. |
| <code>traceResolved</code> | <code>(stack: readonly string[], value: unknown, target?: string) =&gt; void</code> | Нет | — | Записать уже вычисленное handler значение для tooling без повторной оценки выражений. |

## ActionRegistry

Источник: [src/runtime/actions/ActionRegistry.ts](../../src/runtime/actions/ActionRegistry.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>get</code> | <code>(type: "state.set" \| "state.patch" \| "api.request" \| "datasource.reload" \| "datasource.invalidate" \| "navigate" \| "notification.show" \| "sequence") =&gt; ActionHandler&lt;"state.set" \| "state.patch" \| "api.request" \| "datasource.reload" \| "datasource.invalidate" \| "navigate" \| "notification.show" \| "sequence"&gt;</code> | Нет | — | Найти generic action type handler; неизвестный generic type вызывает ошибку. |
| <code>register</code> | <code>&lt;K extends ActionType&gt;(type: K, handler: ActionHandler&lt;K&gt;) =&gt; this</code> | Нет | — | Сопоставить generic action type handler-функции. Named actions хранятся отдельно на scope. |

## ActionServices

Источник: [src/runtime/actions/ActionServices.ts](../../src/runtime/actions/ActionServices.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>active</code> | <code>() =&gt; boolean</code> | Нет | — | Проверка активности scope/сервиса; устаревшие операции не должны записывать состояние. |
| <code>dataSources</code> | <code>DataSourceManager</code> | Нет | — | Словарь локальных источников данных либо принадлежащий scope DataSourceManager для API-контракта. |
| <code>diagnostics</code> | <code>Diagnostics</code> | Нет | — | Read-only для business поведения diagnostic stream environment. |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>navigate</code> | <code>(to: string) =&gt; void</code> | Нет | — | Инъецируемый сервис навигации; default handler передаёт разрешённую строку to без URL allowlist. |
| <code>notify</code> | <code>(message: string, tone: "success" \| "error" \| "info") =&gt; void</code> | Нет | — | Инъецируемый сервис уведомлений message/tone; business компоненты его напрямую не вызывают. |
| <code>resolver</code> | <code>ExpressionResolver</code> | Нет | — | Общий безопасный ExpressionResolver без eval. |
| <code>runtimeScope</code> | <code>RuntimeScope</code> | Нет | — | Владелец сервисов/ресурсов; все обращения должны сохранять эту identity. |
| <code>scope</code> | <code>Scope</code> | Нет | — | RuntimeScope, legacy тег app/view/fragment или host/fragment discriminator результата нормализации; см. тип строки. |
| <code>signal</code> | <code>AbortSignal</code> | Нет | — | AbortSignal владельца; прерывается при dispose scope. |
| <code>store</code> | <code>RuntimeStore</code> | Нет | — | Единственный Redux store environment. Live scope/controller/engine не помещаются в Redux. |
| <code>transport</code> | <code>ApiTransport</code> | Нет | — | Инъецируемая функция (request, AbortSignal) → Promise результата API. |

## ApplicationDefinition

Источник: [src/runtime/application/types.ts](../../src/runtime/application/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>routes</code> | <code>RouteDefinition[]</code> | Нет | — | Упорядоченный массив path/viewId маршрутов. Первый используется fallback-маршрутом. |
| <code>shell</code> | <code>ComponentDefinition</code> | Нет | — | Корень дерева приложения. Содержит ровно один route-outlet, включая оболочку и навигацию. |
| <code>views</code> | <code>Record&lt;string, ViewDefinition&gt;</code> | Нет | — | Словарь ViewDefinition по идентификатору, на который ссылается route.viewId. |
| <code>viewSource</code> | <code>ViewSourceDefinition</code> | Да | — | Необязательный источник полной ViewDefinition по browser pathname. При его наличии routes пуст, а View загружается HTTP перед активацией общего ViewRuntime. |

## ApplicationHeaderProps

Источник: [src/components/application/ApplicationHeader.tsx](../../src/components/application/ApplicationHeader.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>brand</code> | <code>string</code> | Нет | — | Название бренда application header. |
| <code>breadcrumbs</code> | <code>string[]</code> | Нет | — | Массив строк breadcrumb; интерактивных ссылок в контракте нет. |
| <code>navigationCollapsed</code> | <code>boolean</code> | Да | — | Состояние свёрнутой shell-навигации. |
| <code>onToggleNavigation</code> | <code>ValueChangeCallback&lt;boolean&gt;</code> | Да | — | Следующее состояние свёрнутости shell-навигации в {value:boolean}. |
| <code>user</code> | <code>ApplicationUser\|null</code> | Да | — | Объект пользователя по указанному UserSummary/ApplicationUser контракту. |

## ApplicationNavigationItem

Источник: [src/contracts/application.ts](../../src/contracts/application.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ApplicationNavigationItem[]</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>childrenError</code> | <code>string \| null</code> | Да | — | Локальная ошибка загрузки navigation children или null. |
| <code>childrenLoading</code> | <code>boolean</code> | Да | — | Загружаются ли дочерние navigation DATA. |
| <code>depth</code> | <code>number</code> | Да | — | Уровень отступа подготовленного navigation item. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>expandable</code> | <code>boolean</code> | Да | — | Есть ли раскрываемые дети/source; вычисляется инфраструктурой. |
| <code>href</code> | <code>string</code> | Да | — | Адрес навигации; в backend data это строка. Проверка назначения/прав принадлежит host/backend. |
| <code>icon</code> | <code>string</code> | Да | — | Семантическое имя иконки адаптера; неизвестное имя использует fallback. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>key</code> | <code>string</code> | Да | — | Пользовательский scalar key outlet, полный tree key либо внутренний ключ — назначение уточняет контракт. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |

## ApplicationRuntime

Источник: [src/runtime/application/ApplicationRuntime.ts](../../src/runtime/application/ApplicationRuntime.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>constructor</code> | <code>(definition: ApplicationDefinition, environment: RuntimeEnvironment)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |

## ApplicationShellProps

Источник: [src/components/application/ApplicationShell.tsx](../../src/components/application/ApplicationShell.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>navigationCollapsed</code> | <code>boolean</code> | Да | — | Состояние свёрнутой shell-навигации. |

## ApplicationUser

Источник: [src/contracts/application.ts](../../src/contracts/application.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>initials</code> | <code>string</code> | Нет | — | Инициалы avatar. |
| <code>name</code> | <code>string</code> | Нет | — | Отображаемое имя данных/параметра; у TreeDataNode используется label либо name. |
| <code>role</code> | <code>string</code> | Нет | — | Роль пользователя для отображения; не enforcement разрешений. |

## BindingDefinition

Источник: [src/runtime/binding/types.ts](../../src/runtime/binding/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>default</code> | <code>JsonValue</code> | Да | — | Fallback только для null/undefined результата binding; false/0/пустая строка сохраняются. |
| <code>source</code> | <code>Expression</code> | Нет | — | Обязательное выражение чтения с namespace; контекст RuntimeNode текущего scope. |

## BindingEngine

Источник: [src/runtime/binding/BindingEngine.ts](../../src/runtime/binding/BindingEngine.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>constructor</code> | <code>(private readonly resolver: ExpressionResolver)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>createSelector</code> | <code>(bindings: Record&lt;string, Expression \| BindingDefinition&gt; \| undefined, scope: RuntimeScope, visibility?: boolean \| Expression \| undefined) =&gt; (state: RuntimeState) =&gt; StateObject</code> | Нет | — | Создать scope-aware memoized selector props/visibility со стабильными fallback references. |
| <code>select</code> | <code>(definition: ComponentDefinition, state: RuntimeState, scope?: RuntimeScope \| undefined) =&gt; StateObject</code> | Нет | — | Совместимый одномоментный binding projection; без scope использует старое view-поведение. |

## ButtonProps

Источник: [src/components/primitive/Button.tsx](../../src/components/primitive/Button.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onClick</code> | <code>()=&gt;void</code> | Нет | — | Активация кнопки без payload. Handler получает undefined в $event. |
| <code>variant</code> | <code>'primary'\|'secondary'\|'ghost'</code> | Да | — | Визуальный вариант Button: primary/secondary/ghost. |

## CardProps

Источник: [src/components/layout/Card.tsx](../../src/components/layout/Card.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |
| <code>description</code> | <code>string</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>title</code> | <code>string</code> | Да | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## CatalogLayoutProps

Источник: [src/components/layout/CatalogLayout.tsx](../../src/components/layout/CatalogLayout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

## CheckboxProps

Источник: [src/components/primitive/Checkbox.tsx](../../src/components/primitive/Checkbox.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>checked</code> | <code>boolean</code> | Нет | — | Контролируемое boolean состояние Switch/Checkbox. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;boolean&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

## ChildrenSourceDefinition

Источник: [src/contracts/tree.ts](../../src/contracts/tree.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>itemsPath</code> | <code>string</code> | Да | — | Путь к массиву DATA-ответа: items по умолчанию, пустая строка для bare array. |
| <code>request</code> | <code>{     method?: "GET" \| "POST";     path: string;     query?: JsonObject;     body?: JsonValue;   }</code> | Нет | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |

## ChildrenSourceDefinition.request

Источник: [src/contracts/tree.ts](../../src/contracts/tree.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>body</code> | <code>JsonValue</code> | Да | — | JSON тело запроса; при наличии fetchTransport сериализует JSON и ставит Content-Type. |
| <code>method</code> | <code>"GET" \| "POST"</code> | Да | — | HTTP-метод; RequestDefinition требует его явно, schema/children source по умолчанию GET. |
| <code>path</code> | <code>string</code> | Нет | — | Путь запроса/маршрута либо массив сегментов scoped-адреса; тип различает эти контракты. |
| <code>query</code> | <code>JsonObject</code> | Да | — | Query-параметры запроса; SchemaRequestDefinition также допускает StateExpression, возвращающее весь объект. Transport пропускает null/undefined/пустую строку и преобразует остальные значения String. |

## component:navigation-group.onExpandedChange.payload.event

Источник: [src/components/navigation/NavigationGroup.tsx](../../src/components/navigation/NavigationGroup.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>boolean</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## component:tabs.items[]

Источник: [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |

## component:tabs.onSelect.payload.event

Источник: [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ComponentBinder

Источник: [src/runtime/rendering/ComponentBinder.ts](../../src/runtime/rendering/ComponentBinder.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>bind</code> | <code>(definition: ComponentDefinition, engine: ActionEngine, scope?: RuntimeScope) =&gt; StateObject</code> | Нет | — | Создать статические props и callback closures, вызывающие локальные named actions с owning scope. |

## ComponentDefinition

Источник: [src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>bindings</code> | <code>Record&lt;string, Expression \| BindingDefinition&gt;</code> | Да | — | Реактивные props: prop → expression или {source,default}. Вычисляются BindingEngine в текущем scope. |
| <code>children</code> | <code>ComponentDefinition[]</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>enabled</code> | <code>Expression \| boolean</code> | Да | — | Boolean/выражение активации SchemaOutlet в scope родителя; по умолчанию true. |
| <code>error</code> | <code>ComponentDefinition</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>handlers</code> | <code>Record&lt;string, HandlerDefinition&gt;</code> | Да | — | Callback prop → {action:localName}; разрешены только ссылки на локальные именованные действия. |
| <code>id</code> | <code>string</code> | Нет | — | Обязательный ID узла, уникальный внутри дерева; используется React key для обычных children. Сам не передаётся в props адаптера. |
| <code>key</code> | <code>import("../shared/json").JsonValue</code> | Да | — | SchemaOutlet-only user scalar/expression, default null. Runtime validation уже базового JsonValue типа: object/array запрещены. |
| <code>lifecycle</code> | <code>{     scopeLifetime?: import("../schema/types").FragmentScopeLifetime;   }</code> | Да | — | Настройки активации SchemaOutlet; сейчас единственное поле scopeLifetime. |
| <code>loading</code> | <code>ComponentDefinition</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>props</code> | <code>JsonObject</code> | Да | — | Статические JSON props компонента; выражения в них автоматически не вычисляются. |
| <code>source</code> | <code>import("../schema/types").SchemaSource</code> | Да | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |
| <code>type</code> | <code>string</code> | Нет | — | Обязательный семантический ключ ComponentRegistry, например stack. Это не import/JS имя. |
| <code>visibility</code> | <code>Expression \| boolean</code> | Да | — | Условие рендера: boolean или выражение; Boolean результата. По умолчанию true. |

## ComponentDefinition.lifecycle

Источник: [src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>scopeLifetime</code> | <code>import("../schema/types").FragmentScopeLifetime</code> | Да | — | activation по умолчанию; outlet удерживает собственный scope при деактивации только пока outlet смонтирован. |

## ComponentRegistry

Источник: [src/runtime/rendering/ComponentRegistry.ts](../../src/runtime/rendering/ComponentRegistry.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>get</code> | <code>(type: string) =&gt; ComponentType&lt;StateObject&gt;</code> | Нет | — | Найти зарегистрированную реализацию по ключу; неизвестный ключ вызывает ошибку. |
| <code>has</code> | <code>(type: string) =&gt; boolean</code> | Нет | — | Проверить наличие типа в ComponentRegistry. |
| <code>list</code> | <code>() =&gt; readonly string[]</code> | Нет | — | Получить отсортированную копию имён ComponentRegistry. |
| <code>register</code> | <code>&lt;P extends object&gt;(type: string, component: ComponentType&lt;P&gt;) =&gt; this</code> | Нет | — | Сопоставить семантический type React adapter. Повторный type заменяет реализацию; не мутируйте registry после mount без отдельного version/remount. |

## DataEntry

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>data</code> | <code>unknown</code> | Нет | — | Ответ API или словарь DataEntry текущего scope — точная структура приведена в типе. |
| <code>error</code> | <code>string \| null</code> | Нет | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>loading</code> | <code>boolean</code> | Нет | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>status</code> | <code>"idle" \| "loading" \| "success" \| "error"</code> | Нет | — | idle/loading/success/error. Cancellation не отдельный status; детали переходов в datasource reference. |

## DataSourceDefinition

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>dependsOn</code> | <code>StateExpression[]</code> | Да | — | Явные зависимости state/data с scope identity; управляют reload datasource, не React рендером. |
| <code>load</code> | <code>{     strategy: "onViewInit" \| "onAppInit" \| "onScopeInit" \| "manual";     reload?: "onDependencyChange" \| "manual";     debounceMs?: number;   }</code> | Нет | — | Политика lifecycle datasource или именованного schema source; см. strategy/reload/cache. |
| <code>request</code> | <code>RequestDefinition</code> | Нет | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |
| <code>type</code> | <code>"api"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## DataSourceDefinition.load

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>debounceMs</code> | <code>number</code> | Да | — | Trailing debounce dependency reload, 0 по умолчанию; finite 0..2147483647 миллисекунд. |
| <code>reload</code> | <code>"onDependencyChange" \| "manual"</code> | Да | — | Политика автоматической перезагрузки либо метод немедленного обновления ресурса; детали в datasource API. |
| <code>strategy</code> | <code>"onViewInit" \| "onAppInit" \| "onScopeInit" \| "manual"</code> | Нет | — | Стартовая политика; допустимые значения зависят от datasource/scope или onDemand schema source. |

## DataSourceIdentity

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>scopeId</code> | <code>ScopeId</code> | Нет | — | Identity owning scope datasource, используется вместе с sourceId. |
| <code>sourceId</code> | <code>string</code> | Нет | — | Локальное datasource имя в указанном scopeId. |

## DataSourceManager

Источник: [src/runtime/datasource/DataSourceManager.ts](../../src/runtime/datasource/DataSourceManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>acquireInline</code> | <code>(request: RequestDefinition) =&gt; { id: string; release: () =&gt; void; }</code> | Нет | — | Получить scope-local lease node DATA request; общий существующий datasource pipeline и canonical request identity. |
| <code>constructor</code> | <code>(readonly runtimeScope: RuntimeScope)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>dependenciesChanged</code> | <code>(sourceIds: readonly string[], changes: readonly ScopedChangedPath[], previous: RuntimeState, next: RuntimeState) =&gt; void</code> | Нет | — | Обработать поражённые resources: проверить реальные значения и reload policy, отменить/задебаунсить работу. |
| <code>dispose</code> | <code>() =&gt; void</code> | Нет | — | Идемпотентно завершить владение ресурсами; у RuntimeScope рекурсивно завершает потомков и удаляет их Redux entries. |
| <code>identity</code> | <code>(sourceId: string) =&gt; DataSourceIdentity</code> | Нет | — | Проверить локальное имя и вернуть {scopeId,sourceId}. |
| <code>initialize</code> | <code>() =&gt; void</code> | Нет | — | Зарегистрировать manager и dependencies без HTTP. Idle DataEntry создаёт RuntimeScope.initialize. |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>invalidate</code> | <code>(id: string) =&gt; void</code> | Нет | — | Отменить datasource работу/таймер и сбросить его DataEntry в idle/null; само по себе не запускает reload. |
| <code>listDefinitions</code> | <code>() =&gt; Record&lt;string, DataSourceDefinition&gt;</code> | Нет | — | Tooling projection объявленных и inline datasource definitions; не дополнительный registry. |
| <code>load</code> | <code>(id: string) =&gt; Promise&lt;void&gt;</code> | Нет | — | Немедленно загрузить локальный datasource: cancel previous/timer, resolve owner request, записать loading/success/error. API failure сохраняет DataEntry error и не reject как command chain. |
| <code>refreshDependencies</code> | <code>() =&gt; void</code> | Нет | — | Перерегистрировать ancestor addresses после controlled bootstrap application promotion. |
| <code>reload</code> | <code>(id: string) =&gt; Promise&lt;void&gt;</code> | Нет | — | Alias load(id): немедленная загрузка, обход dependency debounce. |
| <code>runtimeScope</code> | <code>RuntimeScope</code> | Нет | — | Владелец сервисов/ресурсов; все обращения должны сохранять эту identity. |
| <code>scope</code> | <code>Scope</code> | Нет | — | Legacy tag app/view/fragment владельца manager. |
| <code>scopeId</code> | <code>string</code> | Нет | — | Уникальная identity живого scope внутри runtime; создаётся автоматически, не авторское поле JSON. |
| <code>start</code> | <code>() =&gt; void</code> | Нет | — | Один раз запустить onInit policy ресурсов активного владельца; не создавать отдельный store. |

## DataTreeRuntime.Props

Источник: [src/runtime/data-tree/DataTreeRuntime.tsx](../../src/runtime/data-tree/DataTreeRuntime.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>[key]</code> | <code>[prop: string]: unknown;</code> | Да | — | Динамический ключ JSON-объекта/словаря; значение задаётся указанным типом. Для выражений используйте безопасные имена без точек. |
| <code>component</code> | <code>string</code> | Нет | — | Целевой registry type адаптера data-tree. Не может быть data-tree; должен существовать в registry. |
| <code>error</code> | <code>string \| null</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>expandedIds</code> | <code>string[]</code> | Да | — | Контролируемые канонические tree keys раскрытых узлов. |
| <code>items</code> | <code>unknown</code> | Да | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |

## DefinitionCacheSelection[1]

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cache</code> | <code>never</code> | Да | — | Legacy alias definitionCache у author source; в runtime entry нормализованная JSON-cache policy. |
| <code>definitionCache</code> | <code>DefinitionCachePolicy</code> | Да | — | Срок хранения JSON определения: none/scope/view/application; по умолчанию none, независимо от runtime lifetime. |

## DefinitionCacheSelection[2]

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cache</code> | <code>DefinitionCachePolicy</code> | Да | — | Legacy alias definitionCache у author source; в runtime entry нормализованная JSON-cache policy. |
| <code>definitionCache</code> | <code>never</code> | Да | — | Срок хранения JSON определения: none/scope/view/application; по умолчанию none, независимо от runtime lifetime. |

## DependencyGraph

Источник: [src/runtime/datasource/DependencyGraph.ts](../../src/runtime/datasource/DependencyGraph.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>affected</code> | <code>{ (changes: readonly ScopedChangedPath[]): DataSourceIdentity[]; (changes: readonly StateExpression[]): string[]; }</code> | Нет | — | Получить уникальные affected targets по пересечению scope/area/path, включая замену ancestor path. |
| <code>constructor</code> | <code>(definitions?: Record&lt;string, DataSourceDefinition&gt;, scope: Scope = "view")</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>register</code> | <code>(registrations: readonly DependencyRegistration[]) =&gt; () =&gt; void</code> | Нет | — | Атомарно зарегистрировать scope-qualified resource edges с cycle check; вернуть ownership unregister handle. |
| <code>registerScope</code> | <code>(scope: ScopeAddressContext, definitions: Record&lt;string, DataSourceDefinition&gt;) =&gt; () =&gt; void</code> | Нет | — | Преобразовать definitions.dependsOn через owning scope addresses и register полученные edges. |
| <code>registrations</code> | <code>() =&gt; readonly DependencyRegistration[]</code> | Нет | — | Вернуть отделённую копию фактических scope-qualified dependency edges. |

## DependencyRegistration

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>paths</code> | <code>readonly ScopedChangedPath[]</code> | Нет | — | Массив канонических scope-qualified зависимостей ресурса. |
| <code>target</code> | <code>DataSourceIdentity</code> | Нет | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |

## Diagnostics

Источник: [src/runtime/shared/Diagnostics.ts](../../src/runtime/shared/Diagnostics.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>clear</code> | <code>() =&gt; void</code> | Нет | <code>() =&gt; {     this.entries = [];     this.notify();   }</code> | Удалить только diagnostic history и уведомить observers; не изменяет Redux/ресурсы. |
| <code>snapshot</code> | <code>() =&gt; TraceEntry[]</code> | Нет | <code>() =&gt; this.entries</code> | Текущий bounded diagnostic snapshot для useSyncExternalStore. |
| <code>subscribe</code> | <code>(listener: () =&gt; void) =&gt; () =&gt; void</code> | Нет | <code>(listener: () =&gt; void) =&gt; {     this.listeners.add(listener);     return () =&gt; {       this.listeners.delete(listener);     };   }</code> | Подписаться на diagnostic изменения; возвращает unsubscribe, ошибки observers изолированы. |
| <code>trace</code> | <code>(kind: "error" \| "action" \| "state" \| "dependency" \| "request" \| "lifecycle", label: string, detail?: string \| undefined, metadata?: TraceMetadata \| undefined) =&gt; void</code> | Нет | — | Добавить detached metadata snapshot в последние 100 diagnostic events. |

## ExecutionContext

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>event</code> | <code>unknown</code> | Да | — | Payload конкретного callback/execution, доступный как $event. |
| <code>response</code> | <code>unknown</code> | Да | — | Текущий chain response, доступный как $response; не глобальный последний ответ. |
| <code>scope</code> | <code>RuntimeScope</code> | Да | — | Owning RuntimeScope; optional default this engine owner. Другой scope запрещён. |

## ExpressionContext

Источник: [src/runtime/shared/types.ts](../../src/runtime/shared/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>event</code> | <code>unknown</code> | Да | — | Payload действия или фаза diagnostics. $event доступен только в execution context, не постоянно в Redux. |
| <code>response</code> | <code>unknown</code> | Да | — | Последний ответ API текущей action chain; при обработке ошибки объект {error:message}. |
| <code>scope</code> | <code>import("./RuntimeScope").RuntimeScope</code> | Да | — | RuntimeScope для namespace addressing по переданному snapshot; новым callers передавать всегда. |
| <code>scopeId</code> | <code>string</code> | Да | — | Deprecated compatibility fragment address без RuntimeScope; используйте scope. |
| <code>state</code> | <code>RuntimeState</code> | Нет | — | Переданный Redux snapshot, единственный источник state/data чтения этого вычисления. |

## ExpressionResolver

Источник: [src/runtime/binding/ExpressionResolver.ts](../../src/runtime/binding/ExpressionResolver.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>resolve</code> | <code>(value: unknown, context: ExpressionContext) =&gt; unknown</code> | Нет | — | Безопасно разрешить выражения/JSON по context; обычные строки не интерполируются. |
| <code>resolvePath</code> | <code>(template: string, context: ExpressionContext) =&gt; string</code> | Нет | — | Разрешить полный path expression без кодирования слешей либо URL-шаблон с кодированием каждого token как сегмента; полный path должен остаться локальным /api/. |

## FragmentComponentDefinition

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>FragmentComponentDefinition[]</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>error</code> | <code>FragmentComponentDefinition</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>id</code> | <code>string</code> | Да | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>loading</code> | <code>FragmentComponentDefinition</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |

## FragmentDataSourceDefinition

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>load</code> | <code>Omit&lt;DataSourceDefinition["load"], "strategy"&gt; &amp; {     strategy: "onInit" \| "onScopeInit" \| "manual";   }</code> | Нет | — | Политика lifecycle datasource или именованного schema source; см. strategy/reload/cache. |

## FragmentDataSourceDefinition.load[2]

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>strategy</code> | <code>"onInit" \| "onScopeInit" \| "manual"</code> | Нет | — | Стартовая политика; допустимые значения зависят от datasource/scope или onDemand schema source. |

## FragmentDefinition

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actions</code> | <code>Record&lt;string, ActionDefinition&gt;</code> | Да | — | Словарь локальных именованных действий; у sequence это упорядоченный массив имён. |
| <code>dataSources</code> | <code>Record&lt;string, FragmentDataSourceDefinition&gt;</code> | Да | — | Словарь локальных источников данных либо принадлежащий scope DataSourceManager для API-контракта. |
| <code>id</code> | <code>string</code> | Да | — | Необязательное имя определения; default fragment. Runtime scopeId создаётся отдельно на каждую активацию. |
| <code>root</code> | <code>FragmentComponentDefinition</code> | Нет | — | Корень дерева View/Fragment; не содержит route-outlet. |
| <code>schemaSources</code> | <code>Record&lt;string, SchemaSourceDefinition&gt;</code> | Да | — | Необязательный словарь именованных источников UI-определений; inline source не требует регистрации. |
| <code>state</code> | <code>JsonObject</code> | Да | — | Начальный JSON шаблон локального state; default {}. На каждый scope создаётся независимая копия. |
| <code>type</code> | <code>"fragment"</code> | Нет | — | Обязательный литерал fragment. Только явная оболочка создаёт новый локальный scope. |

## FragmentRenderBoundary

Источник: [src/runtime/schema/FragmentRenderBoundary.tsx](../../src/runtime/schema/FragmentRenderBoundary.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>componentDidCatch</code> | <code>(error: Error) =&gt; void</code> | Нет | — | React error-boundary callback: передаёт ошибку в props.onError. |
| <code>getDerivedStateFromError</code> | <code>() =&gt; { failed: boolean; }</code> | Нет | — | Перевести FragmentRenderBoundary в failed-состояние для fallback. |
| <code>getDerivedStateFromProps</code> | <code>(props: Props, state: { resetToken: unknown; }) =&gt; { failed: boolean; resetToken: unknown; } \| null</code> | Нет | — | Сбросить boundary failure при смене resetToken. |
| <code>render</code> | <code>() =&gt; ReactNode</code> | Нет | — | Вернуть children либо fallback согласно состоянию boundary. |
| <code>state</code> | <code>{ failed: boolean; resetToken: unknown; }</code> | Нет | <code>{ failed: false, resetToken: null as unknown }</code> | Локальное React boundary состояние {failed,resetToken}; не fragment Redux state. |

## FragmentRenderBoundary.Props

Источник: [src/runtime/schema/FragmentRenderBoundary.tsx](../../src/runtime/schema/FragmentRenderBoundary.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Нет | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>fallback</code> | <code>ReactNode</code> | Нет | — | React fallback error boundary; не JSON-поле бизнес-схемы. |
| <code>onError</code> | <code>(error: Error) =&gt; void</code> | Нет | — | Имя локального действия ошибки API либо callback error boundary; см. точный тип. |
| <code>resetToken</code> | <code>unknown</code> | Нет | — | Identity, при изменении которой error boundary разрешает повторный рендер. |

## FragmentRuntime

Источник: [src/runtime/fragment/FragmentRuntime.ts](../../src/runtime/fragment/FragmentRuntime.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>constructor</code> | <code>(definition: unknown, parent: RuntimeScope, registry: ComponentRegistry, origin?: Readonly&lt;ScopeOrigin&gt;)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>definition</code> | <code>NormalizedFragmentDefinition</code> | Нет | — | Определение владельца или результат parse/normalization; данные JSON отделены от live scope. |
| <code>dispose</code> | <code>() =&gt; void</code> | Нет | — | Идемпотентно завершить владение ресурсами; у RuntimeScope рекурсивно завершает потомков и удаляет их Redux entries. |
| <code>initialize</code> | <code>() =&gt; this</code> | Нет | — | Инициализировать принадлежащие объекту ресурсы; обязанности конкретного класса описаны в runtime-layers. Повторный вызов идемпотентен. |
| <code>scope</code> | <code>RuntimeScope</code> | Нет | — | RuntimeScope, legacy тег app/view/fragment или host/fragment discriminator результата нормализации; см. тип строки. |
| <code>scopeId</code> | <code>string</code> | Нет | — | Уникальная identity живого scope внутри runtime; создаётся автоматически, не авторское поле JSON. |
| <code>start</code> | <code>() =&gt; void</code> | Нет | — | Один раз запустить onInit policy ресурсов активного владельца; не создавать отдельный store. |

## GenericListProps

Источник: [src/components/navigation/GenericList.tsx](../../src/components/navigation/GenericList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>emptyMessage</code> | <code>string</code> | Да | — | Текст пустого состояния GenericList. |
| <code>items</code> | <code>ListItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>label</code> | <code>string</code> | Да | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Да | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |
| <code>selectedId</code> | <code>string\|null</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |

## GenericNavigationProps

Источник: [src/components/navigation/GenericNavigation.tsx](../../src/components/navigation/GenericNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>NavigationItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>label</code> | <code>string</code> | Да | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |
| <code>orientation</code> | <code>'vertical'\|'horizontal'</code> | Да | — | Расположение GenericNavigation: vertical/horizontal. |
| <code>selectedId</code> | <code>string\|null</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |

## HandlerDefinition

Источник: [src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>action</code> | <code>string</code> | Нет | — | Имя действия в actions текущего scope; не generic тип, не inline определение. |

## InlineSchemaSource[1]

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>request</code> | <code>SchemaRequestSource</code> | Нет | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |

## JsonObject

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>[key]</code> | <code>[key: string]: JsonValue</code> | Да | — | Динамический ключ JSON-объекта/словаря; значение задаётся указанным типом. Для выражений используйте безопасные имена без точек. |

## JsonValue[6]

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>[key]</code> | <code>[key: string]: JsonValue</code> | Да | — | Динамический ключ JSON-объекта/словаря; значение задаётся указанным типом. Для выражений используйте безопасные имена без точек. |

## ListItem

Источник: [src/components/navigation/GenericList.tsx](../../src/components/navigation/GenericList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>description</code> | <code>string</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>meta</code> | <code>string</code> | Да | — | Дополнительная подпись строки GenericList; только отображение. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## NavigationItem

Источник: [src/components/navigation/GenericNavigation.tsx](../../src/components/navigation/GenericNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>count</code> | <code>number</code> | Да | — | Отображаемое количество рядом с пунктом GenericNavigation. |
| <code>description</code> | <code>string</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |

## NormalizedFragmentDefinition

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actions</code> | <code>Record&lt;string, ActionDefinition&gt;</code> | Нет | — | Словарь локальных именованных действий; у sequence это упорядоченный массив имён. |
| <code>dataSources</code> | <code>Record&lt;string, DataSourceDefinition&gt;</code> | Нет | — | Словарь локальных источников данных либо принадлежащий scope DataSourceManager для API-контракта. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>root</code> | <code>ComponentDefinition</code> | Нет | — | Корень дерева View/Fragment; не содержит route-outlet. |
| <code>schemaSources</code> | <code>Record&lt;string, SchemaSourceDefinition&gt;</code> | Да | — | Необязательный словарь именованных источников UI-определений; inline source не требует регистрации. |
| <code>state</code> | <code>JsonObject</code> | Нет | — | Локальное состояние или снимок Redux в данном контракте; реальные записи и шаблон FragmentDefinition различаются по разделу scopes. |
| <code>type</code> | <code>"fragment"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## NormalizedLoadedFragment

Источник: [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>definition</code> | <code>NormalizedFragmentDefinition</code> | Нет | — | Normalized fragment description; при scope=host root использует host, пустые dictionaries не создают новый RuntimeScope. |
| <code>scope</code> | <code>"host" \| "fragment"</code> | Нет | — | host означает legacy bare tree без дочернего scope; fragment означает самостоятельную активацию. |

## PageHeaderProps

Источник: [src/components/layout/PageHeader.tsx](../../src/components/layout/PageHeader.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>description</code> | <code>string</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>eyebrow</code> | <code>string</code> | Да | — | Короткая надзаголовочная подпись PageHeader. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## PageProps

Источник: [src/components/layout/Page.tsx](../../src/components/layout/Page.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## PreparedSchemaRequest

Источник: [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>entry</code> | <code>SchemaFragmentEntry</code> | Нет | — | DataEntry/SchemaFragmentEntry данного ресурса; snapshot/plain JSON, не engine. |
| <code>error</code> | <code>string</code> | Да | — | Ошибка разрешения schema request до HTTP; request может отсутствовать. |
| <code>id</code> | <code>string</code> | Нет | — | JSON.stringify tuple cache owner, host definition id, source/declaration, key, resolved request/error. Порядок свойств объекта влияет на строку. |
| <code>request</code> | <code>RequestDefinition</code> | Да | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |

## PrimaryNavigationProps

Источник: [src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>caption</code> | <code>string</code> | Да | — | Необязательный заголовок navigation; приходит через props/bindings, без встроенного branding. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>error</code> | <code>string \| null</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>expandedIds</code> | <code>string[]</code> | Да | — | Контролируемые канонические tree keys раскрытых узлов. |
| <code>footerText</code> | <code>string</code> | Да | — | Необязательный текст footer navigation от host/schema; компонент не вычисляет connection status. |
| <code>items</code> | <code>ApplicationNavigationItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onExpandedChange</code> | <code>(event: { value: string[] }) =&gt; void</code> | Да | — | Изменение раскрытия: NavigationGroup передаёт boolean, PrimaryNavigation — массив canonical keys; см. тип. |
| <code>onRetry</code> | <code>() =&gt; void</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |
| <code>onRetryChildren</code> | <code>(event: { value: string }) =&gt; void</code> | Да | — | Повторить загрузку navigation DATA по canonical tree key в {value:string}. DataTreeRuntime генерирует этот callback. |
| <code>onSelect</code> | <code>(event: { value: string; href: string }) =&gt; void</code> | Нет | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |
| <code>selectedHref</code> | <code>string</code> | Да | — | Контролируемый URL выбранного navigation item. Непустое значение имеет приоритет над selectedId, включая Back/Forward. |
| <code>selectedId</code> | <code>string</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |

## PrimaryNavigationProps.onExpandedChange.payload.event

Источник: [src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string[]</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## PrimaryNavigationProps.onRetryChildren.payload.event

Источник: [src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## PrimaryNavigationProps.onSelect.payload.event

Источник: [src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>href</code> | <code>string</code> | Нет | — | Адрес навигации; в backend data это строка. Проверка назначения/прав принадлежит host/backend. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ReportCardProps

Источник: [src/components/reporting/ReportCard.tsx](../../src/components/reporting/ReportCard.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>onOpen</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Да | — | Открытие карточки отчёта; payload {value:report.id}. |
| <code>openLabel</code> | <code>string</code> | Да | — | Текст кнопки открытия ReportCard. |
| <code>report</code> | <code>ReportSummary</code> | Нет | — | Объект ReportSummary/ReportDetail для отображения; компонент не запрашивает API. |
| <code>selected</code> | <code>boolean</code> | Да | — | Флаг визуального выделения карточки. |

## ReportDetail

Источник: [src/contracts/reporting.ts](../../src/contracts/reporting.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>controls</code> | <code>string[]</code> | Нет | — | Массив compliance control ids отчёта. |
| <code>lastRun</code> | <code>string \| null</code> | Нет | — | Последний запуск: timestamp/null в ReportDetail либо ReportRunResult/null в details props. |
| <code>owner</code> | <code>string</code> | Нет | — | Владелец JSON-cache либо владелец бизнес-записи ReportDetail; эти сущности различаются типом. |
| <code>parameters</code> | <code>{ name: string; value: string }[]</code> | Нет | — | Массив параметров отчёта {name,value}; только отображение в текущем адаптере. |

## ReportDetail.parameters[]

Источник: [src/contracts/reporting.ts](../../src/contracts/reporting.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>name</code> | <code>string</code> | Нет | — | Отображаемое имя данных/параметра; у TreeDataNode используется label либо name. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ReportDetailsProps

Источник: [src/components/reporting/ReportDetails.tsx](../../src/components/reporting/ReportDetails.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>error</code> | <code>string \| null</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>lastRun</code> | <code>ReportRunResult \| null</code> | Да | — | Последний запуск: timestamp/null в ReportDetail либо ReportRunResult/null в details props. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onClose</code> | <code>() =&gt; void</code> | Нет | — | Запрос закрытия панели без payload. Владелец должен обновить open/visibility. |
| <code>onRetry</code> | <code>() =&gt; void</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |
| <code>onRun</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Запустить выбранный отчёт: {value:report.id}; API определяется JSON action. |
| <code>open</code> | <code>boolean</code> | Да | — | Контролируемая видимость панели/деталей; возврат null размонтирует её дочернее дерево. |
| <code>report</code> | <code>ReportDetail \| null</code> | Да | — | Объект ReportSummary/ReportDetail для отображения; компонент не запрашивает API. |
| <code>running</code> | <code>boolean</code> | Да | — | Флаг выполнения отчёта, контролируемый владельцем. |

## ReportListProps

Источник: [src/components/reporting/ReportList.tsx](../../src/components/reporting/ReportList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>error</code> | <code>string \| null</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>items</code> | <code>ReportSummary[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onOpen</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Открытие карточки отчёта; payload {value:report.id}. |
| <code>onRetry</code> | <code>() =&gt; void</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |
| <code>selectedId</code> | <code>string \| null</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |

## ReportRunResult

Источник: [src/contracts/reporting.ts](../../src/contracts/reporting.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>completedAt</code> | <code>string</code> | Нет | — | Строка даты/времени завершения demo-запуска. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>message</code> | <code>string</code> | Нет | — | Текст уведомления/результата. notification handler преобразует результат выражения в строку. |
| <code>reportId</code> | <code>string</code> | Нет | — | ID отчёта, к которому относится результат запуска. |
| <code>rowCount</code> | <code>number</code> | Нет | — | Количество строк результата отчёта. |
| <code>status</code> | <code>"completed"</code> | Нет | — | Состояние операции или бизнес-записи. Разрешённые значения перечислены в конкретном типе. |

## ReportSummary

Источник: [src/contracts/reporting.ts](../../src/contracts/reporting.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>coverage</code> | <code>string</code> | Да | — | Текст покрытия отчёта. |
| <code>description</code> | <code>string</code> | Нет | — | Поясняющий текст UI/бизнес-записи. |
| <code>frameworks</code> | <code>string[]</code> | Да | — | Массив подписей compliance frameworks. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>module</code> | <code>string</code> | Нет | — | Название модуля отчёта, непрозрачные бизнес-данные для runtime. |
| <code>reportType</code> | <code>string</code> | Да | — | Отображаемая категория отчёта. |
| <code>saved</code> | <code>boolean</code> | Да | — | Признак сохранённого отчёта. |
| <code>scope</code> | <code>string</code> | Да | — | RuntimeScope, legacy тег app/view/fragment или host/fragment discriminator результата нормализации; см. тип строки. |
| <code>status</code> | <code>"published" \| "draft"</code> | Нет | — | Состояние операции или бизнес-записи. Разрешённые значения перечислены в конкретном типе. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |
| <code>updatedAt</code> | <code>string</code> | Нет | — | Дата/строка обновления бизнес-записи. |

## RequestDefinition

Источник: [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>body</code> | <code>JsonValue</code> | Да | — | JSON тело запроса; при наличии fetchTransport сериализует JSON и ставит Content-Type. |
| <code>method</code> | <code>"GET" \| "POST" \| "PUT" \| "DELETE"</code> | Нет | — | HTTP-метод; RequestDefinition требует его явно, schema/children source по умолчанию GET. |
| <code>params</code> | <code>JsonObject</code> | Да | — | Значения для {name} в request.path; fetchTransport кодирует каждый параметр как сегмент. |
| <code>path</code> | <code>string</code> | Нет | — | Путь запроса/маршрута либо массив сегментов scoped-адреса; тип различает эти контракты. |
| <code>query</code> | <code>JsonObject</code> | Да | — | Query-параметры запроса; SchemaRequestDefinition также допускает StateExpression, возвращающее весь объект. Transport пропускает null/undefined/пустую строку и преобразует остальные значения String. |

## RequestPolicy

Источник: [src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>allowedPathPrefixes</code> | <code>readonly string[]</code> | Нет | — | Разрешённые префиксы нормализованного локального HTTP pathname. Host default: /api/. Для всех локальных путей явно укажите /. |

## RouteDefinition

Источник: [src/runtime/routing/types.ts](../../src/runtime/routing/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>path</code> | <code>string</code> | Нет | — | Путь React Router относительно hosting route. Первый путь выбирается fallback; для fallback используйте конкретный путь. |
| <code>viewId</code> | <code>string</code> | Нет | — | Ключ в application.views. Проверяется наличие определения; отсутствующий viewId вызывает ошибку. |

## RowProps

Источник: [src/components/layout/Row.tsx](../../src/components/layout/Row.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>align</code> | <code>'start' \| 'center' \| 'stretch'</code> | Да | — | Выравнивание поперёк оси контейнера; разрешённые литералы см. тип. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |
| <code>gap</code> | <code>number</code> | Да | — | Промежуток children в CSS pixels. |
| <code>justify</code> | <code>'start' \| 'center' \| 'between'</code> | Да | — | Распределение по основной оси Row: start/center/between. |
| <code>wrap</code> | <code>boolean</code> | Да | — | Разрешить перенос дочерних элементов Row. |

## RuntimeEnvironment

Источник: [src/runtime/shared/RuntimeEnvironment.ts](../../src/runtime/shared/RuntimeEnvironment.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actionRegistry</code> | <code>ActionRegistry</code> | Нет | <code>createActionRegistry()</code> | Общий registry generic action типов environment. |
| <code>applicationScope</code> | <code>RuntimeScope \| null</code> | Нет | — | Корневой RuntimeScope приложения текущей иерархии. |
| <code>childScopes</code> | <code>(parent: RuntimeScope) =&gt; RuntimeScope[]</code> | Нет | — | Получить текущих непосредственных потомков scope из environment registry. |
| <code>constructor</code> | <code>(readonly navigate: (to: string) =&gt; void, readonly notify: (       message: string,       tone: "success" \| "error" \| "info",     ) =&gt; void, transport?: ApiTransport, readonly requestPolicy: RequestPolicy = defaultRequestPolicy)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>dependencyGraph</code> | <code>DependencyGraph</code> | Нет | <code>new DependencyGraph()</code> | Общий scope-qualified граф ресурсов. Не управляет React rendering. |
| <code>diagnostics</code> | <code>Diagnostics</code> | Нет | <code>new Diagnostics()</code> | Read-only для business поведения diagnostic stream environment. |
| <code>ensureApplicationScope</code> | <code>() =&gt; RuntimeScope</code> | Нет | — | Совместимый bootstrap application для standalone ViewRuntime; тот же store, позже возможна controlled promotion. |
| <code>getScope</code> | <code>(scopeId: string) =&gt; RuntimeScope \| undefined</code> | Нет | — | Найти живой RuntimeScope по точной identity. |
| <code>listScopes</code> | <code>() =&gt; readonly RuntimeScope[]</code> | Нет | — | Получить текущую иерархию как список registry handles; live objects остаются вне Redux. |
| <code>navigate</code> | <code>(to: string) =&gt; void</code> | Нет | — | Инъецируемый сервис навигации; default handler передаёт разрешённую строку to без URL allowlist. |
| <code>notify</code> | <code>(       message: string,       tone: "success" \| "error" \| "info",     ) =&gt; void</code> | Нет | — | Инъецируемый сервис уведомлений message/tone; business компоненты его напрямую не вызывают. |
| <code>register</code> | <code>(manager: DataSourceManager) =&gt; () =&gt; void</code> | Нет | — | Internal: зарегистрировать scope-owned DataSourceManager, его graph edges и ownership token; вернуть unregister callback. |
| <code>registerScope</code> | <code>(scope: RuntimeScope, adoptParent: (parent: RuntimeScope) =&gt; void) =&gt; void</code> | Нет | — | Internal: зарегистрировать owner handle; новая View disposes прежнюю; controlled bootstrap app promotion меняет parent references. |
| <code>requestPolicy</code> | <code>RequestPolicy</code> | Нет | <code>defaultRequestPolicy</code> | Host policy для resolved HTTP URL; общая для schema, datasource, inline DATA, action и default transport. |
| <code>resolver</code> | <code>ExpressionResolver</code> | Нет | <code>new ExpressionResolver()</code> | Общий безопасный ExpressionResolver без eval. |
| <code>schemaCache</code> | <code>SchemaFragmentCache</code> | Нет | — | Общее хранилище JSON definitions и отдельной transient coordination. |
| <code>store</code> | <code>EnhancedStore&lt;RuntimeState, UnknownAction, Tuple&lt;[StoreEnhancer&lt;{ dispatch: ((action: Action&lt;"listenerMiddleware/add"&gt;) =&gt; UnsubscribeListener) &amp; ThunkDispatch&lt;RuntimeState, undefined, UnknownAction&gt;; }&gt;, StoreEnhancer]&gt;&gt;</code> | Нет | — | Один store на environment и все его application/view/fragment scopes. Независимые playground demos имеют отдельные environments. |
| <code>transport</code> | <code>ApiTransport</code> | Нет | — | Инъецируемая функция (request, AbortSignal) → Promise результата API. |
| <code>unregisterScope</code> | <code>(scope: RuntimeScope) =&gt; void</code> | Нет | — | Удалить scope из environment ownership registry; обычно вызывается RuntimeScope.dispose. |
| <code>viewScope</code> | <code>RuntimeScope \| null</code> | Нет | — | Ближайшая owning View или null для application-owned дерева. |

## RuntimeScope

Источник: [src/runtime/shared/RuntimeScope.ts](../../src/runtime/shared/RuntimeScope.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actionDefinitions</code> | <code>Record&lt;string, ActionDefinition&gt;</code> | Нет | — | Именованные действия владельца scope. |
| <code>actionEngine</code> | <code>ActionEngine</code> | Нет | — | Scope-owned ActionEngine; именованные действия разрешаются только локально. |
| <code>active</code> | <code>() =&gt; boolean</code> | Нет | — | Проверка активности scope/сервиса; устаревшие операции не должны записывать состояние. |
| <code>applicationScope</code> | <code>RuntimeScope</code> | Нет | — | Корневой RuntimeScope приложения текущей иерархии. |
| <code>applicationScopeId</code> | <code>string</code> | Нет | — | scopeId owning application, общий для всех потомков. |
| <code>constructor</code> | <code>(readonly definition: RuntimeScopeDefinition, readonly type: RuntimeScopeType, readonly environment: RuntimeEnvironment, parentScope?: RuntimeScope, readonly origin?: Readonly&lt;ScopeOrigin&gt;)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>dataSourceDefinitions</code> | <code>Record&lt;string, DataSourceDefinition&gt;</code> | Нет | — | Объявленные локальные datasource definitions владельца scope. |
| <code>dataSources</code> | <code>DataSourceManager</code> | Нет | — | Принадлежащий этому scope DataSourceManager, не JSON dictionary. Авторские определения доступны через dataSourceDefinitions. |
| <code>definition</code> | <code>RuntimeScopeDefinition</code> | Нет | — | Common RuntimeScopeDefinition: id/initialState/dataSources/actions/schemaSources; не live state snapshot. |
| <code>dispose</code> | <code>() =&gt; void</code> | Нет | — | Abort scope signal, рекурсивно dispose children, managers/cache leases, unregister scope и удалить Redux address. |
| <code>environment</code> | <code>RuntimeEnvironment</code> | Нет | — | Общий контейнер store, resolver, registries, graph и транспорта для application hierarchy. |
| <code>initialize</code> | <code>() =&gt; this</code> | Нет | — | Синхронно клонировать state, создать idle DataEntry, зарегистрировать resources/scope и dispatch initialize до рендера. |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>origin</code> | <code>Readonly&lt;ScopeOrigin&gt;</code> | Да | — | Необязательные observational метаданные outlet activation; не управляют runtime behavior. |
| <code>parentScope</code> | <code>RuntimeScope \| null</code> | Нет | — | Непосредственный родитель RuntimeScope; null только у приложения. |
| <code>parentScopeId</code> | <code>string \| null</code> | Нет | — | scopeId непосредственного родителя или null. |
| <code>schemaFragments</code> | <code>SchemaFragmentManager</code> | Нет | — | Принадлежащий этому scope SchemaFragmentManager для remote UI definitions. |
| <code>scope</code> | <code>Scope</code> | Нет | — | Legacy тег app/view/fragment, используемый reducer payloads; type использует application/view/fragment. |
| <code>scopeId</code> | <code>string</code> | Нет | — | Процессная identity definition.id:counter, не стабильный production/persistence ключ. Не парсить для бизнес-логики. |
| <code>signal</code> | <code>AbortSignal</code> | Нет | — | AbortSignal владельца; прерывается при dispose scope. |
| <code>start</code> | <code>() =&gt; void</code> | Нет | — | Один раз запустить onInit policy ресурсов активного владельца; не создавать отдельный store. |
| <code>stateDefinition</code> | <code>JsonObject</code> | Нет | — | Исходный шаблон локального состояния RuntimeScope. |
| <code>type</code> | <code>RuntimeScopeType</code> | Нет | — | Тип владельца: application/view/fragment. Legacy scope tag у приложения равен app. |
| <code>viewScope</code> | <code>RuntimeScope \| null</code> | Нет | — | Ближайшая owning View или null для application-owned дерева. |
| <code>viewScopeId</code> | <code>string \| null</code> | Нет | — | scopeId owning View или null. |

## RuntimeScopeDefinition

Источник: [src/runtime/shared/types.ts](../../src/runtime/shared/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actions</code> | <code>Record&lt;string, ActionDefinition&gt;</code> | Нет | — | Словарь локальных именованных действий; у sequence это упорядоченный массив имён. |
| <code>dataSources</code> | <code>Record&lt;string, DataSourceDefinition&gt;</code> | Нет | — | Словарь локальных источников данных либо принадлежащий scope DataSourceManager для API-контракта. |
| <code>id</code> | <code>string</code> | Нет | — | ID определения application/view; не сохраняемый instance identifier. |
| <code>initialState</code> | <code>JsonObject</code> | Нет | — | Шаблон локального состояния Application/View; клонируется при инициализации scope. |
| <code>schemaSources</code> | <code>Record&lt;     string,     import("../schema/types").SchemaSourceDefinition   &gt;</code> | Да | — | Необязательный словарь именованных источников UI-определений; inline source не требует регистрации. |

## RuntimeState

Источник: [src/runtime/shared/types.ts](../../src/runtime/shared/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>appData</code> | <code>Record&lt;string, DataEntry&gt;</code> | Нет | — | Словарь DataEntry application scope. |
| <code>applicationInstance</code> | <code>string \| null</code> | Нет | — | Текущий application scopeId; у SchemaFragmentCache до регистрации корня значение standalone. |
| <code>appState</code> | <code>StateObject</code> | Нет | — | Локальное состояние application scope в едином Redux store. |
| <code>fragments</code> | <code>Record&lt;     string,     { state: StateObject; data: Record&lt;string, DataEntry&gt; }   &gt;</code> | Нет | — | Словарь живых fragment scopeId → {state,data}; cache definitions находятся отдельно. |
| <code>schemaFragments</code> | <code>import("../schema/types").SchemaFragmentState</code> | Нет | — | Служебные состояния загрузки UI-определений; не публичный expression namespace. У scope API — его manager. |
| <code>viewData</code> | <code>Record&lt;string, DataEntry&gt;</code> | Нет | — | Словарь DataEntry активной View. |
| <code>viewInstance</code> | <code>string \| null</code> | Нет | — | scopeId активной View или null; guard устаревших записей. |
| <code>viewState</code> | <code>StateObject</code> | Нет | — | Состояние единственной активной View этого environment. |

## SchemaFragmentCache

Источник: [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>applicationInstance</code> | <code>string</code> | Нет | <code>"standalone"</code> | Текущий application scopeId; у SchemaFragmentCache до регистрации корня значение standalone. |
| <code>clear</code> | <code>() =&gt; void</code> | Нет | — | Удалить cache entries/statuses и прервать pending schema requests; вызывается при application disposal. |
| <code>clearView</code> | <code>(instance: string) =&gt; void</code> | Нет | — | Удалить schema resources с указанным cache owner; имя историческое, используется также для другого scope owner. |
| <code>constructor</code> | <code>(private readonly environment: RuntimeEnvironment)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>entries</code> | <code>Map&lt;string, CachedDefinition&gt;</code> | Нет | <code>new Map&lt;string, CachedDefinition&gt;()</code> | Map переиспользуемых JSON definitions, без state/controllers/scopes/closures. |
| <code>remove</code> | <code>(id: string) =&gt; void</code> | Нет | — | Отменить pending schema resource и удалить JSON/cache/status данного ключа; не прямая команда уничтожения произвольного live scope. |
| <code>requests</code> | <code>Map&lt;string, Acquisition&gt;</code> | Нет | <code>new Map&lt;string, Acquisition&gt;()</code> | Transient schema request coordination или список запросов tree projection; не definition cache. |

## SchemaFragmentEntry

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cache</code> | <code>DefinitionCachePolicy</code> | Нет | — | Legacy alias definitionCache у author source; в runtime entry нормализованная JSON-cache policy. |
| <code>error</code> | <code>string \| null</code> | Нет | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>key</code> | <code>FragmentKey</code> | Нет | — | Resolved scalar key родительского SchemaOutlet; default null. |
| <code>loading</code> | <code>boolean</code> | Нет | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>owner</code> | <code>string</code> | Нет | — | scopeId владельца JSON cache согласно policy; не обязательно requester/parent. |
| <code>requestIdentity</code> | <code>string</code> | Да | — | Сериализованный resolved request для контроля рекурсивной schema acquisition; не сохраняемый бизнес-ID. |
| <code>requestingScopeId</code> | <code>string</code> | Да | — | scopeId инициатора schema acquisition; может отличаться от cache owner. |
| <code>requestPath</code> | <code>string</code> | Нет | — | Уже вычисленный HTTP path приобретения UI-определения. |
| <code>schema</code> | <code>LoadedSchemaDefinition \| null</code> | Нет | — | JSON загруженного определения или null; не RuntimeScope/ReactElement. |
| <code>scope</code> | <code>Scope</code> | Нет | — | Legacy тег scope, инициировавшего schema resource; owner отдельно задаёт cache owner. |
| <code>source</code> | <code>string</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |
| <code>status</code> | <code>"loading" \| "success" \| "error"</code> | Нет | — | loading/success/error определения UI; idle/cancelled не значения этого контракта. |

## SchemaFragmentManager

Источник: [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>acquire</code> | <code>(source: SchemaSource, key: FragmentKey, validate: ValidateFragment, prepared?: PreparedSchemaRequest) =&gt; { id: string; promise: Promise&lt;void&gt;; release: () =&gt; void; }</code> | Нет | — | Приобрести lease определения, разделяя pending HTTP/JSON cache; release управляет числом consumers. |
| <code>constructor</code> | <code>(readonly definition: ScopeDefinition, readonly scope: Scope, readonly instance: string, private readonly environment: RuntimeEnvironment)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>definition</code> | <code>ScopeDefinition</code> | Нет | — | Определение владельца или результат parse/normalization; данные JSON отделены от live scope. |
| <code>dispose</code> | <code>() =&gt; void</code> | Нет | — | Идемпотентно завершить владение ресурсами; у RuntimeScope рекурсивно завершает потомков и удаляет их Redux entries. |
| <code>identity</code> | <code>(source: SchemaSource, key?: FragmentKey, state?: RuntimeState \| undefined) =&gt; string</code> | Нет | — | Вернуть prepare(...).id: составной JSON resource key; не scopeId живого экземпляра. |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>prepare</code> | <code>(source: SchemaSource, key?: FragmentKey, state?: RuntimeState) =&gt; PreparedSchemaRequest</code> | Нет | — | Чисто разрешить source/key/request по snapshot родителя, cache policy/owner и serialized resource identity. |
| <code>reload</code> | <code>(source: SchemaSource, key?: FragmentKey, validate?: ValidateFragment \| undefined, prepared?: PreparedSchemaRequest) =&gt; { id: string; promise: Promise&lt;void&gt;; release: () =&gt; void; }</code> | Нет | — | Удалить выбранный shared resource/cache generation и acquire заново; validator должен быть передан либо известен прошлому acquisition. |
| <code>scope</code> | <code>Scope</code> | Нет | — | RuntimeScope, legacy тег app/view/fragment или host/fragment discriminator результата нормализации; см. тип строки. |

## SchemaFragmentManager.Acquisition

Источник: [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>consumers</code> | <code>number</code> | Нет | — | Количество владельцев lease общего schema request. |
| <code>controller</code> | <code>AbortController</code> | Нет | — | Transient AbortController приобретения ресурса; не помещается в definition JSON/Redux. |
| <code>entry</code> | <code>SchemaFragmentEntry</code> | Нет | — | DataEntry/SchemaFragmentEntry данного ресурса; snapshot/plain JSON, не engine. |
| <code>metadata</code> | <code>TraceMetadata</code> | Нет | — | Снимок scope/request/schemaResource инициатора общего acquisition; не reusable schema JSON. |
| <code>promise</code> | <code>Promise&lt;void&gt;</code> | Нет | — | Promise окончания transient schema acquisition; не cached definition. |

## SchemaFragmentManager.CachedDefinition

Источник: [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cache</code> | <code>DefinitionCachePolicy</code> | Нет | — | Legacy alias definitionCache у author source; в runtime entry нормализованная JSON-cache policy. |
| <code>owner</code> | <code>string</code> | Нет | — | Владелец JSON-cache либо владелец бизнес-записи ReportDetail; эти сущности различаются типом. |
| <code>schema</code> | <code>LoadedSchemaDefinition</code> | Нет | — | JSON загруженного определения или null; не RuntimeScope/ReactElement. |

## SchemaIssue

Источник: [src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>column</code> | <code>number</code> | Да | — | Номер колонки parse error, если доступен. |
| <code>line</code> | <code>number</code> | Да | — | Номер строки parse error, если доступен из сообщения JSON parser. |
| <code>message</code> | <code>string</code> | Нет | — | Текст уведомления/результата. notification handler преобразует результат выражения в строку. |
| <code>stage</code> | <code>"parse" \| "validation"</code> | Нет | — | Этап ошибки parse либо validation. |

## SchemaOutletDefinition

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>enabled</code> | <code>import("../shared/json").Expression \| boolean</code> | Да | — | Boolean/выражение активации SchemaOutlet в scope родителя; по умолчанию true. |
| <code>key</code> | <code>FragmentKey \| import("../shared/json").Expression</code> | Да | — | Пользовательский scalar key outlet, полный tree key либо внутренний ключ — назначение уточняет контракт. |
| <code>source</code> | <code>SchemaSource</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |
| <code>type</code> | <code>"schema-outlet"</code> | Нет | — | Discriminator контракта или имя generic реализации; разрешённые литералы перечислены в типе. |

## SchemaRequestDefinition

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>body</code> | <code>JsonValue</code> | Да | — | JSON тело запроса; при наличии fetchTransport сериализует JSON и ставит Content-Type. |
| <code>method</code> | <code>"GET" \| "POST"</code> | Да | — | HTTP-метод; RequestDefinition требует его явно, schema/children source по умолчанию GET. |
| <code>path</code> | <code>string</code> | Нет | — | Путь запроса/маршрута либо массив сегментов scoped-адреса; тип различает эти контракты. |
| <code>query</code> | <code>JsonObject \| StateExpression</code> | Да | — | Query-параметры запроса; SchemaRequestDefinition также допускает StateExpression, возвращающее весь объект. Transport пропускает null/undefined/пустую строку и преобразует остальные значения String. |

## SchemaSourceDefinition

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>load</code> | <code>{ strategy: "onDemand" } &amp; DefinitionCacheSelection</code> | Нет | — | Политика lifecycle datasource или именованного schema source; см. strategy/reload/cache. |
| <code>request</code> | <code>SchemaRequestSource</code> | Нет | — | Object SchemaRequestDefinition либо StateExpression, возвращающее весь request. Во втором случае поля — уже буквальные данные инициатора. |

## SchemaSourceDefinition.load[1]

Источник: [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>strategy</code> | <code>"onDemand"</code> | Нет | — | Стартовая политика; допустимые значения зависят от datasource/scope или onDemand schema source. |

## ScopeActivation

Источник: [src/runtime/rendering/RuntimeScopeHost.tsx](../../src/runtime/rendering/RuntimeScopeHost.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>root</code> | <code>ComponentDefinition</code> | Нет | — | Корень дерева View/Fragment; не содержит route-outlet. |
| <code>scope</code> | <code>RuntimeScope</code> | Нет | — | Живой RuntimeScope, владение которым получает общий React host; не legacy строка app/view. |

## ScopeAddressContext

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>applicationScopeId</code> | <code>ScopeId</code> | Нет | — | scopeId owning application, общий для всех потомков. |
| <code>scopeId</code> | <code>ScopeId</code> | Нет | — | Уникальная identity живого scope внутри runtime; создаётся автоматически, не авторское поле JSON. |
| <code>viewScopeId</code> | <code>ScopeId \| null</code> | Нет | — | scopeId owning View или null. |

## ScopedChangedPath

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>area</code> | <code>'state' \| 'data'</code> | Нет | — | Часть адреса: state либо data. |
| <code>path</code> | <code>readonly string[]</code> | Нет | — | Путь запроса/маршрута либо массив сегментов scoped-адреса; тип различает эти контракты. |
| <code>scopeId</code> | <code>ScopeId</code> | Нет | — | Уникальная identity живого scope внутри runtime; создаётся автоматически, не авторское поле JSON. |

## ScopedExecutionContext

Источник: [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>scope</code> | <code>RuntimeScope</code> | Нет | — | Обязательный RuntimeScope generic handler; сохраняется во всех continuations. |

## ScopeOrigin

Источник: [src/runtime/shared/types.ts](../../src/runtime/shared/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cacheOwner</code> | <code>string</code> | Нет | — | scopeId владельца JSON definition cache, не runtime-родитель фрагмента. |
| <code>definitionCache</code> | <code>import("../schema/types").DefinitionCachePolicy</code> | Нет | — | Снимок policy JSON-кеша для tooling; сам не управляет retention. |
| <code>key</code> | <code>import("../schema/types").FragmentKey</code> | Нет | — | Снимок resolved пользовательского scalar key outlet. Не полный составной resource id. |
| <code>requestPath</code> | <code>string</code> | Нет | — | Уже вычисленный HTTP path приобретения UI-определения. |
| <code>scopeLifetime</code> | <code>import("../schema/types").FragmentScopeLifetime</code> | Нет | — | Снимок activation/outlet lifetime для tooling; сама lifecycle logic остаётся SchemaOutlet. |
| <code>source</code> | <code>string</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |

## SearchInputProps

Источник: [src/components/primitive/SearchInput.tsx](../../src/components/primitive/SearchInput.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Да | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |
| <code>onSearch</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Да | — | Нажатие Enter в SearchInput с payload {value:string}; запросов компонент не выполняет. |
| <code>placeholder</code> | <code>string</code> | Да | — | Подсказка пустого поля ввода. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## SelectOption

Источник: [src/components/primitive/Select.tsx](../../src/components/primitive/Select.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## SelectProps

Источник: [src/components/primitive/Select.tsx](../../src/components/primitive/Select.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |
| <code>options</code> | <code>SelectOption[]</code> | Нет | — | Список SelectOption: value/label/disabled. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## SidePanelProps

Источник: [src/components/layout/SidePanel.tsx](../../src/components/layout/SidePanel.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>description</code> | <code>string</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>onClose</code> | <code>()=&gt;void</code> | Да | — | Запрос закрытия панели без payload. Владелец должен обновить open/visibility. |
| <code>open</code> | <code>boolean</code> | Да | — | Контролируемая видимость панели/деталей; возврат null размонтирует её дочернее дерево. |
| <code>size</code> | <code>'medium'\|'wide'</code> | Да | — | Ширина SidePanel: medium/wide; не произвольный Fluent size. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## SplitLayoutProps

Источник: [src/components/layout/SplitLayout.tsx](../../src/components/layout/SplitLayout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>gap</code> | <code>number</code> | Да | — | Промежуток children в CSS pixels. |
| <code>ratio</code> | <code>'balanced' \| 'wide-left' \| 'wide-right'</code> | Да | — | Пропорции SplitLayout: balanced/wide-left/wide-right. |

## StackProps

Источник: [src/components/layout/Stack.tsx](../../src/components/layout/Stack.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>align</code> | <code>'start' \| 'center' \| 'stretch'</code> | Да | — | Выравнивание поперёк оси контейнера; разрешённые литералы см. тип. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |
| <code>gap</code> | <code>number</code> | Да | — | Промежуток children в CSS pixels. |

## StatePatch

Источник: [src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>scope</code> | <code>Scope</code> | Нет | — | Legacy scope address tag app/view/fragment; вместе с instance нужен reducer guard. |
| <code>target</code> | <code>string</code> | Да | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>value</code> | <code>StateObject</code> | Нет | — | Уже вычисленный shallow patch object, не deep merge/transaction. |

## StateUpdate

Источник: [src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>instance</code> | <code>string</code> | Нет | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>scope</code> | <code>Scope</code> | Нет | — | Legacy scope address tag app/view/fragment; вместе с instance нужен reducer guard. |
| <code>target</code> | <code>string</code> | Нет | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>value</code> | <code>unknown</code> | Нет | — | Уже вычисленное новое значение local state path, не повторно интерпретируемое выражение. |

## SuggestionCalloutProps

Источник: [src/components/layout/SuggestionCallout.tsx](../../src/components/layout/SuggestionCallout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>buttonLabel</code> | <code>string</code> | Да | — | Текст кнопки SuggestionCallout. |
| <code>description</code> | <code>string</code> | Нет | — | Поясняющий текст UI/бизнес-записи. |
| <code>note</code> | <code>string</code> | Да | — | Поясняющий текст callout. |
| <code>onAccept</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Принять предложенное значение: {value:suggestion}. |
| <code>suggestion</code> | <code>string</code> | Нет | — | Предлагаемое значение, передаваемое callback onAccept. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## SwitchProps

Источник: [src/components/primitive/Switch.tsx](../../src/components/primitive/Switch.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>checked</code> | <code>boolean</code> | Нет | — | Контролируемое boolean состояние Switch/Checkbox. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;boolean&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

## TextInputProps

Источник: [src/components/primitive/TextInput.tsx](../../src/components/primitive/TextInput.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |
| <code>placeholder</code> | <code>string</code> | Да | — | Подсказка пустого поля ввода. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## TextProps

Источник: [src/components/primitive/Text.tsx](../../src/components/primitive/Text.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>className</code> | <code>string</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## TitleProps

Источник: [src/components/primitive/Title.tsx](../../src/components/primitive/Title.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>level</code> | <code>1\|2\|3\|4</code> | Да | — | Семантический уровень заголовка Title: 1/2/3/4. |
| <code>subtitle</code> | <code>string</code> | Да | — | Дополнительная подпись под заголовком. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## TraceEntry

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>detail</code> | <code>string</code> | Да | — | Дополнительный диагностический текст. |
| <code>id</code> | <code>number</code> | Нет | — | Монотонный номер диагностического события в текущем Diagnostics; clear не сбрасывает счётчик. |
| <code>kind</code> | <code>'action' \| 'state' \| 'dependency' \| 'request' \| 'lifecycle' \| 'error'</code> | Нет | — | Категория диагностической записи: action/state/dependency/request/lifecycle/error. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>metadata</code> | <code>Readonly&lt;TraceMetadata&gt;</code> | Да | — | Отделённый снимок метаданных diagnostics; не используется для бизнес-управления. |
| <code>time</code> | <code>string</code> | Нет | — | Локальная строка времени диагностики, не UTC timestamp для persisted audit. |

## TraceMetadata

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>actionId</code> | <code>string</code> | Да | — | Имя выполненного действия в локальном actions. |
| <code>actionType</code> | <code>string</code> | Да | — | Generic тип action handler, отдельный от actionId. |
| <code>changedPaths</code> | <code>readonly StateExpression[]</code> | Да | — | Читаемая legacy-проекция namespace путей для diagnostics. |
| <code>datasourceId</code> | <code>string</code> | Да | — | Локальное имя datasource в диагностическом событии. |
| <code>debounceMs</code> | <code>number</code> | Да | — | Trailing debounce dependency reload, 0 по умолчанию; finite 0..2147483647 миллисекунд. |
| <code>event</code> | <code>'execute' \| 'resolved' \| 'stateChanged' \| 'dependencyChanged' \| 'debounced' \| 'loading' \| 'success' \| 'error' \| 'cancelled' \| 'invalidated' \| 'cacheHit'</code> | Да | — | Фаза diagnostic event из перечисленного union; не callback payload. |
| <code>instance</code> | <code>string</code> | Да | — | Совместимое имя scopeId в API/reducer/diagnostics. |
| <code>request</code> | <code>import('../datasource/types').RequestDefinition</code> | Да | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |
| <code>resource</code> | <code>{ scopeId: ScopeId; sourceId: string }</code> | Да | — | Composite identity datasource: scopeId/sourceId. |
| <code>schemaResource</code> | <code>{ id: string; source: string; key: import('../schema/types').FragmentKey; cache: import('../schema/types').DefinitionCachePolicy; owner: string }</code> | Да | — | Отдельная identity schema loading diagnostics: id/source/key/cache/owner. |
| <code>scope</code> | <code>Scope</code> | Да | — | Legacy тег app/view/fragment инициатора диагностического события. |
| <code>scopedChangedPaths</code> | <code>readonly ScopedChangedPath[]</code> | Да | — | Фактические изменённые адреса со scopeId/area/path. |
| <code>target</code> | <code>string</code> | Да | — | Относительный путь записи в текущее состояние. Namespace-префикс $ запрещён. |
| <code>value</code> | <code>unknown</code> | Да | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |
| <code>viewSchema</code> | <code>{ pathname: string }</code> | Да | — | Метаданные diagnostics для загрузки полной ViewDefinition. Отдельны от fragment schemaResource и datasource loading. |

## TraceMetadata.resource

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>scopeId</code> | <code>ScopeId</code> | Нет | — | Уникальная identity живого scope внутри runtime; создаётся автоматически, не авторское поле JSON. |
| <code>sourceId</code> | <code>string</code> | Нет | — | Локальное имя datasource; смысл существует вместе с scopeId. |

## TraceMetadata.schemaResource

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>cache</code> | <code>import('../schema/types').DefinitionCachePolicy</code> | Нет | — | Legacy alias definitionCache у author source; в runtime entry нормализованная JSON-cache policy. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>key</code> | <code>import('../schema/types').FragmentKey</code> | Нет | — | Пользовательский scalar key outlet, полный tree key либо внутренний ключ — назначение уточняет контракт. |
| <code>owner</code> | <code>string</code> | Нет | — | Владелец JSON-cache либо владелец бизнес-записи ReportDetail; эти сущности различаются типом. |
| <code>source</code> | <code>string</code> | Нет | — | Источник: expression у BindingDefinition, локальное имя datasource у action, имя/inline source у SchemaOutlet. Контекст определяет значение. |

## TraceMetadata.viewSchema

Источник: [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>pathname</code> | <code>string</code> | Нет | — | Browser pathname, включая hosting prefix, без query string/hash. Сервер сопоставляет его ViewDefinition. |

## TreeDataNode

Источник: [src/contracts/tree.ts](../../src/contracts/tree.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>childLinksSourceUrl</code> | <code>string</code> | Да | — | Guardian alias URL дочерних navigation DATA; относительный путь получает префикс /api/. |
| <code>children</code> | <code>TreeDataNode[]</code> | Да | — | Статические дочерние navigation DATA, alias/composition с links; не ComponentDefinition.children. |
| <code>childrenOrders</code> | <code>string[]</code> | Да | — | Порядок id дочерних DATA после merge/dedup; остальные идут в стабильном порядке. |
| <code>childrenSource</code> | <code>ChildrenSourceDefinition</code> | Да | — | Node-local request для navigation DATA, не UI schema. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>href</code> | <code>string</code> | Да | — | Адрес навигации; в backend data это строка. Проверка назначения/прав принадлежит host/backend. |
| <code>icon</code> | <code>string</code> | Да | — | Семантическое имя иконки адаптера; неизвестное имя использует fallback. |
| <code>id</code> | <code>string</code> | Нет | — | ID navigation DATA узла среди siblings; не ComponentDefinition.id и не scopeId. |
| <code>label</code> | <code>string</code> | Да | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>links</code> | <code>TreeDataNode[]</code> | Да | — | Статические дочерние navigation DATA; объединяются с children/remote. |
| <code>name</code> | <code>string</code> | Да | — | Отображаемое имя данных/параметра; у TreeDataNode используется label либо name. |

## TreeItem

Источник: [src/contracts/tree.ts](../../src/contracts/tree.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>TreeItem[]</code> | Нет | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>childrenError</code> | <code>string \| null</code> | Нет | — | Локальная ошибка загрузки navigation children или null. |
| <code>childrenLoading</code> | <code>boolean</code> | Нет | — | Загружаются ли дочерние navigation DATA. |
| <code>disabled</code> | <code>boolean</code> | Да | — | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>expandable</code> | <code>boolean</code> | Нет | — | Есть ли раскрываемые дети/source; вычисляется инфраструктурой. |
| <code>href</code> | <code>string</code> | Да | — | Адрес навигации; в backend data это строка. Проверка назначения/прав принадлежит host/backend. |
| <code>icon</code> | <code>string</code> | Да | — | Семантическое имя иконки адаптера; неизвестное имя использует fallback. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>key</code> | <code>string</code> | Нет | — | Полный канонический ключ раскрытия. Корневой id, для вложенного узла JSON.stringify ancestor id array. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |

## TreeProjection

Источник: [src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>TreeItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>requests</code> | <code>{ key: string; id: string; request: RequestDefinition }[]</code> | Нет | — | Transient schema request coordination или список запросов tree projection; не definition cache. |
| <code>requestsKey</code> | <code>string</code> | Нет | — | Fingerprint активных tree-data запросов для стабильных effect leases. |
| <code>signature</code> | <code>string</code> | Нет | — | Fingerprint подготовленной data-tree проекции для сравнения селекторов. |

## TreeProjection.requests[]

Источник: [src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>id</code> | <code>string</code> | Нет | — | Canonical inline DATA source id, вычисленный из resolved request. |
| <code>key</code> | <code>string</code> | Нет | — | Canonical key navigation узла, для которого нужен DATA request. |
| <code>request</code> | <code>RequestDefinition</code> | Нет | — | HTTP-конфигурация: method/path, параметры, query/body. Различия обработчиков URL описаны в data reference. |

## UserCardProps

Источник: [src/components/users/UserCard.tsx](../../src/components/users/UserCard.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>onMessage</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Да | — | Callback из data/UI контракта; точный payload указан в сигнатуре. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Да | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |
| <code>selected</code> | <code>boolean</code> | Да | — | Флаг визуального выделения карточки. |
| <code>user</code> | <code>UserSummary</code> | Нет | — | Объект пользователя по указанному UserSummary/ApplicationUser контракту. |

## UserListProps

Источник: [src/components/users/UserList.tsx](../../src/components/users/UserList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>error</code> | <code>string \| null</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>items</code> | <code>UserSummary[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>loading</code> | <code>boolean</code> | Да | — | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>onRetry</code> | <code>() =&gt; void</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |
| <code>onSelect</code> | <code>(event: UserSelection) =&gt; void</code> | Да | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |
| <code>selectedId</code> | <code>string \| null</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |

## UserSelection

Источник: [src/components/users/UserList.tsx](../../src/components/users/UserList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>user</code> | <code>UserSummary</code> | Нет | — | Объект пользователя по указанному UserSummary/ApplicationUser контракту. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## UserSummary

Источник: [src/contracts/users.ts](../../src/contracts/users.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>department</code> | <code>string</code> | Да | — | Название отдела пользователя. |
| <code>email</code> | <code>string</code> | Нет | — | Email пользователя для отображения. |
| <code>id</code> | <code>string</code> | Нет | — | Идентификатор записи/определения в указанном контракте. Не является автоматически runtime scopeId. |
| <code>initials</code> | <code>string</code> | Да | — | Инициалы avatar. |
| <code>location</code> | <code>string</code> | Да | — | Отображаемая локация пользователя. |
| <code>name</code> | <code>string</code> | Нет | — | Отображаемое имя данных/параметра; у TreeDataNode используется label либо name. |
| <code>role</code> | <code>string</code> | Нет | — | Роль пользователя для отображения; не enforcement разрешений. |
| <code>status</code> | <code>"active" \| "invited" \| "disabled"</code> | Нет | — | Состояние операции или бизнес-записи. Разрешённые значения перечислены в конкретном типе. |

## ValueChange

Источник: [src/components/types.ts](../../src/components/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>T</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |

## ViewDefinition

Источник: [src/runtime/view/types.ts](../../src/runtime/view/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>root</code> | <code>ComponentDefinition</code> | Нет | — | Корень дерева View/Fragment; не содержит route-outlet. |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |

## ViewDefinitionResult[1]

Источник: [src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>definition</code> | <code>ViewDefinition</code> | Нет | — | Определение владельца или результат parse/normalization; данные JSON отделены от live scope. |
| <code>ok</code> | <code>true</code> | Нет | — | Discriminator результата parseViewDefinition; true содержит definition, false содержит issue. |

## ViewDefinitionResult[2]

Источник: [src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>issue</code> | <code>SchemaIssue</code> | Нет | — | Ошибка parse/validation с message и возможной позицией. |
| <code>ok</code> | <code>false</code> | Нет | — | Discriminator результата parseViewDefinition; true содержит definition, false содержит issue. |

## ViewRuntime

Источник: [src/runtime/view/ViewRuntime.ts](../../src/runtime/view/ViewRuntime.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>constructor</code> | <code>(definition: ViewDefinition, environment: RuntimeEnvironment, parentScope?: RuntimeScope)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |

## ViewSchemaLease

Источник: [src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>promise</code> | <code>Promise&lt;ViewDefinition&gt;</code> | Нет | — | Promise окончания transient schema acquisition; не cached definition. |
| <code>release</code> | <code>() =&gt; void</code> | Нет | — | Идемпотентно освобождает consumer lease. Last release в microtask отменяет запрос и удаляет временную запись. |

## ViewSchemaLoader

Источник: [src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>acquire</code> | <code>(pathname: string, source: ViewSourceDefinition, scope: RuntimeScope, registry: ComponentRegistry, generation?: number, preparedRequest?: RequestDefinition \| undefined) =&gt; ViewSchemaLease</code> | Нет | — | Получает lease HTTP ViewDefinition по pathname и application scope. Dedup активных consumers; release отменяет последнего, generation задаёт retry. Store/RuntimeScope не создаёт. |
| <code>constructor</code> | <code>(private readonly views: Readonly&lt;Record&lt;string, ViewDefinition&gt;&gt;)</code> | Нет | — | Создать объект указанного класса. Аргументы и defaults приведены в сигнатуре; владение/инициализация описаны в runtime-layers. |
| <code>load</code> | <code>(viewId: string) =&gt; ViewDefinition</code> | Нет | — | Политика lifecycle datasource или именованного schema source; см. strategy/reload/cache. |
| <code>prepare</code> | <code>(pathname: string, source: ViewSourceDefinition, scope: RuntimeScope, state?: RuntimeState) =&gt; RequestDefinition</code> | Нет | — | Чисто вычислить resolved schema request, cache owner и resource identity по snapshot родителя. |

## ViewSchemaLoader.PendingView

Источник: [src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>consumers</code> | <code>number</code> | Нет | — | Количество владельцев lease общего schema request. |
| <code>controller</code> | <code>AbortController</code> | Нет | — | Transient AbortController приобретения ресурса; не помещается в definition JSON/Redux. |
| <code>promise</code> | <code>Promise&lt;ViewDefinition&gt;</code> | Нет | — | Promise окончания transient schema acquisition; не cached definition. |

## ViewSourceDefinition

Источник: [src/runtime/routing/types.ts](../../src/runtime/routing/types.ts).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>onLoaded</code> | <code>string</code> | Да | — | Имя локального application action после успешной загрузки/валидации View; payload содержит pathname, viewId и title. |
| <code>pathQueryParam</code> | <code>string</code> | Да | — | Имя query-параметра, куда loader помещает browser pathname. По умолчанию path; исходное query-значение с этим именем заменяется. |
| <code>request</code> | <code>SchemaRequestSource</code> | Нет | — | Object SchemaRequestDefinition либо StateExpression, возвращающее весь request. Во втором случае поля — уже буквальные данные инициатора. |

## Полные объявления типов и наследование

### SemanticIcon

[src/components/icons.tsx](../../src/components/icons.tsx)

~~~typescript
export type SemanticIcon = keyof typeof icons;
~~~

### DataSourceIdentity

[src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)

~~~typescript
export interface DataSourceIdentity {
  readonly scopeId: ScopeId;
  readonly sourceId: string;
}
~~~

### DependencyRegistration

[src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)

~~~typescript
export interface DependencyRegistration {
  readonly target: DataSourceIdentity;
  readonly paths: readonly ScopedChangedPath[];
}
~~~

### RequestDefinition

[src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)

~~~typescript
export interface RequestDefinition {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  params?: JsonObject;
  query?: JsonObject;
  body?: JsonValue;
}
~~~

### DataSourceDefinition

[src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)

~~~typescript
export interface DataSourceDefinition {
  type: "api";
  request: RequestDefinition;
  dependsOn?: StateExpression[];
  load: {
    strategy: "onViewInit" | "onAppInit" | "onScopeInit" | "manual";
    reload?: "onDependencyChange" | "manual";
    debounceMs?: number;
  };
}
~~~

### DataEntry

[src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)

~~~typescript
export interface DataEntry {
  status: "idle" | "loading" | "success" | "error";
  loading: boolean;
  data: unknown;
  error: string | null;
}
~~~

### DefinitionCachePolicy

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type DefinitionCachePolicy = "none" | "scope" | "view" | "application";
~~~

### DefinitionCacheSelection

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type DefinitionCacheSelection =
  | { definitionCache?: DefinitionCachePolicy; cache?: never }
  | { definitionCache?: never; cache?: DefinitionCachePolicy };
~~~

### SchemaRequestDefinition

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export interface SchemaRequestDefinition {
  method?: "GET" | "POST";
  path: string;
  query?: JsonObject | StateExpression;
  body?: JsonValue;
}
~~~

### SchemaRequestSource

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type SchemaRequestSource = SchemaRequestDefinition | StateExpression;
~~~

### SchemaSourceDefinition

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export interface SchemaSourceDefinition {
  request: SchemaRequestSource;
  load: { strategy: "onDemand" } & DefinitionCacheSelection;
}
~~~

### InlineSchemaSource

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type InlineSchemaSource = {
  request: SchemaRequestSource;
} & DefinitionCacheSelection;
~~~

### SchemaSource

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type SchemaSource = string | InlineSchemaSource;
~~~

### FragmentScopeLifetime

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type FragmentScopeLifetime = "activation" | "outlet";
~~~

### FragmentKey

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type FragmentKey = string | number | boolean | null;
~~~

### SchemaFragmentEntry

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export interface SchemaFragmentEntry {
  source: string;
  key: FragmentKey;
  scope: Scope;
  owner: string;
  /** Request origin, distinct from the definition cache owner. */
  requestingScopeId?: string;
  cache: DefinitionCachePolicy;
  status: "loading" | "success" | "error";
  loading: boolean;
  schema: LoadedSchemaDefinition | null;
  error: string | null;
  requestPath: string;
  /** Serializable resolved request fingerprint, never a live runtime handle. */
  requestIdentity?: string;
}
~~~

### SchemaFragmentState

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export type SchemaFragmentState = Record<string, SchemaFragmentEntry>;
~~~

### SchemaOutletDefinition

[src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)

~~~typescript
export interface SchemaOutletDefinition extends ComponentDefinition {
  type: "schema-outlet";
  source: SchemaSource;
  enabled?: import("../shared/json").Expression | boolean;
  key?: FragmentKey | import("../shared/json").Expression;
}
~~~

### JsonValue

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
~~~

### JsonObject

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type JsonObject = { [key: string]: JsonValue };
~~~

### StateObject

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type StateObject = Record<string, unknown>;
~~~

### RuntimeScopeType

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type RuntimeScopeType = 'application' | 'view' | 'fragment';
~~~

### ScopeId

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type ScopeId = string;
~~~

### ScopedChangedPath

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export interface ScopedChangedPath {
  readonly scopeId: ScopeId;
  readonly area: 'state' | 'data';
  readonly path: readonly string[];
}
~~~

### ScopeAddressContext

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export interface ScopeAddressContext {
  readonly scopeId: ScopeId;
  readonly applicationScopeId: ScopeId;
  readonly viewScopeId: ScopeId | null;
}
~~~

### Scope

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type Scope = 'app' | 'view' | 'fragment';
~~~

### StateExpressionRoot

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type StateExpressionRoot = '$appState' | '$appData' | '$viewState' | '$viewData' | '$state' | '$data';
~~~

### StateExpression

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type StateExpression = StateExpressionRoot | `${StateExpressionRoot}.${string}`;
~~~

### ExpressionRoot

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type ExpressionRoot = StateExpressionRoot | '$event' | '$response';
~~~

### Expression

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export type Expression = ExpressionRoot | `${ExpressionRoot}.${string}`;
~~~

### TraceMetadata

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export interface TraceMetadata {
  viewSchema?: { pathname: string };
  scope?: Scope;
  instance?: string;
  actionId?: string;
  actionType?: string;
  target?: string;
  value?: unknown;
  datasourceId?: string;
  request?: import('../datasource/types').RequestDefinition;
  schemaResource?: { id: string; source: string; key: import('../schema/types').FragmentKey; cache: import('../schema/types').DefinitionCachePolicy; owner: string };
  event?: 'execute' | 'resolved' | 'stateChanged' | 'dependencyChanged' | 'debounced' | 'loading' | 'success' | 'error' | 'cancelled' | 'invalidated' | 'cacheHit';
  changedPaths?: readonly StateExpression[];
  scopedChangedPaths?: readonly ScopedChangedPath[];
  resource?: { scopeId: ScopeId; sourceId: string };
  debounceMs?: number;
}
~~~

### TraceEntry

[src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)

~~~typescript
export interface TraceEntry {
  id: number;
  time: string;
  kind: 'action' | 'state' | 'dependency' | 'request' | 'lifecycle' | 'error';
  label: string;
  detail?: string;
  metadata?: Readonly<TraceMetadata>;
}
~~~

### BindingDefinition

[src/runtime/binding/types.ts](../../src/runtime/binding/types.ts)

~~~typescript
export interface BindingDefinition {
  source: Expression;
  default?: JsonValue;
}
~~~

### HandlerDefinition

[src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts)

~~~typescript
export interface HandlerDefinition {
  action: string;
}
~~~

### ComponentDefinition

[src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts)

~~~typescript
export interface ComponentDefinition {
  id: string;
  type: string;
  props?: JsonObject;
  bindings?: Record<string, Expression | BindingDefinition>;
  visibility?: Expression | boolean;
  handlers?: Record<string, HandlerDefinition>;
  children?: ComponentDefinition[];
  /** Infrastructure configuration, consumed only by registered schema-outlet. */
  source?: import("../schema/types").SchemaSource;
  lifecycle?: {
    scopeLifetime?: import("../schema/types").FragmentScopeLifetime;
  };
  enabled?: Expression | boolean;
  key?: import("../shared/json").JsonValue;
  loading?: ComponentDefinition;
  error?: ComponentDefinition;
}
~~~

### ActionDefinition

[src/runtime/actions/types.ts](../../src/runtime/actions/types.ts)

~~~typescript
export type ActionDefinition =
  | { type: "state.set"; target: string; value: JsonValue }
  | { type: "state.patch"; target?: string; value: JsonObject }
  | {
      type: "api.request";
      request: RequestDefinition;
      target?: string;
      onSuccess?: string;
      onError?: string;
    }
  | { type: "datasource.reload"; source: string }
  | { type: "datasource.invalidate"; source: string }
  | { type: "navigate"; to: string }
  | {
      type: "notification.show";
      message: string;
      tone?: "success" | "error" | "info";
    }
  | { type: "sequence"; actions: string[] };
~~~

### ExecutionContext

[src/runtime/actions/types.ts](../../src/runtime/actions/types.ts)

~~~typescript
export interface ExecutionContext {
  /** Omission uses this engine's owning scope for existing callers. */
  readonly scope?: RuntimeScope;
  event?: unknown;
  response?: unknown;
}
~~~

### ScopedExecutionContext

[src/runtime/actions/types.ts](../../src/runtime/actions/types.ts)

~~~typescript
export interface ScopedExecutionContext extends ExecutionContext {
  readonly scope: RuntimeScope;
}
~~~

### FragmentComponentDefinition

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export interface FragmentComponentDefinition extends Omit<
  ComponentDefinition,
  "id" | "children" | "loading" | "error"
> {
  id?: string;
  children?: FragmentComponentDefinition[];
  loading?: FragmentComponentDefinition;
  error?: FragmentComponentDefinition;
}
~~~

### FragmentDataSourceDefinition

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export interface FragmentDataSourceDefinition extends Omit<
  DataSourceDefinition,
  "load"
> {
  load: Omit<DataSourceDefinition["load"], "strategy"> & {
    strategy: "onInit" | "onScopeInit" | "manual";
  };
}
~~~

### FragmentDefinition

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export interface FragmentDefinition {
  type: "fragment";
  id?: string;
  state?: JsonObject;
  dataSources?: Record<string, FragmentDataSourceDefinition>;
  actions?: Record<string, ActionDefinition>;
  schemaSources?: Record<string, SchemaSourceDefinition>;
  root: FragmentComponentDefinition;
}
~~~

### NormalizedFragmentDefinition

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export interface NormalizedFragmentDefinition {
  type: "fragment";
  id: string;
  state: JsonObject;
  dataSources: Record<string, DataSourceDefinition>;
  actions: Record<string, ActionDefinition>;
  schemaSources?: Record<string, SchemaSourceDefinition>;
  root: ComponentDefinition;
}
~~~

### LoadedSchemaDefinition

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export type LoadedSchemaDefinition =
  | FragmentComponentDefinition
  | FragmentDefinition;
~~~

### NormalizedLoadedFragment

[src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)

~~~typescript
export interface NormalizedLoadedFragment {
  /** Legacy response wrappers retain the host's state/actions and create no scope. */
  scope: "host" | "fragment";
  definition: NormalizedFragmentDefinition;
}
~~~

### RouteDefinition

[src/runtime/routing/types.ts](../../src/runtime/routing/types.ts)

~~~typescript
export interface RouteDefinition {
  path: string;
  viewId: string;
}
~~~

### ViewSourceDefinition

[src/runtime/routing/types.ts](../../src/runtime/routing/types.ts)

~~~typescript
export interface ViewSourceDefinition {
  request: SchemaRequestSource;
  /** Application-local named action with {pathname, viewId, title}. */
  onLoaded?: string;
  /** Query parameter receiving the browser pathname. Defaults to path. */
  pathQueryParam?: string;
}
~~~

### ViewDefinition

[src/runtime/view/types.ts](../../src/runtime/view/types.ts)

~~~typescript
export interface ViewDefinition extends ScopeDefinition {
  title: string;
  root: ComponentDefinition;
}
~~~

### ApplicationDefinition

[src/runtime/application/types.ts](../../src/runtime/application/types.ts)

~~~typescript
export interface ApplicationDefinition extends ScopeDefinition {
  shell: ComponentDefinition;
  viewSource?: ViewSourceDefinition;
  routes: RouteDefinition[];
  views: Record<string, ViewDefinition>;
}
~~~

### RuntimeScopeDefinition

[src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)

~~~typescript
export interface RuntimeScopeDefinition {
  schemaSources?: Record<
    string,
    import("../schema/types").SchemaSourceDefinition
  >;
  id: string;
  initialState: JsonObject;
  dataSources: Record<string, DataSourceDefinition>;
  actions: Record<string, ActionDefinition>;
}
~~~

### ScopeDefinition

[src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)

~~~typescript
export type ScopeDefinition = RuntimeScopeDefinition;
~~~

### ScopeOrigin

[src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)

~~~typescript
export interface ScopeOrigin {
  readonly definitionCache: import("../schema/types").DefinitionCachePolicy;
  readonly scopeLifetime: import("../schema/types").FragmentScopeLifetime;
  readonly cacheOwner: string;
  readonly source: string;
  readonly key: import("../schema/types").FragmentKey;
  readonly requestPath: string;
}
~~~

### RuntimeState

[src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)

~~~typescript
export interface RuntimeState {
  fragments: Record<
    string,
    { state: StateObject; data: Record<string, DataEntry> }
  >;
  /** Internal application identity, mirroring the existing view guard. */
  applicationInstance: string | null;
  schemaFragments: import("../schema/types").SchemaFragmentState;
  appState: StateObject;
  appData: Record<string, DataEntry>;
  viewState: StateObject;
  viewData: Record<string, DataEntry>;
  viewInstance: string | null;
}
~~~

### ExpressionContext

[src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)

~~~typescript
export interface ExpressionContext {
  state: RuntimeState;
  /** Read roots from this scope's addresses in the supplied Redux snapshot. */
  scope?: import("./RuntimeScope").RuntimeScope;
  /** @deprecated Fragment-only address retained for Task 2 callers. Prefer scope. */
  scopeId?: string;
  event?: unknown;
  response?: unknown;
}
~~~

### RequestPolicy

[src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts)

~~~typescript
export interface RequestPolicy {
  readonly allowedPathPrefixes: readonly string[];
}
~~~

### StateUpdate

[src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts)

~~~typescript
export interface StateUpdate {
  scope: Scope;
  instance: string;
  target: string;
  value: unknown;
}
~~~

### StatePatch

[src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts)

~~~typescript
export interface StatePatch {
  scope: Scope;
  instance: string;
  target?: string;
  value: StateObject;
}
~~~

### RuntimeDependencyObserver

[src/runtime/redux/listenerMiddleware.ts](../../src/runtime/redux/listenerMiddleware.ts)

~~~typescript
export type RuntimeDependencyObserver = (
  changedPaths: readonly ScopedChangedPath[],
  previous: RuntimeState,
  current: RuntimeState,
) => void;
~~~

### RuntimeStore

[src/runtime/redux/createRuntimeStore.ts](../../src/runtime/redux/createRuntimeStore.ts)

~~~typescript
export type RuntimeStore = ReturnType<typeof createRuntimeStore>["store"];
~~~

### ApiTransport

[src/runtime/datasource/api.ts](../../src/runtime/datasource/api.ts)

~~~typescript
export type ApiTransport = (
  request: RequestDefinition,
  signal: AbortSignal,
) => Promise<unknown>;
~~~

### ActionServices

[src/runtime/actions/ActionServices.ts](../../src/runtime/actions/ActionServices.ts)

~~~typescript
export interface ActionServices {
  readonly runtimeScope: RuntimeScope;
  readonly scope: Scope;
  readonly instance: string;
  store: RuntimeStore;
  resolver: ExpressionResolver;
  dataSources: DataSourceManager;
  diagnostics: Diagnostics;
  transport: ApiTransport;
  navigate: (to: string) => void;
  notify: (message: string, tone: "success" | "error" | "info") => void;
  active: () => boolean;
  signal: AbortSignal;
}
~~~

### ActionType

[src/runtime/actions/ActionRegistry.ts](../../src/runtime/actions/ActionRegistry.ts)

~~~typescript
export type ActionType = ActionDefinition["type"];
~~~

### ActionHandler

[src/runtime/actions/ActionRegistry.ts](../../src/runtime/actions/ActionRegistry.ts)

~~~typescript
export type ActionHandler<K extends ActionType> = (
  definition: Extract<ActionDefinition, { type: K }>,
  context: ScopedExecutionContext,
  engine: ActionEngine,
  stack: string[],
) => void | Promise<void>;
~~~

### SchemaFragmentManager.ValidateFragment

[src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts)

~~~typescript
type ValidateFragment = (
  schema: unknown,
) => asserts schema is LoadedSchemaDefinition;
~~~

### SchemaFragmentManager.CachedDefinition

[src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts)

~~~typescript
interface CachedDefinition {
  owner: string;
  cache: DefinitionCachePolicy;
  schema: LoadedSchemaDefinition;
}
~~~

### SchemaFragmentManager.Acquisition

[src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts)

~~~typescript
interface Acquisition {
  controller: AbortController;
  promise: Promise<void>;
  consumers: number;
  metadata: TraceMetadata;
  entry: SchemaFragmentEntry;
}
~~~

### PreparedSchemaRequest

[src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts)

~~~typescript
export interface PreparedSchemaRequest {
  id: string;
  entry: SchemaFragmentEntry;
  request?: RequestDefinition;
  error?: string;
}
~~~

### ViewSchemaLease

[src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts)

~~~typescript
export interface ViewSchemaLease {
  promise: Promise<ViewDefinition>;
  release: () => void;
}
~~~

### ViewSchemaLoader.PendingView

[src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts)

~~~typescript
type PendingView = {
  promise: Promise<ViewDefinition>;
  controller: AbortController;
  consumers: number;
};
~~~

### FragmentRenderBoundary.Props

[src/runtime/schema/FragmentRenderBoundary.tsx](../../src/runtime/schema/FragmentRenderBoundary.tsx)

~~~typescript
interface Props {
  children: ReactNode;
  fallback: ReactNode;
  resetToken: unknown;
  onError: (error: Error) => void;
}
~~~

### BindingEngine.ReactiveDefinition

[src/runtime/binding/BindingEngine.ts](../../src/runtime/binding/BindingEngine.ts)

~~~typescript
type ReactiveDefinition = Pick<ComponentDefinition, "bindings" | "visibility">;
~~~

### ScopeActivation

[src/runtime/rendering/RuntimeScopeHost.tsx](../../src/runtime/rendering/RuntimeScopeHost.tsx)

~~~typescript
export interface ScopeActivation {
  scope: RuntimeScope;
  root: ComponentDefinition;
}
~~~

### ChildrenSourceDefinition

[src/contracts/tree.ts](../../src/contracts/tree.ts)

~~~typescript
export interface ChildrenSourceDefinition {
  request: {
    method?: "GET" | "POST";
    path: string;
    query?: JsonObject;
    body?: JsonValue;
  };
  /** Omit for {items: [...]}; use an empty string for a bare array. */
  itemsPath?: string;
}
~~~

### TreeDataNode

[src/contracts/tree.ts](../../src/contracts/tree.ts)

~~~typescript
export interface TreeDataNode {
  id: string;
  name?: string;
  label?: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  links?: TreeDataNode[];
  children?: TreeDataNode[];
  childLinksSourceUrl?: string;
  childrenSource?: ChildrenSourceDefinition;
  childrenOrders?: string[];
}
~~~

### TreeItem

[src/contracts/tree.ts](../../src/contracts/tree.ts)

~~~typescript
export interface TreeItem {
  id: string;
  key: string;
  label: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  children: TreeItem[];
  expandable: boolean;
  childrenLoading: boolean;
  childrenError: string | null;
}
~~~

### TreeProjection

[src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts)

~~~typescript
export interface TreeProjection {
  items: TreeItem[];
  requests: { key: string; id: string; request: RequestDefinition }[];
  requestsKey: string;
  signature: string;
}
~~~

### DataTreeRuntime.Props

[src/runtime/data-tree/DataTreeRuntime.tsx](../../src/runtime/data-tree/DataTreeRuntime.tsx)

~~~typescript
interface Props {
  component: string;
  items?: unknown;
  expandedIds?: string[];
  error?: string | null;
  [prop: string]: unknown;
}
~~~

### ButtonProps

[src/components/primitive/Button.tsx](../../src/components/primitive/Button.tsx)

~~~typescript
export interface ButtonProps { label:string; disabled?:boolean; variant?:'primary'|'secondary'|'ghost'; onClick:()=>void }
~~~

### ValueChange

[src/components/types.ts](../../src/components/types.ts)

~~~typescript
export interface ValueChange<T> { value: T }
~~~

### ValueChangeCallback

[src/components/types.ts](../../src/components/types.ts)

~~~typescript
export type ValueChangeCallback<T> = (event: ValueChange<T>) => void;
~~~

### TextInputProps

[src/components/primitive/TextInput.tsx](../../src/components/primitive/TextInput.tsx)

~~~typescript
export interface TextInputProps { label:string;value:string;placeholder?:string;disabled?:boolean;onChange:ValueChangeCallback<string> }
~~~

### SearchInputProps

[src/components/primitive/SearchInput.tsx](../../src/components/primitive/SearchInput.tsx)

~~~typescript
export interface SearchInputProps { value:string;label?:string;placeholder?:string;disabled?:boolean;onChange:ValueChangeCallback<string>;onSearch?:ValueChangeCallback<string> }
~~~

### SelectOption

[src/components/primitive/Select.tsx](../../src/components/primitive/Select.tsx)

~~~typescript
export interface SelectOption {value:string;label:string;disabled?:boolean}
~~~

### SelectProps

[src/components/primitive/Select.tsx](../../src/components/primitive/Select.tsx)

~~~typescript
export interface SelectProps {label:string;options:SelectOption[];value:string;disabled?:boolean;onChange:ValueChangeCallback<string>}
~~~

### SwitchProps

[src/components/primitive/Switch.tsx](../../src/components/primitive/Switch.tsx)

~~~typescript
export interface SwitchProps {label:string;checked:boolean;disabled?:boolean;onChange:ValueChangeCallback<boolean>}
~~~

### CheckboxProps

[src/components/primitive/Checkbox.tsx](../../src/components/primitive/Checkbox.tsx)

~~~typescript
export interface CheckboxProps {label:string;checked:boolean;disabled?:boolean;onChange:ValueChangeCallback<boolean>}
~~~

### TextProps

[src/components/primitive/Text.tsx](../../src/components/primitive/Text.tsx)

~~~typescript
export interface TextProps {value:string;className?:string}
~~~

### TitleProps

[src/components/primitive/Title.tsx](../../src/components/primitive/Title.tsx)

~~~typescript
export interface TitleProps {value:string;level?:1|2|3|4;subtitle?:string}
~~~

### CardProps

[src/components/layout/Card.tsx](../../src/components/layout/Card.tsx)

~~~typescript
export interface CardProps {title?:string;description?:string;children?:ReactNode;className?:string}
~~~

### StackProps

[src/components/layout/Stack.tsx](../../src/components/layout/Stack.tsx)

~~~typescript
export interface StackProps { gap?: number; align?: 'start' | 'center' | 'stretch'; children?: ReactNode; className?: string }
~~~

### RowProps

[src/components/layout/Row.tsx](../../src/components/layout/Row.tsx)

~~~typescript
export interface RowProps { gap?: number; align?: 'start' | 'center' | 'stretch'; justify?: 'start' | 'center' | 'between'; wrap?: boolean; children?: ReactNode; className?: string }
~~~

### PageProps

[src/components/layout/Page.tsx](../../src/components/layout/Page.tsx)

~~~typescript
export interface PageProps { children?: ReactNode; className?: string }
~~~

### PageHeaderProps

[src/components/layout/PageHeader.tsx](../../src/components/layout/PageHeader.tsx)

~~~typescript
export interface PageHeaderProps {title:string;description?:string;eyebrow?:string;children?:ReactNode}
~~~

### SplitLayoutProps

[src/components/layout/SplitLayout.tsx](../../src/components/layout/SplitLayout.tsx)

~~~typescript
export interface SplitLayoutProps { ratio?: 'balanced' | 'wide-left' | 'wide-right'; gap?: number; children?: ReactNode }
~~~

### SidePanelProps

[src/components/layout/SidePanel.tsx](../../src/components/layout/SidePanel.tsx)

~~~typescript
export interface SidePanelProps {title:string;description?:string;size?:'medium'|'wide';open?:boolean;children?:ReactNode;onClose?:()=>void}
~~~

### NavigationItem

[src/components/navigation/GenericNavigation.tsx](../../src/components/navigation/GenericNavigation.tsx)

~~~typescript
export interface NavigationItem {id:string;label:string;description?:string;count?:number;disabled?:boolean}
~~~

### GenericNavigationProps

[src/components/navigation/GenericNavigation.tsx](../../src/components/navigation/GenericNavigation.tsx)

~~~typescript
export interface GenericNavigationProps {items:NavigationItem[];selectedId?:string|null;loading?:boolean;orientation?:'vertical'|'horizontal';label?:string;onSelect:ValueChangeCallback<string>}
~~~

### ListItem

[src/components/navigation/GenericList.tsx](../../src/components/navigation/GenericList.tsx)

~~~typescript
export interface ListItem {id:string;title:string;description?:string;meta?:string;disabled?:boolean}
~~~

### GenericListProps

[src/components/navigation/GenericList.tsx](../../src/components/navigation/GenericList.tsx)

~~~typescript
export interface GenericListProps {items:ListItem[];selectedId?:string|null;loading?:boolean;emptyMessage?:string;label?:string;onSelect?:ValueChangeCallback<string>}
~~~

### ReportSummary

[src/contracts/reporting.ts](../../src/contracts/reporting.ts)

~~~typescript
export interface ReportSummary {
  id: string;
  title: string;
  description: string;
  module: string;
  status: "published" | "draft";
  updatedAt: string;
  frameworks?: string[];
  reportType?: string;
  coverage?: string;
  scope?: string;
  saved?: boolean;
}
~~~

### ReportDetail

[src/contracts/reporting.ts](../../src/contracts/reporting.ts)

~~~typescript
export interface ReportDetail extends ReportSummary {
  owner: string;
  parameters: { name: string; value: string }[];
  controls: string[];
  lastRun: string | null;
}
~~~

### ReportRunResult

[src/contracts/reporting.ts](../../src/contracts/reporting.ts)

~~~typescript
export interface ReportRunResult {
  id: string;
  reportId: string;
  status: "completed";
  completedAt: string;
  rowCount: number;
  message: string;
}
~~~

### ReportCardProps

[src/components/reporting/ReportCard.tsx](../../src/components/reporting/ReportCard.tsx)

~~~typescript
export interface ReportCardProps {report:ReportSummary;selected?:boolean;openLabel?:string;onOpen?:ValueChangeCallback<string>}
~~~

### UserSummary

[src/contracts/users.ts](../../src/contracts/users.ts)

~~~typescript
export interface UserSummary {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "invited" | "disabled";
  initials?: string;
  department?: string;
  location?: string;
}
~~~

### UserCardProps

[src/components/users/UserCard.tsx](../../src/components/users/UserCard.tsx)

~~~typescript
export interface UserCardProps {user:UserSummary;selected?:boolean;onSelect?:ValueChangeCallback<string>;onMessage?:ValueChangeCallback<string>}
~~~

### ApplicationShellProps

[src/components/application/ApplicationShell.tsx](../../src/components/application/ApplicationShell.tsx)

~~~typescript
export interface ApplicationShellProps { children?: ReactNode; navigationCollapsed?: boolean }
~~~

### ApplicationNavigationItem

[src/contracts/application.ts](../../src/contracts/application.ts)

~~~typescript
export interface ApplicationNavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  depth?: number;
  disabled?: boolean;
  key?: string;
  children?: ApplicationNavigationItem[];
  expandable?: boolean;
  childrenLoading?: boolean;
  childrenError?: string | null;
}
~~~

### ApplicationUser

[src/contracts/application.ts](../../src/contracts/application.ts)

~~~typescript
export interface ApplicationUser {
  name: string;
  initials: string;
  role: string;
}
~~~

### ApplicationHeaderProps

[src/components/application/ApplicationHeader.tsx](../../src/components/application/ApplicationHeader.tsx)

~~~typescript
export interface ApplicationHeaderProps {brand:string;breadcrumbs:string[];user?:ApplicationUser|null;navigationCollapsed?:boolean;onToggleNavigation?:ValueChangeCallback<boolean>}
~~~

### PrimaryNavigationProps

[src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx)

~~~typescript
export interface PrimaryNavigationProps {
  children?: ReactNode;
  caption?: string;
  footerText?: string;
  items: ApplicationNavigationItem[];
  selectedId?: string;
  selectedHref?: string;
  expandedIds?: string[];
  loading?: boolean;
  error?: string | null;
  onSelect: (event: { value: string; href: string }) => void;
  onExpandedChange?: (event: { value: string[] }) => void;
  onRetry?: () => void;
  onRetryChildren?: (event: { value: string }) => void;
}
~~~

### CatalogLayoutProps

[src/components/layout/CatalogLayout.tsx](../../src/components/layout/CatalogLayout.tsx)

~~~typescript
export interface CatalogLayoutProps { children?: ReactNode }
~~~

### SuggestionCalloutProps

[src/components/layout/SuggestionCallout.tsx](../../src/components/layout/SuggestionCallout.tsx)

~~~typescript
export interface SuggestionCalloutProps {title:string;description:string;suggestion:string;buttonLabel?:string;note?:string;onAccept:ValueChangeCallback<string>}
~~~

### ReportListProps

[src/components/reporting/ReportList.tsx](../../src/components/reporting/ReportList.tsx)

~~~typescript
export interface ReportListProps {
  items: ReportSummary[]; loading?: boolean; error?: string | null; selectedId?: string | null;
  onOpen: ValueChangeCallback<string>; onRetry?: () => void;
}
~~~

### ReportDetailsProps

[src/components/reporting/ReportDetails.tsx](../../src/components/reporting/ReportDetails.tsx)

~~~typescript
export interface ReportDetailsProps {
  report?: ReportDetail | null; open?: boolean; loading?: boolean; error?: string | null; running?: boolean; lastRun?: ReportRunResult | null;
  onClose: () => void; onRun: ValueChangeCallback<string>; onRetry?: () => void;
}
~~~

### UserSelection

[src/components/users/UserList.tsx](../../src/components/users/UserList.tsx)

~~~typescript
export interface UserSelection { value: string; user: UserSummary }
~~~

### UserListProps

[src/components/users/UserList.tsx](../../src/components/users/UserList.tsx)

~~~typescript
export interface UserListProps {
  items: UserSummary[]; loading?: boolean; error?: string | null; selectedId?: string | null;
  onSelect?: (event: UserSelection) => void; onRetry?: () => void;
}
~~~

### ComponentSchemaType

[src/components/registry.ts](../../src/components/registry.ts)

~~~typescript
export type ComponentSchemaType = keyof typeof sharedComponents;
~~~

### SchemaIssue

[src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts)

~~~typescript
export interface SchemaIssue {
  stage: "parse" | "validation";
  message: string;
  line?: number;
  column?: number;
}
~~~

### ViewDefinitionResult

[src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts)

~~~typescript
export type ViewDefinitionResult =
  | { ok: true; definition: ViewDefinition }
  | { ok: false; issue: SchemaIssue };
~~~

## Экспортируемые runtime функции

### pathParts

Разбить dotted path; отвергнуть пустые/unsafe prototype сегменты.

[src/runtime/binding/paths.ts](../../src/runtime/binding/paths.ts)

~~~typescript
(path: string) => string[]
~~~

### getPath

Own-property чтение; missing/intermediate null даёт undefined.

[src/runtime/binding/paths.ts](../../src/runtime/binding/paths.ts)

~~~typescript
(value: unknown, path: string) => unknown
~~~

### setPath

Записать relative path с созданием промежуточных объектов.

[src/runtime/binding/paths.ts](../../src/runtime/binding/paths.ts)

~~~typescript
(object: Record<string, unknown>, path: string, value: unknown) => void
~~~

### resolveScopePath

Разрешить namespace в canonical scopeId/area/path по owning references.

[src/runtime/shared/scopeAddress.ts](../../src/runtime/shared/scopeAddress.ts)

~~~typescript
(expression: StateExpression, scope: ScopeAddressContext) => ScopedChangedPath | undefined
~~~

### readScopedPath

Прочитать canonical address из переданного Redux snapshot.

[src/runtime/shared/scopeAddress.ts](../../src/runtime/shared/scopeAddress.ts)

~~~typescript
(state: RuntimeState, address: ScopedChangedPath) => unknown
~~~

### resolveRequestPath

Подставить request.params в {name}, encodeURIComponent значения сегмента.

[src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts)

~~~typescript
(request: RequestDefinition) => string
~~~

### validateRequestPath

Проверить нормализованный локальный URL и host allowedPathPrefixes; без оценки schema expressions.

[src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts)

~~~typescript
(path: unknown, policy?: RequestPolicy) => asserts path is string
~~~

### assertLocalStateTarget

Запретить namespace-prefixed/unsafe targets, разрешить relative dotted path.

[src/runtime/actions/handlers/stateTarget.ts](../../src/runtime/actions/handlers/stateTarget.ts)

~~~typescript
(target: string) => void
~~~

### jsonLiteral

Проверить plain finite JSON, accessors/cycles/depth/prototype paths.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, label: string, ancestors?: Set<object>, depth?: number) => void
~~~

### validateRequest

Проверить author declaration method/local path/query/params/body expressions; schemaExpressions допускает whole path/query binding. Host prefix policy применяется к resolved URL.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, schemaExpressions?: boolean) => void
~~~

### validateResolvedRequest

Проверить method/path/query/params shape и host URL policy после resolve; значения query/body остаются буквальными данными.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, policy?: RequestPolicy) => void
~~~

### validateSchemaSource

Проверить named/inline source policies, GET/POST и ограничения owning scope.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, scope: "app" | "view" | "fragment", inline?: boolean) => void
~~~

### validateScope

Проверить common state/actions/dataSources/sources, references/action/resource cycles.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, scope: "app" | "view" | "fragment") => asserts value is RuntimeScopeDefinition
~~~

### validateTree

Проверить общий component tree/registry/actions/expressions/outlet; не все public props shapes.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(root: unknown, scope: RuntimeScopeDefinition, registry: ComponentRegistry, allowOutlet: boolean) => number
~~~

### validateViewDefinition

Проверить View scope, title/root и запрет route-outlet в View.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, registry: ComponentRegistry) => asserts value is ViewDefinition
~~~

### validateApplicationDefinition

Проверить app scope, ровно один route-outlet, route references и Views.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: ApplicationDefinition, registry: ComponentRegistry) => void
~~~

### validateFragment

Историческая bare component tree validation с готовыми ids; новые remote responses используют normalizer.

[src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)

~~~typescript
(value: unknown, scope: RuntimeScopeDefinition, registry: ComponentRegistry) => asserts value is ComponentDefinition
~~~

### resolveSchemaRequest

Разрешить object-template либо whole-request StateExpression в scope; GET/POST, query/body, строгие поля и host policy. Whole binding не интерпретируется повторно.

[src/runtime/schema/resolveSchemaRequest.ts](../../src/runtime/schema/resolveSchemaRequest.ts)

~~~typescript
(source: SchemaRequestSource, resolver: ExpressionResolver, context: ExpressionContext, policy?: RequestPolicy) => RequestDefinition
~~~

### patchState

Поверхностно объединить root/target, без deep merge.

[src/runtime/redux/patchState.ts](../../src/runtime/redux/patchState.ts)

~~~typescript
(root: StateObject, patch: StatePatch) => StateObject
~~~

### getChangedPaths

Сравнить snapshots и вернуть scope-qualified changes, включая init/dispose.

[src/runtime/redux/changedPaths.ts](../../src/runtime/redux/changedPaths.ts)

~~~typescript
(previous: RuntimeState, current: RuntimeState) => ScopedChangedPath[]
~~~

### createRuntimeListenerMiddleware

Создать Redux listener, передающий changed paths/previous/current observer.

[src/runtime/redux/listenerMiddleware.ts](../../src/runtime/redux/listenerMiddleware.ts)

~~~typescript
(observer?: RuntimeDependencyObserver | undefined) => ListenerMiddlewareInstance<RuntimeState, ThunkDispatch<RuntimeState, unknown, UnknownAction>, unknown>
~~~

### createRuntimeStore

Собрать один guarded Redux store и listener для environment.

[src/runtime/redux/createRuntimeStore.ts](../../src/runtime/redux/createRuntimeStore.ts)

~~~typescript
(observer?: RuntimeDependencyObserver | undefined) => { store: EnhancedStore<RuntimeState, UnknownAction, Tuple<[StoreEnhancer<{ dispatch: ((action: Action<"listenerMiddleware/add">) => UnsubscribeListener) & ThunkDispatch<RuntimeState, undefined, UnknownAction>; }>, StoreEnhancer]>>; listener: ListenerMiddlewareInstance<RuntimeState, ThunkDispatch<RuntimeState, unknown, UnknownAction>, unknown>; }
~~~

### diagnosticDetail

Безопасно сериализовать значение для диагностического текста.

[src/runtime/shared/Diagnostics.ts](../../src/runtime/shared/Diagnostics.ts)

~~~typescript
(value: unknown) => string | undefined
~~~

### createFetchTransport

Создать browser JSON transport с той же host URL policy, что используется runtime до вызова custom transport.

[src/runtime/datasource/api.ts](../../src/runtime/datasource/api.ts)

~~~typescript
(policy?: RequestPolicy) => ApiTransport
~~~

### createActionRegistry

Зарегистрировать восемь встроенных generic action handler типов.

[src/runtime/actions/createActionRegistry.ts](../../src/runtime/actions/createActionRegistry.ts)

~~~typescript
() => ActionRegistry
~~~

### RuntimeScopeHost

Общий ownership/render bridge View/Fragment: readiness/start/cleanup/StrictMode microtask.

[src/runtime/rendering/RuntimeScopeHost.tsx](../../src/runtime/rendering/RuntimeScopeHost.tsx)

~~~typescript
({ create, registry, visible, }: { create: () => ScopeActivation; registry: ComponentRegistry; visible?: boolean | undefined; }) => Element | null
~~~

### ViewRuntimeHost

Создать ViewRuntime через общий host и передать root.

[src/runtime/view/ViewRuntimeHost.tsx](../../src/runtime/view/ViewRuntimeHost.tsx)

~~~typescript
({ definition, environment, registry, }: { definition: ViewDefinition; environment: RuntimeEnvironment; registry: ComponentRegistry; }) => Element
~~~

### RouteOutlet

Рендерить routes/fallback из RouteRuntimeContext, меняя View activation identity.

[src/runtime/routing/RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx)

~~~typescript
() => Element | null
~~~

### registerRouteOutlet

Добавить route-outlet в переданный ComponentRegistry.

[src/runtime/routing/RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx)

~~~typescript
(registry: ComponentRegistry) => ComponentRegistry
~~~

### readTreeNodes

Проверить plain navigation DATA shape/depth/nodes/node-local requests.

[src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts)

~~~typescript
(value: unknown) => TreeDataNode[]
~~~

### mergeTreeNodes

Слить static/remote DATA по id с remote overrides и explicit order.

[src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts)

~~~typescript
(staticItems: readonly TreeDataNode[], remoteItems: readonly TreeDataNode[], order?: readonly string[]) => TreeDataNode[]
~~~

### projectDataTree

Создать prepared props/requests/signature по expanded keys и local DATA.

[src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts)

~~~typescript
(items: TreeDataNode[], expandedIds: readonly string[], data: Record<string, DataEntry>, resolver: ExpressionResolver, context: ExpressionContext, policy?: RequestPolicy) => TreeProjection
~~~

### DataTreeRuntime

Подключить DATA selectors/leases к известному target adapter.

[src/runtime/data-tree/DataTreeRuntime.tsx](../../src/runtime/data-tree/DataTreeRuntime.tsx)

~~~typescript
({ component, items, expandedIds, error, ...props }: Props) => Element
~~~

### normalizeFragmentDefinition

Проверить explicit envelope, применить defaults/onInit/id normalization.

[src/runtime/fragment/normalizeFragmentDefinition.ts](../../src/runtime/fragment/normalizeFragmentDefinition.ts)

~~~typescript
(value: unknown, registry: ComponentRegistry) => NormalizedFragmentDefinition
~~~

### normalizeLoadedFragment

Различить explicit fragment scope и legacy host tree.

[src/runtime/fragment/normalizeFragmentDefinition.ts](../../src/runtime/fragment/normalizeFragmentDefinition.ts)

~~~typescript
(value: unknown, host: RuntimeScopeDefinition, registry: ComponentRegistry) => NormalizedLoadedFragment
~~~

### validateLoadedFragment

Проверить неизвестный remote response через общий normalizer.

[src/runtime/fragment/normalizeFragmentDefinition.ts](../../src/runtime/fragment/normalizeFragmentDefinition.ts)

~~~typescript
(value: unknown, host: RuntimeScopeDefinition, registry: ComponentRegistry) => asserts value is LoadedSchemaDefinition
~~~

### validateFragmentDefinition

Проверить explicit FragmentDefinition через normalizer.

[src/runtime/fragment/normalizeFragmentDefinition.ts](../../src/runtime/fragment/normalizeFragmentDefinition.ts)

~~~typescript
(value: unknown, registry: ComponentRegistry) => asserts value is FragmentDefinition
~~~

### FragmentRuntimeHost

Связать normalized fragment/parent/registry с общим RuntimeScopeHost.

[src/runtime/fragment/FragmentRuntimeHost.tsx](../../src/runtime/fragment/FragmentRuntimeHost.tsx)

~~~typescript
({ definition, parent, registry, visible, origin, }: { definition: NormalizedFragmentDefinition; parent: RuntimeScope; registry: ComponentRegistry; visible?: boolean | undefined; origin?: Readonly<ScopeOrigin> | undefined; }) => Element
~~~

### SchemaOutlet

Приобрести UI JSON, управлять activation/retention/retry/nesting в parent context.

[src/runtime/schema/SchemaOutlet.tsx](../../src/runtime/schema/SchemaOutlet.tsx)

~~~typescript
() => Element | null
~~~

### registerSchemaOutlet

Добавить schema-outlet infrastructure component в registry.

[src/runtime/schema/SchemaOutlet.tsx](../../src/runtime/schema/SchemaOutlet.tsx)

~~~typescript
(registry: ComponentRegistry) => ComponentRegistry
~~~

### jsonSyntaxIssue

Преобразовать parser error в stage/message и доступные line/column.

[src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts)

~~~typescript
(error: unknown, source: string) => SchemaIssue
~~~

### parseViewDefinition

JSON.parse + runtime View validation; вернуть discriminated result, не бросать ожидаемые input ошибки.

[src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts)

~~~typescript
(source: string, registry: ComponentRegistry) => ViewDefinitionResult
~~~

## Экспортируемые runtime значения и React contexts

### defaultRequestPolicy

Замороженная совместимая demo host policy: allowedPathPrefixes=["/api/"]. Не входит в JSON definition.

[src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts)

~~~typescript
RequestPolicy
~~~

### schemaFragmentSlice

Internal schema status slice: changed/removed, без публичного expression namespace.

[src/runtime/schema/schemaFragmentSlice.ts](../../src/runtime/schema/schemaFragmentSlice.ts)

~~~typescript
Slice$1<SchemaFragmentState, { changed(state: WritableNonArrayDraft<SchemaFragmentState>, { payload }: { payload: { id: string; entry: SchemaFragmentEntry; }; type: string; }): void; removed(state: WritableNonArrayDraft<SchemaFragmentState>, { payload }: { payload: string; type: string; }): void; }, "schemaFragments", "schemaFragments", SliceSelectors<SchemaFragmentState>>
~~~

### runtimeActions

Generic Redux action creators; payload каждого описан в runtime-layers. Не author action names.

[src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts)

~~~typescript
{ initialize: ActionCreatorWithPayload<{ scope: Scope; instance: string; initialState: StateObject; data: Record<string, DataEntry>; }, string>; disposeScope: ActionCreatorWithPayload<{ scope: Scope; instance: string; }, string>; disposeView: ActionCreatorWithPayload<string, string>; set: ActionCreatorWithPayload<StateUpdate, string>; patch: ActionCreatorWithPayload<StatePatch, string>; dataChanged: ActionCreatorWithPayload<{ scope: Scope; instance: string; id: string; entry: DataEntry; }, string>; }
~~~

### appStateSlice

Reducer application state для generic scope actions.

[src/runtime/redux/appStateSlice.ts](../../src/runtime/redux/appStateSlice.ts)

~~~typescript
Slice$1<StateObject, {}, "appState", "appState", SliceSelectors<StateObject>>
~~~

### appDataSlice

Reducer application DATA dictionary.

[src/runtime/redux/appDataSlice.ts](../../src/runtime/redux/appDataSlice.ts)

~~~typescript
Slice$1<Record<string, DataEntry>, {}, "appData", "appData", SliceSelectors<Record<string, DataEntry>>>
~~~

### viewStateSlice

Reducer единственной active View state.

[src/runtime/redux/viewStateSlice.ts](../../src/runtime/redux/viewStateSlice.ts)

~~~typescript
Slice$1<StateObject, {}, "viewState", "viewState", SliceSelectors<StateObject>>
~~~

### viewDataSlice

Reducer active View DATA dictionary.

[src/runtime/redux/viewDataSlice.ts](../../src/runtime/redux/viewDataSlice.ts)

~~~typescript
Slice$1<Record<string, DataEntry>, {}, "viewData", "viewData", SliceSelectors<Record<string, DataEntry>>>
~~~

### fragmentsSlice

Reducer independent fragment state/data entries по scopeId.

[src/runtime/redux/fragmentsSlice.ts](../../src/runtime/redux/fragmentsSlice.ts)

~~~typescript
Slice$1<Record<string, { state: StateObject; data: Record<string, DataEntry>; }>, {}, "fragments", "fragments", SliceSelectors<Record<string, { state: StateObject; data: Record<string, DataEntry>; }>>>
~~~

### inlineSourceId

Canonical sorted JSON request → percent-encoded DATA source id без dotted separators.

[src/runtime/datasource/inlineRequest.ts](../../src/runtime/datasource/inlineRequest.ts)

~~~typescript
(request: RequestDefinition) => string
~~~

### fetchTransport

Browser same-origin JSON transport(request,signal), см. data-navigation.

[src/runtime/datasource/api.ts](../../src/runtime/datasource/api.ts)

~~~typescript
ApiTransport
~~~

### stateSetActionHandler

Generic relative local state.set.

[src/runtime/actions/handlers/stateSet.ts](../../src/runtime/actions/handlers/stateSet.ts)

~~~typescript
ActionHandler<"state.set">
~~~

### statePatchActionHandler

Generic shallow local state.patch.

[src/runtime/actions/handlers/statePatch.ts](../../src/runtime/actions/handlers/statePatch.ts)

~~~typescript
ActionHandler<"state.patch">
~~~

### datasourceReloadActionHandler

Generic immediate datasource.reload локального имени.

[src/runtime/actions/handlers/datasource.ts](../../src/runtime/actions/handlers/datasource.ts)

~~~typescript
ActionHandler<"datasource.reload">
~~~

### datasourceInvalidateActionHandler

Generic datasource.invalidate; cancel + idle/null без автоматического fetch.

[src/runtime/actions/handlers/datasource.ts](../../src/runtime/actions/handlers/datasource.ts)

~~~typescript
ActionHandler<"datasource.invalidate">
~~~

### navigateActionHandler

Generic navigate(to) через инъецированный host service.

[src/runtime/actions/handlers/navigate.ts](../../src/runtime/actions/handlers/navigate.ts)

~~~typescript
ActionHandler<"navigate">
~~~

### notificationActionHandler

Generic notification.show через notify(message,tone).

[src/runtime/actions/handlers/notification.ts](../../src/runtime/actions/handlers/notification.ts)

~~~typescript
ActionHandler<"notification.show">
~~~

### sequenceActionHandler

Generic ordered await локальных named actions без rollback.

[src/runtime/actions/handlers/sequence.ts](../../src/runtime/actions/handlers/sequence.ts)

~~~typescript
ActionHandler<"sequence">
~~~

### apiRequestActionHandler

Generic api.request; scope signal, relative response target, named success/error continuations.

[src/runtime/actions/handlers/apiRequest.ts](../../src/runtime/actions/handlers/apiRequest.ts)

~~~typescript
ActionHandler<"api.request">
~~~

### RuntimeContext

React context {runtime,registry}; null вне scope, не JSON поле.

[src/runtime/rendering/RuntimeNode.tsx](../../src/runtime/rendering/RuntimeNode.tsx)

~~~typescript
Context<{ runtime: RuntimeScope; registry: ComponentRegistry; } | null>
~~~

### NodeDefinitionContext

React context текущего ComponentDefinition для infrastructure adapters.

[src/runtime/rendering/RuntimeNode.tsx](../../src/runtime/rendering/RuntimeNode.tsx)

~~~typescript
Context<ComponentDefinition | null>
~~~

### RuntimeNode

Memoized component renderer; принимает definition и runtime context, подписан на BindingEngine selector.

[src/runtime/rendering/RuntimeNode.tsx](../../src/runtime/rendering/RuntimeNode.tsx)

~~~typescript
NamedExoticComponent<{ definition: ComponentDefinition; }>
~~~

### RouteRuntimeContext

React context routes/loader/environment/registry/revision.

[src/runtime/routing/RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx)

~~~typescript
Context<{ routes: RouteDefinition[]; viewSource?: ViewSourceDefinition | undefined; runtime: RuntimeScope; loader: ViewSchemaLoader; environment: RuntimeEnvironment; registry: ComponentRegistry; revision: number; } | null>
~~~

### ApplicationHost

Memoized shell host с definition/views/environment/runtime/registry/revision.

[src/runtime/application/ApplicationHost.tsx](../../src/runtime/application/ApplicationHost.tsx)

~~~typescript
NamedExoticComponent<{ definition: ApplicationDefinition; views: Record<string, ViewDefinition>; environment: RuntimeEnvironment; runtime: ApplicationRuntime; registry: ComponentRegistry; revision?: number | undefined; }>
~~~

## Полный индекс runtime-модулей

- [src/runtime/actions/ActionEngine.ts](../../src/runtime/actions/ActionEngine.ts)
- [src/runtime/actions/ActionRegistry.ts](../../src/runtime/actions/ActionRegistry.ts)
- [src/runtime/actions/ActionServices.ts](../../src/runtime/actions/ActionServices.ts)
- [src/runtime/actions/createActionRegistry.ts](../../src/runtime/actions/createActionRegistry.ts)
- [src/runtime/actions/handlers/apiRequest.ts](../../src/runtime/actions/handlers/apiRequest.ts)
- [src/runtime/actions/handlers/datasource.ts](../../src/runtime/actions/handlers/datasource.ts)
- [src/runtime/actions/handlers/navigate.ts](../../src/runtime/actions/handlers/navigate.ts)
- [src/runtime/actions/handlers/notification.ts](../../src/runtime/actions/handlers/notification.ts)
- [src/runtime/actions/handlers/sequence.ts](../../src/runtime/actions/handlers/sequence.ts)
- [src/runtime/actions/handlers/statePatch.ts](../../src/runtime/actions/handlers/statePatch.ts)
- [src/runtime/actions/handlers/stateSet.ts](../../src/runtime/actions/handlers/stateSet.ts)
- [src/runtime/actions/handlers/stateTarget.ts](../../src/runtime/actions/handlers/stateTarget.ts)
- [src/runtime/actions/types.ts](../../src/runtime/actions/types.ts)
- [src/runtime/application/ApplicationHost.tsx](../../src/runtime/application/ApplicationHost.tsx)
- [src/runtime/application/ApplicationRuntime.ts](../../src/runtime/application/ApplicationRuntime.ts)
- [src/runtime/application/types.ts](../../src/runtime/application/types.ts)
- [src/runtime/binding/BindingEngine.ts](../../src/runtime/binding/BindingEngine.ts)
- [src/runtime/binding/ExpressionResolver.ts](../../src/runtime/binding/ExpressionResolver.ts)
- [src/runtime/binding/paths.ts](../../src/runtime/binding/paths.ts)
- [src/runtime/binding/types.ts](../../src/runtime/binding/types.ts)
- [src/runtime/data-tree/DataTreeRuntime.tsx](../../src/runtime/data-tree/DataTreeRuntime.tsx)
- [src/runtime/data-tree/treeData.ts](../../src/runtime/data-tree/treeData.ts)
- [src/runtime/datasource/DataSourceManager.ts](../../src/runtime/datasource/DataSourceManager.ts)
- [src/runtime/datasource/DependencyGraph.ts](../../src/runtime/datasource/DependencyGraph.ts)
- [src/runtime/datasource/api.ts](../../src/runtime/datasource/api.ts)
- [src/runtime/datasource/inlineRequest.ts](../../src/runtime/datasource/inlineRequest.ts)
- [src/runtime/datasource/requestPolicy.ts](../../src/runtime/datasource/requestPolicy.ts)
- [src/runtime/datasource/types.ts](../../src/runtime/datasource/types.ts)
- [src/runtime/fragment/FragmentRuntime.ts](../../src/runtime/fragment/FragmentRuntime.ts)
- [src/runtime/fragment/FragmentRuntimeHost.tsx](../../src/runtime/fragment/FragmentRuntimeHost.tsx)
- [src/runtime/fragment/normalizeFragmentDefinition.ts](../../src/runtime/fragment/normalizeFragmentDefinition.ts)
- [src/runtime/fragment/types.ts](../../src/runtime/fragment/types.ts)
- [src/runtime/redux/appDataSlice.ts](../../src/runtime/redux/appDataSlice.ts)
- [src/runtime/redux/appStateSlice.ts](../../src/runtime/redux/appStateSlice.ts)
- [src/runtime/redux/changedPaths.ts](../../src/runtime/redux/changedPaths.ts)
- [src/runtime/redux/createRuntimeStore.ts](../../src/runtime/redux/createRuntimeStore.ts)
- [src/runtime/redux/fragmentsSlice.ts](../../src/runtime/redux/fragmentsSlice.ts)
- [src/runtime/redux/listenerMiddleware.ts](../../src/runtime/redux/listenerMiddleware.ts)
- [src/runtime/redux/patchState.ts](../../src/runtime/redux/patchState.ts)
- [src/runtime/redux/runtimeActions.ts](../../src/runtime/redux/runtimeActions.ts)
- [src/runtime/redux/viewDataSlice.ts](../../src/runtime/redux/viewDataSlice.ts)
- [src/runtime/redux/viewStateSlice.ts](../../src/runtime/redux/viewStateSlice.ts)
- [src/runtime/rendering/ComponentBinder.ts](../../src/runtime/rendering/ComponentBinder.ts)
- [src/runtime/rendering/ComponentRegistry.ts](../../src/runtime/rendering/ComponentRegistry.ts)
- [src/runtime/rendering/RuntimeNode.tsx](../../src/runtime/rendering/RuntimeNode.tsx)
- [src/runtime/rendering/RuntimeScopeHost.tsx](../../src/runtime/rendering/RuntimeScopeHost.tsx)
- [src/runtime/rendering/types.ts](../../src/runtime/rendering/types.ts)
- [src/runtime/routing/RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx)
- [src/runtime/routing/ViewSchemaLoader.ts](../../src/runtime/routing/ViewSchemaLoader.ts)
- [src/runtime/routing/types.ts](../../src/runtime/routing/types.ts)
- [src/runtime/schema/FragmentRenderBoundary.tsx](../../src/runtime/schema/FragmentRenderBoundary.tsx)
- [src/runtime/schema/SchemaFragmentManager.ts](../../src/runtime/schema/SchemaFragmentManager.ts)
- [src/runtime/schema/SchemaOutlet.tsx](../../src/runtime/schema/SchemaOutlet.tsx)
- [src/runtime/schema/resolveSchemaRequest.ts](../../src/runtime/schema/resolveSchemaRequest.ts)
- [src/runtime/schema/schemaFragmentSlice.ts](../../src/runtime/schema/schemaFragmentSlice.ts)
- [src/runtime/schema/types.ts](../../src/runtime/schema/types.ts)
- [src/runtime/shared/Diagnostics.ts](../../src/runtime/shared/Diagnostics.ts)
- [src/runtime/shared/RuntimeEnvironment.ts](../../src/runtime/shared/RuntimeEnvironment.ts)
- [src/runtime/shared/RuntimeScope.ts](../../src/runtime/shared/RuntimeScope.ts)
- [src/runtime/shared/ScopeRuntime.ts](../../src/runtime/shared/ScopeRuntime.ts)
- [src/runtime/shared/json.ts](../../src/runtime/shared/json.ts)
- [src/runtime/shared/parseViewDefinition.ts](../../src/runtime/shared/parseViewDefinition.ts)
- [src/runtime/shared/scopeAddress.ts](../../src/runtime/shared/scopeAddress.ts)
- [src/runtime/shared/types.ts](../../src/runtime/shared/types.ts)
- [src/runtime/shared/validation.ts](../../src/runtime/shared/validation.ts)
- [src/runtime/view/ViewRuntime.ts](../../src/runtime/view/ViewRuntime.ts)
- [src/runtime/view/ViewRuntimeHost.tsx](../../src/runtime/view/ViewRuntimeHost.tsx)
- [src/runtime/view/types.ts](../../src/runtime/view/types.ts)
