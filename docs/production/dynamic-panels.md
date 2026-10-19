# Источник динамического содержимого задаёт инициатор

[Оглавление](README.md) · [Scope/lifecycle](scopes-fragments.md)

SidePanel — изолированный контейнер с props/callbacks. Он открывается по boolean open. SchemaOutlet внутри него загружает FragmentDefinition. Инициатор определяет адрес и параметры запроса. Слой runtime не требует единого /api/ui/panels endpoint.

## Контекст открытия

~~~json
{
  "panel": {
    "open": false,
    "schemaId": null,
    "request": {
      "path": null,
      "query": {}
    }
  }
}
~~~

Это обычные поля View initialState, а не специальные поля runtime.

| Поле | Назначение |
| --- | --- |
| open | Открывает SidePanel и разрешает SchemaOutlet. |
| schemaId | Логический key, выбранный автором. Не является обязательным server schema registry id. |
| request.method | GET/POST; default GET, определяется инициатором. |
| request.body | Необязательное JSON тело выбранного запроса. |
| request.path | Полный адрес schema API, который определяет открывающий action. |
| request.query | Произвольный объект параметров этого endpoint. Не требует поля objectId или contextId. |

Открывающее действие атомарно заменяет весь контекст:

~~~json
{
  "openUserCreatePanel": {
    "type": "state.set",
    "target": "panel",
    "value": {
      "open": true,
      "schemaId": "user.create",
      "request": {
        "method": "GET",
        "path": "/api/ui/users/create",
        "query": {}
      }
    }
  },
  "openReportRunPanel": {
    "type": "state.set",
    "target": "panel",
    "value": {
      "open": true,
      "schemaId": "report.run",
      "request": {
        "method": "POST",
        "path": "/api/ui/reports/run",
        "body": { "contextId": "privileged-access" }
      }
    }
  },
  "closePanel": {
    "type": "state.set",
    "target": "panel.open",
    "value": false
  }
}
~~~

Handlers содержат только { "action": "openUserCreatePanel" }. Значения action могут приходить из $event/$response, как и в остальных state.set действиях. У инициатора нет обязанности использовать общий endpoint.

## Единственный outlet

~~~json
{
  "id": "panel-content",
  "type": "schema-outlet",
  "enabled": "$state.panel.open",
  "key": "$state.panel.schemaId",
  "source": {
    "request": "$state.panel.request",
    "definitionCache": "view"
  },
  "loading": {
    "id": "panel-loading",
    "type": "spinner",
    "props": { "label": "Loading panel schema..." }
  }
}
~~~

SchemaRequestDefinition.query принимает JsonObject либо StateExpression, возвращающее объект. Whole request StateExpression возвращает объект method/path/query/body целиком. Default method — GET, поддерживается POST. Его query/body строки уже являются данными и повторно как expressions не интерпретируются. Неизвестные поля отклоняются. Полный path должен быть локальным абсолютным путём и пройти host RequestPolicy; default prefix — /api/. Необработанный null/массив/строка вместо query также вызывает локальную ошибку загрузки.

Полное выражение $state.panel.request.path отличается от шаблона /api/ui/items/$state.selectedId: первое возвращает весь путь без кодирования слешей; во втором подставляемое значение кодируется как один URL-сегмент. Существующие шаблоны сохранены.

enabled/key/request разрешаются в родительском scope. В полученном FragmentDefinition $state означает уже локальный state нового фрагмента.

## Identity и lifecycle

Полная resource identity включает resolved request. Смена method/path/query/body заменяет фрагмент даже при том же key. Предыдущий scope уничтожается, pending schema request отменяется, устаревший ответ не применяется.

definitionCache=view хранит JSON до disposal View. Повторное открытие использует cached JSON, но создаёт новый scope с initial state. Закрытие SidePanel размонтирует outlet и уничтожает scope. Cache не сохраняет пользовательский ввод.

Повторное действие с тем же key/path/query в открытой панели не пересоздаёт фрагмент. Для принудительной новой активации нужен отдельный меняющийся key от инициатора; выражения не генерируют UUID/счётчики.

## Backend demo

- GET /api/ui/users/create — self-contained user.create, локальная форма без выбранного объекта. Только draft preview, сохранение пользователя не реализовано.
- POST /api/ui/reports/run с JSON body {contextId:...} — self-contained report.run. Его локальный api.request вызывает существующий POST /api/reports/:id/run.
- GET /api/ui/object-panels?schema=... — Microsoft 365 form, Active Directory warning/tabs либо Configuration cards. У каждого свои state/actions.

Кнопки New user, Run report panel и Run changes report есть и внутри открытой панели. Последняя меняет body.contextId при неизменной report.run схеме. GET /api/ui/reports/run?contextId=... также сохранён для совместимости. Старый /api/ui/panels сохранён как compatibility endpoint; outlet больше не содержит этот адрес. Legacy /api/ui/object-details/:id продолжает возвращать bare ComponentDefinition с host scope.

Frontend не импортирует backend JSON. Backend composition находится в backend/routes/schema.ts, новые JSON — backend/data/ui/panels. Схемы View — src/schemas/views/reporting.catalog.json, users.catalog.json и playground/dynamic-fragment.json.

## Панели и popup

Такое разделение подходит и для popup: UI-контейнер получает open/onClose, а вложенный SchemaOutlet — динамический request. В текущем demo открывающие действия и контейнер принадлежат одной View.

Открытие общего popup из любого application/view/fragment scope требует отдельного общего overlay-host/service с явным owner и lifecycle. Обычный state.set остаётся локальным: fragment не пишет в View/application state и не ищет parent named actions. Глобальный overlay.open action и popup adapter в этом изменении не добавлялись.

## Проверки

tests/panel-schema-demo.test.tsx проверяет реальные HTTP endpoints и общий RuntimeNode: открытие без objectId, локальную форму, разные request.path при смене схемы, изменение query, cache reuse с новым scope, pending cancellation и разные Microsoft 365/Active Directory trees.

tests/dynamic-schema-request.test.ts проверяет full path/query expressions, identity, неразрешённые/недопустимые URL и query без HTTP, совместимость segment templates и прежнюю строгую validation для action/datasource declarations.


Исправления архитектурного ревью: [request boundary regressions](../../tests/request-boundary.test.ts), [View/callback/navigation regressions](../../tests/architecture-regressions.test.tsx). Глобальный popup-host по-прежнему отдельная возможность.
