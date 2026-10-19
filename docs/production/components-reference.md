# Все registry-компоненты: props, callbacks и defaults

[Оглавление](README.md) · [правила JSON](schema-reference.md)

Сгенерировано из TypeScript signatures и фактических register-вызовов. Optional относится к TS; — в Default означает отсутствие явного destructuring default, а не гарантированный fallback. Поля callback связываются через handlers; остальные через props/bindings. children в JSON задаётся отдельным полем. API data shapes перечислены в contracts appendix.

Base registry создаёт createComponentRegistry; application adapters добавляет registerApplicationComponents; route-outlet — registerRouteOutlet. Fluent-specific props не становятся schema API автоматически.

## application-header

Бренд, breadcrumb/profile и callback свёртывания navigation; все данные/состояние передаются props.

Реализация: <code>ApplicationHeader</code> — [src/components/application/ApplicationHeader.tsx](../../src/components/application/ApplicationHeader.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>brand</code> | <code>string</code> | Нет | — | Название бренда application header. |
| <code>breadcrumbs</code> | <code>string[]</code> | Нет | — | Массив строк breadcrumb; интерактивных ссылок в контракте нет. |
| <code>user</code> | <code>ApplicationUser \| null \| undefined</code> | Да | — | Объект пользователя по указанному UserSummary/ApplicationUser контракту. |
| <code>navigationCollapsed</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Состояние свёрнутой shell-навигации. |
| <code>onToggleNavigation</code> | <code>ValueChangeCallback&lt;boolean&gt; \| undefined</code> | Да | — | Следующее состояние свёрнутости shell-навигации в {value:boolean}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## application-shell

CSS shell composition header/navigation/outlet. Controlled navigationCollapsed, без fetch/state subscriptions.

Реализация: <code>ApplicationShell</code> — [src/components/application/ApplicationShell.tsx](../../src/components/application/ApplicationShell.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>navigationCollapsed</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Состояние свёрнутой shell-навигации. |

## button

Кнопка действия с primary/secondary/ghost emphasis. Передаёт onClick без DOM payload.

Реализация: <code>Button</code> — [src/components/primitive/Button.tsx](../../src/components/primitive/Button.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string</code> | Нет | — | Видимый текст кнопки. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>variant</code> | <code>"primary" \| "secondary" \| "ghost" \| undefined</code> | Да | <code>'primary'</code> | Визуальный вариант Button: primary/secondary/ghost. |
| <code>onClick</code> | <code>() =&gt; void</code> | Нет | — | Активация кнопки без payload. Handler получает undefined в $event. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## card

Контентная поверхность с optional title/description и schema children.

Реализация: <code>Card</code> — [src/components/layout/Card.tsx](../../src/components/layout/Card.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>title</code> | <code>string \| undefined</code> | Да | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |
| <code>description</code> | <code>string \| undefined</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string \| undefined</code> | Да | <code>''</code> | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## catalog-layout

Сетка каталога для children; не знает reports/users/filters.

Реализация: <code>CatalogLayout</code> — [src/components/layout/CatalogLayout.tsx](../../src/components/layout/CatalogLayout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

## checkbox

Контролируемый boolean выбор с plain onChange({value}).

Реализация: <code>Checkbox</code> — [src/components/primitive/Checkbox.tsx](../../src/components/primitive/Checkbox.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>checked</code> | <code>boolean</code> | Нет | — | Контролируемый boolean Checkbox; onChange сообщает следующее значение. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;boolean&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## data-tree

Инфраструктура известных navigation UI и неизвестных DATA: scoped loading/merge/leases перед target adapter.

Реализация: <code>DataTreeRuntime</code> — [src/runtime/data-tree/DataTreeRuntime.tsx](../../src/runtime/data-tree/DataTreeRuntime.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>component</code> | <code>string</code> | Нет | — | Тип registry-компонента, которому передаются подготовленные tree items. PrimaryNavigation — один из потребителей. |
| <code>items</code> | <code>unknown</code> | Да | <code>[]</code> | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>expandedIds</code> | <code>string[] \| undefined</code> | Да | <code>[]</code> | Контролируемые канонические tree keys раскрытых узлов. |
| <code>error</code> | <code>string \| null \| undefined</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |

Дополнительные props передаются target component; runtime генерирует onRetryChildren. См. [DATA architecture](data-navigation.md).

## error-message

Fluent MessageBar ошибки с optional Retry callback; самостоятельно ничего не перезагружает.

Реализация: <code>ErrorMessage</code> — [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>text</code> | <code>string</code> | Нет | — | Текст ErrorMessage/WarningBanner. |
| <code>onRetry</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## generic-list

Список {id,title,description?,meta?,disabled?}; optional выбор и loading/empty states, без знания фильтров/API.

Реализация: <code>GenericList</code> — [src/components/navigation/GenericList.tsx](../../src/components/navigation/GenericList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>ListItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>selectedId</code> | <code>string \| null \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>emptyMessage</code> | <code>string \| undefined</code> | Да | <code>'No items to display.'</code> | Текст пустого состояния GenericList. |
| <code>label</code> | <code>string \| undefined</code> | Да | <code>'Items'</code> | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt; \| undefined</code> | Да | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## generic-navigation

Общий список navigation choices {id,label,...}; controlled selectedId, onSelect, без DATA loading/Redux.

Реализация: <code>GenericNavigation</code> — [src/components/navigation/GenericNavigation.tsx](../../src/components/navigation/GenericNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>NavigationItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>selectedId</code> | <code>string \| null \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>orientation</code> | <code>"vertical" \| "horizontal" \| undefined</code> | Да | <code>'vertical'</code> | Расположение GenericNavigation: vertical/horizontal. |
| <code>label</code> | <code>string \| undefined</code> | Да | <code>'Navigation'</code> | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## navigation-group

Контролируемая раскрываемая группа обычных schema children. Legacy composition, не автоматическая node DATA загрузка.

Реализация: <code>NavigationGroup</code> — [src/components/navigation/NavigationGroup.tsx](../../src/components/navigation/NavigationGroup.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>id</code> | <code>string \| undefined</code> | Да | — | Совместимый необязательный prop, не используется текущей реализацией; top-level node id не forwarded автоматически. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>icon</code> | <code>string \| undefined</code> | Да | <code>'folder'</code> | Семантическое имя иконки адаптера; неизвестное имя использует fallback. |
| <code>expanded</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Контролируемое состояние раскрытия NavigationGroup. |
| <code>onExpandedChange</code> | <code>(event: { value: boolean; }) =&gt; void</code> | Нет | — | Изменение раскрытия: NavigationGroup передаёт boolean, PrimaryNavigation — массив canonical keys; см. тип. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## navigation-group-content

Контейнер вложенного navigation контента без собственной логики загрузки.

Реализация: <code>NavigationGroupContent</code> — [src/components/navigation/NavigationGroup.tsx](../../src/components/navigation/NavigationGroup.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

## navigation-item

Простой пункт с label/icon/onClick. Не выполняет HTTP или маршрутизацию самостоятельно.

Реализация: <code>NavigationItem</code> — [src/components/navigation/NavigationGroup.tsx](../../src/components/navigation/NavigationGroup.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>id</code> | <code>string \| undefined</code> | Да | — | Совместимый prop адаптера; не используется реализацией. Top-level ComponentDefinition.id автоматически сюда не передаётся. |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>icon</code> | <code>string \| undefined</code> | Да | <code>'folder'</code> | Семантическое имя иконки адаптера; неизвестное имя использует fallback. |
| <code>onClick</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Активация кнопки без payload. Handler получает undefined в $event. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## page

Контейнер страницы с children и optional CSS class.

Реализация: <code>Page</code> — [src/components/layout/Page.tsx](../../src/components/layout/Page.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string \| undefined</code> | Да | <code>''</code> | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## page-header

Заголовок/description/eyebrow и область children для page actions.

Реализация: <code>PageHeader</code> — [src/components/layout/PageHeader.tsx](../../src/components/layout/PageHeader.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |
| <code>description</code> | <code>string \| undefined</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>eyebrow</code> | <code>string \| undefined</code> | Да | — | Короткая надзаголовочная подпись PageHeader. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

## primary-navigation

Рекурсивный presenter подготовленных TreeItem/ApplicationNavigationItem; controlled expansion/selection/retry callbacks.

Реализация: <code>PrimaryNavigation</code> — [src/components/application/PrimaryNavigation.tsx](../../src/components/application/PrimaryNavigation.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>items</code> | <code>ApplicationNavigationItem[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>selectedId</code> | <code>string \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>expandedIds</code> | <code>string[] \| undefined</code> | Да | <code>[]</code> | Контролируемые канонические tree keys раскрытых узлов. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>error</code> | <code>string \| null \| undefined</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>onSelect</code> | <code>(event: { value: string; href: string; }) =&gt; void</code> | Нет | — | Выбор leaf с href: {value:item.id,href:item.href}. Expandable node вместо этого меняет expandedIds. |
| <code>onExpandedChange</code> | <code>((event: { value: string[]; }) =&gt; void) \| undefined</code> | Да | — | Изменение раскрытия: NavigationGroup передаёт boolean, PrimaryNavigation — массив canonical keys; см. тип. |
| <code>onRetry</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |
| <code>onRetryChildren</code> | <code>((event: { value: string; }) =&gt; void) \| undefined</code> | Да | — | Повторить загрузку navigation DATA по canonical tree key в {value:string}. DataTreeRuntime генерирует этот callback. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## report-card

Карточка переданного ReportSummary, onOpen сообщает ID; без runtime/requests.

Реализация: <code>ReportCard</code> — [src/components/reporting/ReportCard.tsx](../../src/components/reporting/ReportCard.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>report</code> | <code>ReportSummary</code> | Нет | — | Объект ReportSummary/ReportDetail для отображения; компонент не запрашивает API. |
| <code>selected</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг визуального выделения карточки. |
| <code>openLabel</code> | <code>string \| undefined</code> | Да | <code>'Open report'</code> | Текст кнопки открытия ReportCard. |
| <code>onOpen</code> | <code>ValueChangeCallback&lt;string&gt; \| undefined</code> | Да | — | Открытие отчёта с {value:report.id}; компонент API не вызывает. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## report-details

Controlled drawer ReportDetail/loading/error/running/result с close/run/retry callbacks; без API.

Реализация: <code>ReportDetails</code> — [src/components/reporting/ReportDetails.tsx](../../src/components/reporting/ReportDetails.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>report</code> | <code>ReportDetail \| null \| undefined</code> | Да | — | Объект ReportSummary/ReportDetail для отображения; компонент не запрашивает API. |
| <code>open</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Контролируемая видимость панели/деталей; возврат null размонтирует её дочернее дерево. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>error</code> | <code>string \| null \| undefined</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>running</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг выполнения отчёта, контролируемый владельцем. |
| <code>lastRun</code> | <code>ReportRunResult \| null \| undefined</code> | Да | — | Последний запуск: timestamp/null в ReportDetail либо ReportRunResult/null в details props. |
| <code>onClose</code> | <code>() =&gt; void</code> | Нет | — | Запрос закрытия панели без payload. Владелец должен обновить open/visibility. |
| <code>onRun</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Запустить выбранный отчёт: {value:report.id}; API определяется JSON action. |
| <code>onRetry</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## report-list

Отображает переданный массив ReportSummary через те же ReportCard; не знает фильтры.

Реализация: <code>ReportList</code> — [src/components/reporting/ReportList.tsx](../../src/components/reporting/ReportList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>ReportSummary[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>error</code> | <code>string \| null \| undefined</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>selectedId</code> | <code>string \| null \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>onOpen</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Открытие карточки отчёта; payload {value:report.id}. |
| <code>onRetry</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## route-outlet

Инфраструктурная точка View маршрута в application shell. Берёт routing services из context.

Реализация: <code>RouteOutlet</code> — [src/runtime/routing/RouteOutlet.tsx](../../src/runtime/routing/RouteOutlet.tsx).

Прямых adapter props нет. Конфигурация берётся из RuntimeContext/NodeDefinitionContext/RouteRuntimeContext; top-level поля описаны в schema reference.

## row

Горизонтальная композиция children с gap/align/justify/wrap.

Реализация: <code>Row</code> — [src/components/layout/Row.tsx](../../src/components/layout/Row.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>gap</code> | <code>number \| undefined</code> | Да | <code>16</code> | Промежуток children в CSS pixels. |
| <code>align</code> | <code>"start" \| "center" \| "stretch" \| undefined</code> | Да | <code>'center'</code> | Выравнивание поперёк оси контейнера; разрешённые литералы см. тип. |
| <code>justify</code> | <code>"start" \| "center" \| "between" \| undefined</code> | Да | <code>'start'</code> | Распределение по основной оси Row: start/center/between. |
| <code>wrap</code> | <code>boolean \| undefined</code> | Да | <code>true</code> | Разрешить перенос дочерних элементов Row. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string \| undefined</code> | Да | <code>''</code> | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## schema-outlet

Инфраструктурная загрузка UI JSON по parent scope с отдельными definition cache и scope lifetime.

Реализация: <code>SchemaOutlet</code> — [src/runtime/schema/SchemaOutlet.tsx](../../src/runtime/schema/SchemaOutlet.tsx).

Прямых adapter props нет. Конфигурация берётся из RuntimeContext/NodeDefinitionContext/RouteRuntimeContext; top-level поля описаны в schema reference.

## search-input

Контролируемый поиск с clear и optional Enter onSearch; не вызывает API.

Реализация: <code>SearchInput</code> — [src/components/primitive/SearchInput.tsx](../../src/components/primitive/SearchInput.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string</code> | Нет | — | Контролируемая строка поискового ввода; callbacks не выполняют HTTP сами. |
| <code>label</code> | <code>string \| undefined</code> | Да | <code>'Search'</code> | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>placeholder</code> | <code>string \| undefined</code> | Да | <code>'Search…'</code> | Подсказка пустого поля ввода. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |
| <code>onSearch</code> | <code>ValueChangeCallback&lt;string&gt; \| undefined</code> | Да | — | Нажатие Enter в SearchInput с payload {value:string}; запросов компонент не выполняет. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## select

Контролируемый Fluent Dropdown по options[].value; отдаёт выбранную строку через onChange.

Реализация: <code>Select</code> — [src/components/primitive/Select.tsx](../../src/components/primitive/Select.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>options</code> | <code>SelectOption[]</code> | Нет | — | Список SelectOption: value/label/disabled. |
| <code>value</code> | <code>string</code> | Нет | — | Выбранный options[].value; UI выводит соответствующий label. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## side-panel

Controlled Fluent OverlayDrawer. Возвращает null при open=false; onClose просит владельца изменить state.

Реализация: <code>SidePanel</code> — [src/components/layout/SidePanel.tsx](../../src/components/layout/SidePanel.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |
| <code>description</code> | <code>string \| undefined</code> | Да | — | Поясняющий текст UI/бизнес-записи. |
| <code>size</code> | <code>"medium" \| "wide" \| undefined</code> | Да | <code>'medium'</code> | Ширина SidePanel: medium/wide; не произвольный Fluent size. |
| <code>open</code> | <code>boolean \| undefined</code> | Да | <code>true</code> | Контролируемая видимость панели/деталей; возврат null размонтирует её дочернее дерево. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>onClose</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос закрытия панели без payload. Владелец должен обновить open/visibility. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## spinner

Индикатор загрузки определения с label.

Реализация: <code>Spinner</code> — [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string \| undefined</code> | Да | <code>'Loading…'</code> | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |

## split-layout

Двухколоночная композиция с ratio/gap; children задаются схемой.

Реализация: <code>SplitLayout</code> — [src/components/layout/SplitLayout.tsx](../../src/components/layout/SplitLayout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>ratio</code> | <code>"balanced" \| "wide-left" \| "wide-right" \| undefined</code> | Да | <code>'balanced'</code> | Пропорции SplitLayout: balanced/wide-left/wide-right. |
| <code>gap</code> | <code>number \| undefined</code> | Да | <code>20</code> | Промежуток children в CSS pixels. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |

## stack

Вертикальная композиция с gap/align.

Реализация: <code>Stack</code> — [src/components/layout/Stack.tsx](../../src/components/layout/Stack.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>gap</code> | <code>number \| undefined</code> | Да | <code>16</code> | Промежуток children в CSS pixels. |
| <code>align</code> | <code>"start" \| "center" \| "stretch" \| undefined</code> | Да | <code>'stretch'</code> | Выравнивание поперёк оси контейнера; разрешённые литералы см. тип. |
| <code>children</code> | <code>ReactNode</code> | Да | — | Упорядоченный дочерний контент/узлы. В JSON составляйте дерево через ComponentDefinition.children. |
| <code>className</code> | <code>string \| undefined</code> | Да | <code>''</code> | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## suggestion-callout

Информационная карточка с suggested value и onAccept; AI сервисов/запросов в компоненте нет.

Реализация: <code>SuggestionCallout</code> — [src/components/layout/SuggestionCallout.tsx](../../src/components/layout/SuggestionCallout.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>title</code> | <code>string</code> | Нет | — | Название/заголовок. У View это метаданные; у UI-компонентов видимый заголовок. |
| <code>description</code> | <code>string</code> | Нет | — | Поясняющий текст UI/бизнес-записи. |
| <code>suggestion</code> | <code>string</code> | Нет | — | Предлагаемое значение, передаваемое callback onAccept. |
| <code>buttonLabel</code> | <code>string \| undefined</code> | Да | <code>'Try suggestion'</code> | Текст кнопки SuggestionCallout. |
| <code>note</code> | <code>string \| undefined</code> | Да | — | Поясняющий текст callout. |
| <code>onAccept</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Принять предложенное значение: {value:suggestion}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## switch

Контролируемый boolean переключатель; callback передаёт следующее checked.

Реализация: <code>Switch</code> — [src/components/primitive/Switch.tsx](../../src/components/primitive/Switch.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>checked</code> | <code>boolean</code> | Нет | — | Контролируемый boolean Switch; onChange сообщает следующее значение. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;boolean&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## tabs

Контролируемый список вкладок items[].id/label; выбор передаётся onSelect.

Реализация: <code>Tabs</code> — [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>{ id: string; label: string; }[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>selectedId</code> | <code>string \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>onSelect</code> | <code>((event: { value: string; }) =&gt; void) \| undefined</code> | Да | — | Выбор элемента; payload указан в типе callback, обычно {value:id}, у UserList также user. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## text

Текстовый абзац из string value, static или reactive binding.

Реализация: <code>Text</code> — [src/components/primitive/Text.tsx](../../src/components/primitive/Text.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string</code> | Нет | — | Строка текста абзаца. |
| <code>className</code> | <code>string \| undefined</code> | Да | — | Дополнительный CSS-класс адаптера; не перенос всех Fluent/native props. |

## text-input

Контролируемое текстовое поле label/value/placeholder/disabled; plain value callback.

Реализация: <code>TextInput</code> — [src/components/primitive/TextInput.tsx](../../src/components/primitive/TextInput.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>label</code> | <code>string</code> | Нет | — | Отображаемая подпись/доступное имя или diagnostics label; точное применение задаёт компонент/тип. |
| <code>value</code> | <code>string</code> | Нет | — | Значение/контролируемый prop или payload callback; конкретный тип и источник указаны в строке. В actions вычисляются выражения. |
| <code>placeholder</code> | <code>string \| undefined</code> | Да | — | Подсказка пустого поля ввода. |
| <code>disabled</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Запрет взаимодействия. Это UI-состояние, не проверка прав доступа. |
| <code>onChange</code> | <code>ValueChangeCallback&lt;string&gt;</code> | Нет | — | Изменение контролируемого значения. Форма payload указана в типе; обычно {value:string/boolean}. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## title

Семантический heading уровня 1..4 и optional subtitle.

Реализация: <code>Title</code> — [src/components/primitive/Title.tsx](../../src/components/primitive/Title.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>value</code> | <code>string</code> | Нет | — | Строка семантического заголовка. |
| <code>level</code> | <code>1 \| 2 \| 3 \| 4 \| undefined</code> | Да | <code>2</code> | Семантический уровень заголовка Title: 1/2/3/4. |
| <code>subtitle</code> | <code>string \| undefined</code> | Да | — | Дополнительная подпись под заголовком. |

## user-card

Карточка UserSummary; onSelect/onMessage передают user ID и не отправляют сообщения/API сами.

Реализация: <code>UserCard</code> — [src/components/users/UserCard.tsx](../../src/components/users/UserCard.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>user</code> | <code>UserSummary</code> | Нет | — | Объект пользователя по указанному UserSummary/ApplicationUser контракту. |
| <code>selected</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг визуального выделения карточки. |
| <code>onSelect</code> | <code>ValueChangeCallback&lt;string&gt; \| undefined</code> | Да | — | Выбор пользователя с {value:user.id}; UserList дополняет событие полем user. |
| <code>onMessage</code> | <code>ValueChangeCallback&lt;string&gt; \| undefined</code> | Да | — | Запрос действия Message с {value:user.id}; компонент не отправляет сообщения/запросы сам. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## user-list

Сетка тех же UserCard, controlled items/selection/loading/error; onSelect включает UserSummary.

Реализация: <code>UserList</code> — [src/components/users/UserList.tsx](../../src/components/users/UserList.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>items</code> | <code>UserSummary[]</code> | Нет | — | Массив элементов известного компонента/проекции. Data shape задаётся контрактом items, не runtime. |
| <code>loading</code> | <code>boolean \| undefined</code> | Да | <code>false</code> | Флаг загрузки либо fallback-дерево SchemaOutlet; не подменяет lifecycle status. |
| <code>error</code> | <code>string \| null \| undefined</code> | Да | — | Текст ошибки/null, ошибка parser либо fallback-дерево — точная форма в типе. |
| <code>selectedId</code> | <code>string \| null \| undefined</code> | Да | — | Контролируемый идентификатор выделения; компонент не изменяет state самостоятельно. |
| <code>onSelect</code> | <code>((event: UserSelection) =&gt; void) \| undefined</code> | Да | — | Payload {value:user.id,user:UserSummary}; owner решает действие без API внутри списка. |
| <code>onRetry</code> | <code>(() =&gt; void) \| undefined</code> | Да | — | Запрос повторения без payload; named action определяет реальную работу. |

Payload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).

## warning-banner

Fluent warning MessageBar с текстом, без runtime зависимостей.

Реализация: <code>WarningBanner</code> — [src/components/primitive/FragmentAdapters.tsx](../../src/components/primitive/FragmentAdapters.tsx).

| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |
| --- | --- | --- | --- | --- |
| <code>text</code> | <code>string</code> | Нет | — | Текст ErrorMessage/WarningBanner. |

