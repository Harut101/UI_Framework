# JSON динамического фрагмента: объяснение каждого поля

Полный справочник всей архитектуры и всех контрактов: [Production reference](production/README.md). Ниже — вводный walkthrough двух примеров.

Примеры соответствуют текущим контрактам проекта. Пояснения вынесены из JSON, чтобы файлы можно было загрузить без удаления комментариев.

- [fragment-host.view.json](examples/fragment-host.view.json) — новая ViewDefinition. Её можно целиком вставить в редактор Tab 2: Schema Playground при запущенном demo backend.
- [items-panel.workspace.fragment.json](examples/items-panel.workspace.fragment.json) — пример ответа GET /api/ui/fragments/items-panel/workspace: backend-шаблон с literal contextId=workspace, как делает endpoint.
- Файл примера ответа не подключается к frontend напрямую: SchemaOutlet продолжает загружать его через HTTP.

## 1. ViewDefinition: владелец outlet

| Поле | Объяснение |
| --- | --- |
| id | Имя определения View: fragment-guide. Runtime отдельно создаёт scopeId её экземпляра. |
| title | Название View для tooling/метаданных. Видимую подпись в примере рисует отдельный text-компонент. |
| initialState | Начальное локальное состояние View. У View поле называется initialState, у FragmentDefinition — state. |
| initialState.detailsOpened | Boolean, включающий фрагмент. Начальное значение true. |
| initialState.contextId | Выбранный контекст: workspace, finance или operations. Управляет URL и пользовательским key outlet. |
| dataSources | Словарь источников ДАННЫХ View. Здесь пустой: items принадлежит загруженному фрагменту. |
| actions | Словарь именованных действий View. |
| actions.setContext | Действие выбора контекста. |
| actions.setOpened | Действие переключателя Show fragment. |
| actions.*.type | state.set — generic handler. Имя действия setContext/setOpened и его тип — разные понятия. |
| actions.*.target | Относительный путь записи в локальное состояние: contextId или detailsOpened. Без префикса $state. |
| actions.*.value | $event.value — значение из callback компонента. |
| root | Корневое определение компонента View. |
| root.id | Идентификатор guide-root. В дереве View id компонентов обязательны и уникальны. |
| root.type | stack — ключ ComponentRegistry, размещающий children вертикально. |
| root.props.gap | Расстояние между дочерними компонентами. |
| root.children | Упорядоченный массив: подпись, Select, Switch, SchemaOutlet. |

Select меняет contextId; Switch меняет detailsOpened. Поля их компонентов и props описаны в разделах 6–7.

## 2. SchemaOutlet: загрузка и владение экземпляром

Центральный узел полного host JSON:

~~~json
{
  "id": "guide-outlet",
  "type": "schema-outlet",
  "enabled": "$state.detailsOpened",
  "key": "$state.contextId",
  "source": {
    "request": {
      "method": "GET",
      "path": "/api/ui/fragments/items-panel/$state.contextId"
    },
    "definitionCache": "view"
  },
  "lifecycle": {
    "scopeLifetime": "activation"
  }
}
~~~

| Поле | Объяснение |
| --- | --- |
| id | Идентификатор узла outlet внутри дерева View. Отдельно существуют ключ ресурса и scopeId фрагмента. |
| type | schema-outlet — инфраструктурный компонент загрузки схемы. |
| enabled | Boolean/выражение в родительском scope. Здесь $state относится к View. false деактивирует фрагмент и при текущей политике уничтожает его scope. |
| key | Пользовательский ключ содержимого: workspace/finance/operations. Смена ключа заменяет активацию. Длинную внутреннюю строку сюда писать не нужно. |
| source | Inline-описание источника СХЕМЫ, без регистрации schemaSources. |
| source.request | Описание HTTP-запроса за определением UI. |
| source.request.method | GET. Для schema source допустимы GET/POST; без method используется GET. |
| source.request.path | URL с безопасной подстановкой родительского $state.contextId. Например, /api/ui/fragments/items-panel/workspace. |
| source.definitionCache | view — переиспользовать загруженный JSON до уничтожения owning View. |
| lifecycle | Настройки времени жизни работающего экземпляра, отдельно от кеша JSON. |
| lifecycle.scopeLifetime | activation — уничтожать scope при деактивации. Это также значение по умолчанию. |
| loading | Дополнительное ComponentDefinition во время загрузки определения. В полном файле это spinner. |
| error | Дополнительное ComponentDefinition при ошибке. В полном файле text с подсказкой о backend. Стандартную ошибку с Retry показывает сам SchemaOutlet. |

Вложенные id/type/props у loading/error — обычные поля компонентов. Fallback-деревья работают в родительском scope.

### Две независимые политики

| Настройка | Значения |
| --- | --- |
| definitionCache | none — без сохранения JSON для следующего независимого приобретения; scope — в пределах объявляющего scope; view — в пределах owning View; application — в пределах приложения. Активные потребители могут разделять один запрос даже при none. |
| scopeLifetime | activation — уничтожать при деактивации; outlet — сохранять тот же scope при enabled=false, пока outlet смонтирован. Собственные эффекты остаются активны; скрытое дочернее дерево размонтируется. |

Размонтирование outlet, смена source/key/вычисленного запроса, уничтожение родителя или явное обновление завершают прежнюю активацию независимо от definitionCache. Кешированный JSON не восстанавливает уже уничтоженное локальное состояние.

cache — поддерживаемый старый alias для definitionCache. Одновременно указывать оба имени запрещено.

## 3. FragmentDefinition: ответ backend

Второй файл содержит:

| Поле | Объяснение |
| --- | --- |
| type | Обязательное значение fragment: ответ создаёт собственный RuntimeScope. |
| id | Необязательное имя определения items-panel. У двух экземпляров может быть одинаковый id, но разные scopeId и независимое состояние. |
| state | Шаблон начального состояния; отдельная копия в fragments[scopeId].state для каждой активации. |
| state.query | Локальная строка поиска. |
| state.selectedId | ID выбранного элемента или null. Управляет выделением и вложенным outlet. |
| state.failRequests | Boolean для demo-ошибки API. |
| state.slowRequests | Boolean для demo-задержки API. |
| state.showAdvanced | Boolean для visibility дополнительной карточки. |
| dataSources | Локальные источники данных, здесь items. |
| actions | Локальные именованные действия. Автоматического поиска в родительских actions нет. |
| root | Обязательное корневое определение компонента. В примере stack с children. |

Только type и root обязательны. state/dataSources/actions по умолчанию пустые. В удалённом дереве id компонентов можно опускать: нормализатор назначит их. scopeId создаёт runtime, автор JSON его не задаёт.

Legacy-ответ, содержащий только ComponentDefinition без оболочки fragment, продолжает работать в scope хоста. Для самостоятельных state/actions/dataSources нужна оболочка FragmentDefinition.

## 4. Datasource items

| Поле | Объяснение |
| --- | --- |
| dataSources.items | items — локальное имя. Внутренний адрес включает scopeId, поэтому одинаковые имена у соседей независимы. |
| items.type | api — generic HTTP datasource. |
| items.request.method | GET. |
| items.request.path | /api/items — существующий demo endpoint данных. |
| items.request.query | Query-параметры; выражения вычисляются в scope владельца перед запросом. |
| query.search | $state.query — поиск этого фрагмента. |
| query.fail | $state.failRequests — включение demo-ошибки. |
| query.slow | $state.slowRequests — включение demo-задержки. |
| query.contextId | Literal workspace в примере ответа. Для finance/operations endpoint возвращает соответствующее значение. |
| items.dependsOn | $state.query, $state.failRequests, $state.slowRequests — зависимости для listener + scoped DependencyGraph. |
| items.load | Политика запуска и обновления. |
| load.strategy | onInit — запуск после инициализации фрагмента; нормализуется в onScopeInit. manual не выполняет стартовый запрос. |
| load.reload | onDependencyChange — обновлять при изменении объявленных зависимостей. |
| load.debounceMs | 180 мс после последнего изменения зависимости. Устаревшая работа отменяется. |

До первого рендера $data.items содержит status=idle, loading=false, data=null, error=null. Затем status/loading/error описывают lifecycle, а data содержит ответ backend.

dependsOn управляет работой datasource. UI обновляется через Redux/useSelector.

## 5. Actions фрагмента

| Имя | type | target/source | value |
| --- | --- | --- | --- |
| setQuery | state.set | target=query | $event.value из SearchInput |
| selectItem | state.set | target=selectedId | $event.value из GenericList |
| setFailure | state.set | target=failRequests | $event.value из Switch |
| setSlowRequests | state.set | target=slowRequests | $event.value из Switch |
| toggleAdvanced | state.set | target=showAdvanced | $event.value из Switch |
| reloadItems | datasource.reload | source=items | Поля value нет: обновляется datasource по имени |

target — относительный путь записи. source у datasource.reload — локальное имя источника. У SchemaOutlet.source и binding.source другое назначение.

handler содержит только ссылку { "action": "setQuery" }. Определение state.set находится в actions. Оно меняет fragments[scopeId].state.query, сохраняя состояние View/соседей.

## 6. Общие поля компонентов обоих файлов

| Поле | Объяснение |
| --- | --- |
| id | ID узла в одном дереве. Обязателен в View, может назначаться нормализатором удалённого дерева. |
| type | Ключ ComponentRegistry: text, search-input, switch, row и т. д. |
| props | Статические публичные React props адаптера. Строки остаются literals, даже если начинаются с $. |
| bindings | Публичный prop → выражение или BindingDefinition. Реактивно выбирается из Redux текущего scope. |
| bindings.value | Значение SearchInput/Text/Select; смысл определяется контрактом компонента. |
| bindings.text | Текст ошибки ErrorMessage из $data.items.error. |
| bindings.checked | Boolean для Switch. |
| bindings.items | Массив элементов GenericList. |
| bindings.selectedId | ID выделенного элемента GenericList. |
| bindings.loading | Boolean загрузки GenericList. |
| binding.source | Выражение чтения, например $data.items.data.items. |
| binding.default | Значение при null/undefined результате. [] даёт безопасный пустой список до ответа; строка — подпись ожидания. false/0/пустая строка сохраняются. |
| visibility | Boolean/выражение наличия компонента в React-дереве. Card зависит от $state.showAdvanced, ErrorMessage — от наличия $data.items.error. |
| handlers | Публичный callback → ссылка на именованное действие текущего scope. |
| handlers.onChange.action | Имя действия для ввода/переключения. |
| handlers.onClick.action | Имя действия кнопки. |
| handlers.onSelect.action | Имя действия выбора элемента списка. |
| handlers.onRetry.action | Имя действия Retry у ErrorMessage. |
| children | Упорядоченные дочерние узлы, наследующие scope. Самостоятельный FragmentDefinition активирует отдельный scope. |

В $data.items.data.items первый items — имя datasource, второй — поле API-ответа.

Типы компонентов в этих деревьях:

| type | Назначение |
| --- | --- |
| stack | Вертикальный контейнер. |
| row | Горизонтальный контейнер. |
| text | Текстовое значение. |
| select | Выбор контекста из options. |
| search-input | Ввод строки поиска с onChange. |
| switch | Boolean-переключатель с onChange. |
| card | Карточка дополнительной информации. |
| button | Кнопка с onClick. |
| generic-list | Список данных и выбор элемента через onSelect. |
| spinner | Индикатор загрузки определения. |
| error-message | Ошибка datasource с onRetry. |
| schema-outlet | Загрузка и активация дочерней схемы. |

## 7. Все статические props из примеров

| Поле | Объяснение |
| --- | --- |
| props.gap | Расстояние между children Stack/Row. |
| props.className | CSS-класс items-fragment. |
| props.justify | between — разнести элементы Row по ширине. |
| props.label | Подпись контрола/кнопки, имя списка или подпись Spinner — по контракту компонента. |
| props.placeholder | Подсказка пустого SearchInput. |
| props.value | Literal текста для Text. |
| props.title | Заголовок Card. |
| props.description | Описание Card. |
| props.variant | secondary — визуальный вариант Button. |
| props.emptyMessage | Сообщение GenericList при пустом результате. |
| props.options | Варианты Select. |
| options[].value | Значение, передаваемое при выборе. |
| options[].label | Отображаемая подпись варианта. |

value/label — имена props конкретного компонента; action.value и outlet.key имеют отдельное назначение.

## 8. Вложенный SchemaOutlet

В конце root.children фрагмента находится ещё один outlet:

| Поле | Объяснение |
| --- | --- |
| type | schema-outlet. |
| enabled | $state.selectedId: null отключает, непустой ID включает. Здесь $state принадлежит items-panel. |
| key | $state.selectedId — пользовательский ключ выбранного элемента. |
| source.request.method | GET. |
| source.request.path | /api/ui/fragments/item-note/$state.selectedId — реальный endpoint определения заметки. |
| source.definitionCache | view — переиспользовать JSON заметок до уничтожения owning View. |
| lifecycle | Опущен: scopeLifetime=activation по умолчанию. |

Полученный item-note создаёт дочерний scope с note/pinned. Его $state относится к заметке. Два родителя могут разделять JSON заметки, сохраняя независимые локальные значения.

## 9. Namespaces

| Namespace | Откуда читается |
| --- | --- |
| $state / $data | Текущий RuntimeScope: application, view или fragment. |
| $viewState / $viewData | Owning View. |
| $appState / $appData | Owning Application. |
| $event | Payload callback во время действия; не постоянное Redux-состояние. |
| $response | Ответ API в цепочке действий; не постоянное Redux-состояние. |

В host JSON $state.contextId читает View. В загруженном фрагменте $state.query читает его локальное состояние. Чтение предков явно задаётся через $viewState/$appState. Межscope-запись и неявный поиск родительских actions в MVP отсутствуют.

## 10. Именованный source вместо inline

Альтернативно можно объявить в View:

~~~json
{
  "schemaSources": {
    "itemsPanel": {
      "request": {
        "method": "GET",
        "path": "/api/ui/fragments/items-panel/$state.contextId"
      },
      "load": {
        "strategy": "onDemand",
        "definitionCache": "view"
      }
    }
  }
}
~~~

schemaSources — словарь источников схем, itemsPanel — имя, request — HTTP-конфигурация. load.strategy=onDemand означает приобретение по запросу outlet; load.definitionCache управляет JSON-кешем. Затем outlet.source будет строкой "itemsPanel". lifecycle.scopeLifetime остаётся на outlet.

У inline source policy лежит прямо в source.definitionCache, без load. Готовый host JSON использует inline-формат.

## 11. Как это связано с длинным ключом

Автор задаёт key="$state.contextId". Для workspace пользовательский ключ равен "workspace".

Runtime отдельно вычисляет ключ ресурса из владельца кеша, id схемы, имени/определения source, пользовательского key и вычисленного запроса. Отдельная идентичность описывает активацию outlet; scopeId — живой экземпляр. Эти служебные значения не записываются автором в FragmentDefinition.

Поток примера:

View Select → setContext → состояние View → SchemaOutlet HTTP → FragmentRuntime → локальный datasource items onInit → Redux → bindings → GenericList.

SearchInput фрагмента → setQuery → локальный state.set → scoped dependency → items reload → Redux → BindingEngine/useSelector → обновление списка.

Проверка: оба файла разобраны JSON.parse; View прошла validateViewDefinition, ответ фрагмента — normalizeFragmentDefinition с текущим ComponentRegistry.
