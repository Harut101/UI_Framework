# Production-интеграция и эксплуатация

[Оглавление](README.md) · [контракты](schema-reference.md) · [исторический audit](../runtime-final-audit.md)

Документ описывает текущий runtime и обязанности host. Документация не превращает demo backend/playground в готовую production-платформу.

## Матрица

| Область | Сейчас | Требования production-host |
| --- | --- | --- |
| Schema composition | Generic registry/scoped runtime | Approved vocabulary, publishers/registry compatibility |
| State/resources | Один store, local fragments/stale guards | Retention/reset, при необходимости persistence |
| HTTP | Same-origin JSON/cancellation | Auth, allowlists, timeout/size/concurrency/retry, redaction |
| Validation | Safe paths/common checks/cycles/remote limits | API/props shapes, permissions/routes/unknown fields/canonical URLs |
| Cache/lifecycle | Owners + independent runtime lifetime | Memory budgets/eviction/TTL/metrics при необходимости |
| Errors | Local boundary/DataEntry errors | Global app boundary/recovery/alerting/rollback |
| Observability | Inspector/100 events | Durable structured telemetry, UTC/correlation IDs/PII masking |
| Backend | Seeded Express, без auth | Tenant authorization/idempotency/production hosting |
| Tests | Unit/React/real HTTP | Browser E2E/a11y/performance/long session/load scenarios |
| Versions | package version без wire negotiation | External manifest pinning schema/runtime/registry/API artifacts |

## Доверие и permissions

Схема — исполняемая конфигурация capabilities: выбирает adapters/actions/endpoints/navigate destinations. Даже без eval она может инициировать generic операции. Авторизуйте источник и каждое серверное действие.

- Backend проверяет identity/tenant/permissions на каждом DATA/SCHEMA/command endpoint. visibility/disabled не ACL.
- Host transport нормализует URL и разрешает origin/path/method/body/redirects. startsWith('/api/') не полноценная security boundary.
- Host navigate проверяет назначения; произвольный href/to нельзя считать безопасным.
- Проверяйте API/props data shapes и required callbacks до render. Общий validator не проверяет весь public prop contract.
- Не храните tokens/секреты в schema/Redux/query/body без нужной защиты. Tooling/trace metadata содержит raw state/data/resolved requests/full resource keys.

Remote JSON size validation происходит после response.json. Ограничивайте bytes/time/concurrency до parsing в transport/proxy, а также cardinality ключей/активных схем. Для DATA встроенного byte limit нет.

## Версии и release contract

Wire поля schemaVersion/$schema/inputs/imports/pinnedFormat отсутствуют; FragmentDefinition unknown поля отвергает. Храните artifact version/hash/capabilities в вашем внешнем manifest/headers, проверяемых host до runtime.

Предлагаемый процесс: согласовать immutable schema content hash, совместимый runtime/registry bundle, API contracts, tenant/environment и permission policy; протестировать вместе; rollback пары schema+client. Это эксплуатационный процесс, не новая реализованная runtime feature.

Breaking changes: rename/remove semantic component/action type; callback/API shape; required prop; expression semantics; bare-tree→envelope; cache/lifetime defaults. Additive prop тоже проверяйте на совместимость. Unknown prop может молча игнорироваться generic validator.

При legacy→fragment переносите local state/actions/dataSources и пересматривайте $state/$viewState. Definition cache старого релиза не должен обходить внешнюю compatibility policy; встроенного version negotiation/TTL нет.

## Lifecycle и бюджеты

Environment/store на application owner, scope на activation; не Provider/store на каждый fragment. Cleanup через dispose, не ручное удаление maps.

outlet retention оставляет own effects активными при hidden UI. Ограничивайте число retained instances и изменяемых context keys. Definition/inline DATA caches не имеют TTL/LRU и могут расти до owner disposal.

Defaults []/{} могут скрыть missing API shape; telemetry должна отличать ошибку контракта от empty result. Cached state — шаблон, не сохранённая пользовательская сессия. Process scopeId не persistent/entity key.

Readonly TS fields не security isolation. Не отдавайте handles бизнес-коду. Registry/schema mutation после mount не имеет общего reactive version protocol; используйте контролируемую definition/revision replacement с disposal.

Abort/stale guard блокирует позднюю клиентскую запись, не отменяет уже выполненную сервером команду. POST требует серверного idempotency/transaction policy. Sequence не rollback.

## Текущие команды deployment demo

npm ci; npm run lint; npm run docs:check; npm run typecheck; npm test -- --maxWorkers=2; npm run build.

npm start запускает tsx backend/index.ts. Express обслуживает dist и /api, bind 127.0.0.1:PORT, default 3001. Vite proxy /api→127.0.0.1:3001 только dev. Для production нужны TLS/reverse proxy/access/session, limits/process management/SPA fallback/health policy.

tsx для текущего npm start лежит в devDependencies: install --omit=dev не обеспечивает такой запуск. Production server build/bundle выбирается отдельно. fetchTransport использует browser window; SSR/hydration/persisted scopes не имеют поддержанного контракта.

Нужны Router/Redux Provider/FluentProvider/theme. Fluent bundle имеет baseline Vite >500kB advisory. Code splitting/performance budgets — отдельная проверяемая работа.

## Runbook

| Симптом | Проверка / действие |
| --- | --- |
| Parse/validation error | issue.stage/message/line/column; исправить JSON/контракт, не рисовать обходной UI. |
| Unknown component/action/source | Registry + local dictionaries + совместимый artifact; нет parent lookup. |
| Binding пустой | Scope/namespace/own-property path/API shape/default. |
| DATA не обновляется | Local action, dependsOn, load.reload, scope started/active, resolved request. |
| Visibility меняется без HTTP | Корректный selector-driven render без datasource dependency. |
| Два экземпляра делят state | Explicit envelope/scopes либо host-scoped legacy tree. |
| Старый результат записался | Custom transport/signal/generation guards; убрать business dispatch/fetch. |
| Schema Retry не лечит DATA | Разные streams; local datasource.reload вместо schema acquisition Retry. |
| Hidden panel продолжает HTTP | Retention/actual unmount/owner: own hidden effects допустимы. |
| Patch теряет siblings | Shallow merge: target родительского объекта вместо root replacement. |
| API path содержит $state | api.request использует {param}+params; resolvePath автоматически только DATA/SCHEMA loaders. |
| Ошибка после успешного command | onSuccess action error не HTTP error; не повторять без idempotency. |

Inspector — только tooling: hierarchy/state/actions/resources/dependencies и separate logs. Ctrl+Alt+I работает поверх drawer, close возвращает initiating focus. Clear/disable inspection не меняет бизнес-работу.

Diagnostics: 100 total events, UI stream 40, local time string, нет durable tracing/redaction. Не используйте как production audit trail.

## Release verification и ограничения

Проверяйте published schemas/API props, duplicate local names/namespaces, cache×lifetime matrix, sibling/nested scopes, route replacement, abort-ignoring transport, server auth/idempotency, DATA vs SCHEMA, keyboard/modal focus, realistic memory/performance и rollout/rollback. Browser E2E runner в baseline проекта не настроен; отсутствие runner не является успешным тестом.

Исторический [Task 10 audit](../runtime-final-audit.md) фиксирует 393 tests/33 files. Текущий result берите из запуска CI.

Ограничения: одна active View/environment; нет persisted scopes/inputs/pinned formats, parent actions/cross writes, delete/deep merge action, transaction/rollback/automatic command retry, polling/TTL/LRU, arbitrary expression JS/operators, author request headers/auth fields, remote view loader, SSR или component-specific runtime hooks. Расширение требует реализации/валидации/docs/tests, а не неизвестного JSON property.
