# Архитектура и контракт схем Schema-Driven Application Runtime

Справочник для авторов схем, разработчиков адаптеров/runtime и команды эксплуатации. Базовая дата: **2026-10-19**, версия package.json 1.0.0. Документ описывает текущий код; номер пакета не означает наличие версии wire-format.

## Как читать

| Задача | Документ |
| --- | --- |
| Описать Application/View/Component/Fragment и понять каждое поле | [Полный формат схем](schema-reference.md) |
| Написать bindings, visibility, handlers и все восемь типов actions | [Выражения и действия](expressions-actions.md) |
| Описать запрос, зависимости и навигационные DATA | [Источники данных и navigation](data-navigation.md) |
| Управлять scope, кешем и вложенными фрагментами | [Scope и lifecycle](scopes-fragments.md) |
| Интегрировать runtime, понять каждый слой и изменить инфраструктуру | [Слои runtime](runtime-layers.md) |
| Настроить production-интеграцию, ошибки, доступ и выпуск | [Эксплуатация и ограничения](production-operations.md) |
| Найти все props/defaults/callbacks любого registry type | [Справочник компонентов](components-reference.md) |
| Проверить точную TypeScript-форму каждого поля и API-члена | [Контракты и API](contracts-api-reference.md) |
| Получить готовую полную схему | [Примеры](examples.md) |
| Посмотреть результаты проверок | [Проверка проекта](verification.md) |
| Проверить полноту и актуальность | [Машинный отчёт покрытия](coverage.json), npm run docs:check |

Рекомендуемый порядок: схема → expressions/actions → datasource → scope/lifecycle → runtime → production. Поля со знаком ? в TypeScript необязательны; это само по себе не задаёт default. Явные defaults задокументированы отдельно.

## Основной контракт

~~~text
ApplicationDefinition
  initialState / dataSources / actions / schemaSources
  shell: ComponentDefinition → application scope
  routes[] → views[viewId]: ViewDefinition
    initialState / dataSources / actions / schemaSources
    root: ComponentDefinition → view scope
      schema-outlet → HTTP FragmentDefinition
        state / dataSources / actions / schemaSources
        root: ComponentDefinition → fragment scope
          schema-outlet → следующий независимый fragment scope
~~~

В одной application hierarchy используется один RuntimeEnvironment и один Redux store. Playground дополнительно имеет независимую sandbox environment; фрагмент не создаёт store/Provider. Два одновременных outlet могут переиспользовать один JSON и иметь разные локальные state/data/actions/resources.

Bindings означают reactive props; visibility — reactive условие рендера; handlers — callbacks со ссылками на named actions; dependsOn — lifecycle dependency ресурса. React обновляется через Redux/react-redux, а DependencyGraph выбирает datasource side effects.

## Уровень гарантий

**Реализовано:** scoped namespaces/actions/data/dependencies; безопасные path reads без eval; отмена/stale guards; nested fragments; JSON cache отдельно от runtime lifetime; изолированные Fluent UI adapters.

**Ответственность production-host:** аутентификация/авторизация, политика разрешённых API/routes/schema sources, внешняя схема версионирования/совместимости, проверка API data/props shapes, лимиты сети/памяти, наблюдаемость с redaction. Demo Express backend и playground tooling не образуют готовую production-платформу.

Справка не обещает отсутствующие возможности: нет multi-view store, parent action lookup, cross-scope writes, transaction/rollback sequence, TTL/LRU cache, SSR-контракта, arbitrary expression JavaScript, автоматического persistence или runtime theme-specific wire types.

## Источники истины и сопровождение

1. TypeScript и реализация определяют фактический контракт.
2. schema-reference описывает назначение, required/default и ограничения.
3. Сгенерированные справочники фиксируют все обнаруженные поля, типы, props, callbacks и API signatures.
4. npm run docs:check сравнивает справку с AST/registry, проверяет описание каждого элемента, локальные ссылки, наличие всех runtime-модулей и валидирует JSON-примеры текущими runtime validators.
5. После осознанного изменения контракта: обновить описание, выполнить npm run docs:generate, npm run docs:check и обычные проверки проекта.

Исторические [migration decisions](../runtime-scope-migration.md) и [audit Task 10](../runtime-final-audit.md) остаются отдельными снимками. Для текущего контракта основной точкой входа служит этот справочник.
