import type { TraceEntry, TraceMetadata } from "../shared/types";

export function diagnosticDetail(value: unknown): string | undefined {
  try { return JSON.stringify(value); }
  catch { return '[Unserializable diagnostic value]'; }
}

export class Diagnostics {
  private entries: TraceEntry[] = [];
  private listeners = new Set<() => void>();
  private counter = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.entries;
  private notify() {
    for (const listener of this.listeners) {
      try { listener(); } catch { /* Diagnostic observers must not interrupt runtime execution. */ }
    }
  }
  trace(kind: TraceEntry["kind"], label: string, detail?: string, metadata?: TraceMetadata) {
    let snapshot: TraceMetadata | undefined;
    if (metadata) {
      try { snapshot = structuredClone(metadata); }
      catch { snapshot = { ...metadata, value: '[Unserializable diagnostic value]' }; }
    }
    this.entries = [
      {
        id: ++this.counter,
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        kind,
        label,
        detail,
        metadata: snapshot,
      },
      ...this.entries,
    ].slice(0, 100);
    this.notify();
  }
  clear = () => {
    this.entries = [];
    this.notify();
  };
}
