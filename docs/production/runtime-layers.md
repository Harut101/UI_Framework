# Каждый слой runtime и точки интеграции

[Оглавление](README.md) · [точные signatures/поля](contracts-api-reference.md)

## Два независимых пути

~~~mermaid
flowchart LR
 UI[UI callback] --> CB[ComponentBinder]
 CB --> AE[Local ActionEngine]
 AE --> AH[ActionRegistry handler]
 AH --> RS[Redux state]
 RS --> RR[react-redux useSelector]
 RR --> BE[BindingEngine selector]
 BE --> RN[RuntimeNode]
 RN --> CP[React adapter props]
~~~

~~~mermaid
flowchart LR
 RS[Redux change] --> LM[listener + changed paths]
 LM --> DG[Scope-qualified DependencyGraph]
 DG --> DM[Owning DataSourceManager]
 DM --> API[Transport / backend]
 API --> RD[Redux DataEntry]
 RD --> RR[React subscription / UI]
~~~

DependencyGraph выбирает ресурсы, не оповещает React и не заменяет useSelector.

## Все слои и основные файлы

| Слой / файлы в src/runtime | Ответственность / API | Граница |
| --- | --- | --- |
| shared/RuntimeEnvironment.ts | Один store/resolver/Diagnostics/ActionRegistry/DependencyGraph/schema cache. Registry scopes/managers, группировка listener targets. | Live сервисы вне Redux, один app hierarchy. |
| shared/RuntimeScope.ts | Общие identity/parentage, definitions, initialize/start/active/dispose; composed managers/engine. | Не рендерит, не знает business types. |
| application/ApplicationRuntime.ts | Facade type application. | Полную schema validation должен вызвать host до constructor. |
| application/ApplicationHost.tsx | Shell RuntimeNode, RuntimeContext/RouteRuntimeContext, memoized ViewSchemaLoader. | Provider/Router и application lifecycle принадлежат host. |
| view/ViewRuntime.ts, ViewRuntimeHost.tsx | Facade type view и bridge общего scope host. | Новая active View disposes старую. |
| fragment/FragmentRuntime.ts, FragmentRuntimeHost.tsx | Normalize envelope, create scope(fragment), delegate shared host. | Нет отдельного store/renderer/binding system. |
| fragment/normalizeFragmentDefinition.ts | JSON/size/tree validation, wire state mapping, onInit alias, generated IDs, legacy host mode. | Не authorization boundary backend. |
| rendering/RuntimeScopeHost.tsx | Ownership microtask/StrictMode guard, initialize/start before render, readiness selector/context, cleanup. | Изменение create function identity заменяет owner; она должна быть стабильна. |
| rendering/RuntimeNode.tsx | React memo, scope selector/shallowEqual, binder, registry, visibility, children. | Никаких feature-specific conditions. |
| rendering/ComponentRegistry.ts | register/get/has/list semantic React adapters. | Повторный type заменяет; registry не reactive store. |
| rendering/ComponentBinder.ts | Static props + handler closures; local execute; catch→diagnostics/notify. | Payload plain object, не DOM event. |
| binding/ExpressionResolver.ts, paths.ts | Namespace reads, recursive JSON resolve, URI resolvePath, safe get/set. | Нет eval; missing undefined, unsafe path error. |
| binding/BindingEngine.ts | createSelector(bindings,scope,visibility), stable defaults, compatibility select. | Не запускает HTTP/actions. |
| actions/ActionEngine.ts | Local lookup, scope/context/stack, continuation response, traceResolved. | Нет parent/sibling lookup/cross writes. |
| actions/ActionRegistry.ts, createActionRegistry.ts | Generic type → handler, восемь встроенных типов. | Named dictionaries остаются scope-local. |
| actions/handlers/* | state.set/patch/API/datasource/navigate/notification/sequence, stateTarget guard. | Generic операции, не component-specific hooks. |
| datasource/DataSourceManager.ts | Scope definitions/inline leases, start/load/reload/invalidate/dispose, debounce/status/cancel/stale guards. | Сам решает policy после graph targets. |
| datasource/DependencyGraph.ts | registerScope/register, atomic cycle check, affected/registrations, ownership release handles. | Scope/area/path addresses; нет UI subscription. |
| datasource/api.ts | {params} path resolution, browser fetchTransport JSON/errors/AbortSignal. | Расширяется injected transport. |
| datasource/inlineRequest.ts | Canonical sorted DATA request key без dotted separators. | Отличается от schema cache resource tuple. |
| redux/createRuntimeStore.ts | Combine slices, active instance guards, configureStore+listener, {store,listener}. | Один на environment, не FragmentRuntime. |
| redux/runtimeActions.ts | Generic init/dispose/set/patch/dataChanged; disposeView compatibility alias. | Business adapters не dispatch напрямую. |
| redux/appStateSlice.ts, appDataSlice.ts | App state/data. | Instance guard общий store reducer. |
| redux/viewStateSlice.ts, viewDataSlice.ts | Единственная active View state/data. | Не multi-view registry. |
| redux/fragmentsSlice.ts | scopeId→state/data, local updates/disposal. | Sibling entries независимы. |
| redux/patchState.ts | Shallow root/target merge. | Не deep merge/JSON Merge Patch. |
| redux/changedPaths.ts | Scoped snapshot diff, init/dispose; arrays/scalars как replacement. | Schema status не DATA dependency namespace. |
| redux/listenerMiddleware.ts | Changed-state predicate, original/current state, observer. | Resource side effects, не React rendering. |
| routing/RouteOutlet.tsx | React Router routes/fallback/keyed View по pathname/viewId/revision. | Host Router context обязателен. |
| routing/ViewSchemaLoader.ts | Own-key sync lookup bundled definitions. | Remote View loader отсутствует. |
| schema/SchemaFragmentManager.ts | prepare/identity/acquire/reload/dispose; cache JSON + transient coordination отдельно. | Cache policy не scope lifetime. |
| schema/SchemaOutlet.tsx | Parent selectors, source leases/retry/retention/nesting/boundary. | Зарегистрированная generic инфраструктура. |
| schema/schemaFragmentSlice.ts | changed/removed snapshots. | Без controllers/promises/closures. |
| schema/FragmentRenderBoundary.tsx | children/fallback/resetToken/onError, subtree failure. | Не глобальный app/API error handler. |
| data-tree/treeData.ts | DATA validation/merge/order/canonical expansion/projection. | Не UI schema. |
| data-tree/DataTreeRuntime.tsx | Scoped selectors/leases/target adapter/onRetryChildren. | PrimaryNavigation остаётся чистым presenter. |
| shared/scopeAddress.ts | Namespace→canonical address/read supplied snapshot. | Общий адресный слой bindings/resources. |
| shared/validation.ts, parseViewDefinition.ts | Schema/expressions/actions/cycles/source validation, parse issue position. | Нет полной проверки props/API shapes. |
| shared/json.ts, types.ts, ScopeRuntime.ts | JSON/scoped/trace types, compatibility alias. | Не второй runtime. |
| shared/Diagnostics.ts | 100 detached events, subscribe/snapshot/clear, observer isolation. | Tooling, не persisted production audit. |

[API appendix](contracts-api-reference.md) содержит полный автоматически сверяемый список runtime-модулей/exports и свойств/методов.

## React context и bridge props

| Context/bridge | Поля |
| --- | --- |
| RuntimeContext | runtime:RuntimeScope, registry:ComponentRegistry |
| NodeDefinitionContext | Текущий ComponentDefinition |
| RouteRuntimeContext | routes, loader, environment, registry, revision |
| ScopeActivation | scope, root; host владеет dispose |
| ApplicationHost | definition, views, environment, runtime, registry; revision default 0 |
| ViewRuntimeHost | definition, environment, registry |
| FragmentRuntimeHost | normalized definition, parent, registry; visible default true, origin optional |
| RuntimeScopeHost | create:()=>{scope,root}, registry; visible default true |
| FragmentRenderBoundary | children, fallback, resetToken, onError |

Эти поля — React/service API, не дополнительные author JSON properties. Boundary state failed/resetToken принадлежит React, не FragmentDefinition.state.

## Internal Redux payloads

| Creator | Поля payload |
| --- | --- |
| runtimeActions.initialize | scope:app/view/fragment, instance:scopeId, initialState, data:Record<id,DataEntry> |
| disposeScope | scope, instance |
| disposeView | view instance string → compatibility disposeScope |
| set | scope, instance, target relative path, value |
| patch | scope, instance, target optional, value object |
| dataChanged | scope, instance, id local datasource, entry DataEntry |
| schemaFragmentSlice.changed | id resource key, entry SchemaFragmentEntry |
| schemaFragmentSlice.removed | id resource key |

Stale updates/disposal/data writes не меняют Redux address. Не используйте эти payloads как публичный backend protocol.

## Bootstrap

~~~tsx
const registry = registerRouteOutlet(
  registerApplicationComponents(createComponentRegistry())
);
validateApplicationDefinition(definition, registry);
const environment = new RuntimeEnvironment(navigate, notify, transport);
const runtime = new ApplicationRuntime(definition, environment);
runtime.start();
// Под существующим Router и FluentProvider:
<Provider store={environment.store}>
  <ApplicationHost
    definition={definition} views={definition.views}
    environment={environment} runtime={runtime} registry={registry}
  />
</Provider>;
// При завершении владения:
runtime.dispose();
~~~

Импорты: components/registry, routing/RouteOutlet, shared/validation, shared/RuntimeEnvironment, application/ApplicationRuntime/ApplicationHost и react-redux. Transport optional; default browser fetch. В React создавайте/dispose owner в effect с cleanup, не в render. Не создавайте environment на каждый re-render. Validate до первых side effects.

## Обновление definitions во время работы

ApplicationHost.definition и ApplicationRuntime.definition должны оставаться согласованными. Host revision заменяет routed View activation, но не переинициализирует app actions/dataSources/initialState/schemaSources. Для изменения app-owned definitions нужен контролируемый dispose/recreate ApplicationRuntime (и новый environment, если заканчивается всё приложение), до следующего render/start.

ViewRuntimeHost меняет scope при изменении definition reference; обычный parent re-render с той же reference не создаёт View заново. Изменение contents объекта на месте не является поддержанным protocol update. Cached remote JSON также не мутируют: новую версию приобретают отдельной контролируемой identity/generation.

## Добавление возможностей

Компонент: typed props/callbacks → registry semantic type → schema compose/bind/handler → external props/data validation → docs generate/check и meaningful render tests. Без runtime/Redux/API imports в business adapters.

Action: union ActionDefinition → validator → generic handler → createActionRegistry; сохранить scope/event/response/signal, задокументировать semantics. Named actions и generic type registry разделены.

Datasource: для endpoint достаточно api request definition. Новый datasource type требует union/validator/manager/status/error/cancel contract и документации.

View: local state/actions/dataSources/root, затем views/routes. Fragment: HTTP envelope и SchemaOutlet. Нет feature branching.

Transport/permissions: injected environment services, общие allowlists/auth/telemetry на boundary. Hidden UI не server authorization.
