import { resolveSchemaRequest } from "../schema/resolveSchemaRequest";
import { validateResolvedRequest } from "../shared/validation";
import type { RuntimeState } from "../shared/types";
import type { ViewDefinition } from "../view/types";
import type { ViewSourceDefinition } from "./types";
import type { RuntimeScope } from "../shared/RuntimeScope";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import type { RequestDefinition } from "../datasource/types";
import { jsonLiteral, validateViewDefinition } from "../shared/validation";

export interface ViewSchemaLease {
  promise: Promise<ViewDefinition>;
  release: () => void;
}
type PendingView = {
  promise: Promise<ViewDefinition>;
  controller: AbortController;
  consumers: number;
};

export class ViewSchemaLoader {
  private readonly pending = new Map<string, PendingView>();
  /** Pure snapshot projection used by the reactive route host and non-React callers. */
  prepare(
    pathname: string,
    source: ViewSourceDefinition,
    scope: RuntimeScope,
    state: RuntimeState = scope.environment.store.getState(),
  ): RequestDefinition {
    if (scope.type !== "application" || !scope.active())
      throw new Error("An active application scope is required");
    if (!pathname.startsWith("/") || pathname.startsWith("//"))
      throw new Error("Invalid view pathname");
    const environment = scope.environment;
    const request = resolveSchemaRequest(source.request, environment.resolver, { state, scope }, environment.requestPolicy);
    return { ...request, query: { ...request.query, [source.pathQueryParam ?? "path"]: pathname } };
  }
  /** A definition lease never owns a Redux store or a running View scope. */
  acquire(
    pathname: string,
    source: ViewSourceDefinition,
    scope: RuntimeScope,
    registry: ComponentRegistry,
    generation = 0,
    preparedRequest?: RequestDefinition,
  ): ViewSchemaLease {
    if (scope.type !== "application" || !scope.active())
      throw new Error("An active application scope is required");
    const environment = scope.environment;
    const request = preparedRequest ?? this.prepare(pathname, source, scope);
    validateResolvedRequest(request, environment.requestPolicy);
    if (!["GET", "POST"].includes(request.method))
      throw new Error("Schema source method must be GET or POST");
    const key = JSON.stringify([scope.scopeId, request, generation]);
    let pending = this.pending.get(key);
    if (!pending) {
      const controller = new AbortController();
      const abort = () => controller.abort();
      scope.signal.addEventListener("abort", abort, { once: true });
      const metadata = {
        scope: scope.scope,
        instance: scope.scopeId,
        request,
        viewSchema: { pathname },
      };
      const promise = new Promise<ViewDefinition>((resolve, reject) => {
        let settled = false;
        const cancelled = () => {
          if (settled) return;
          settled = true;
          environment.diagnostics.trace(
            "request",
            "View schema cancelled",
            undefined,
            { ...metadata, event: "cancelled" },
          );
          reject(
            new DOMException("View schema request cancelled", "AbortError"),
          );
        };
        controller.signal.addEventListener("abort", cancelled, { once: true });
        // StrictMode replay releases/reacquires before this first HTTP side effect.
        queueMicrotask(async () => {
          if (controller.signal.aborted || !scope.active()) {
            cancelled();
            return;
          }
          environment.diagnostics.trace(
            "request",
            "View schema loading",
            undefined,
            { ...metadata, event: "loading" },
          );
          try {
            const response = await environment.transport(
              request,
              controller.signal,
            );
            if (controller.signal.aborted || !scope.active()) {
              cancelled();
              return;
            }
            jsonLiteral(response, "View schema");
            if (
              new TextEncoder().encode(JSON.stringify(response)).byteLength >
              1024 * 1024
            )
              throw new Error("View schema exceeds 1 MiB");
            validateViewDefinition(response, registry);
            const definition = structuredClone(response);
            environment.diagnostics.trace(
              "request",
              "View schema loaded",
              definition.id,
              { ...metadata, event: "success" },
            );
            settled = true;
            resolve(definition);
          } catch (error) {
            if (controller.signal.aborted || !scope.active()) {
              cancelled();
              return;
            }
            environment.diagnostics.trace(
              "error",
              "View schema failed",
              error instanceof Error ? error.message : String(error),
              { ...metadata, event: "error" },
            );
            settled = true;
            reject(error);
          } finally {
            controller.signal.removeEventListener("abort", cancelled);
          }
        });
      });
      pending = { promise, controller, consumers: 0 };
      this.pending.set(key, pending);
      const detach = () => scope.signal.removeEventListener("abort", abort);
      void promise.then(detach, detach);
    }
    const current = pending;
    current.consumers++;
    let released = false;
    return {
      promise: current.promise,
      release: () => {
        if (released) return;
        released = true;
        current.consumers--;
        queueMicrotask(() => {
          if (current.consumers || this.pending.get(key) !== current) return;
          this.pending.delete(key);
          current.controller.abort();
        });
      },
    };
  }
}
