import type { ComponentRegistry } from '../rendering/ComponentRegistry';
import type { ViewDefinition } from '../view/types';
import { validateViewDefinition } from './validation';
export interface SchemaIssue { stage: 'parse' | 'validation'; message: string; line?: number; column?: number }
export type ViewDefinitionResult = { ok: true; definition: ViewDefinition } | { ok: false; issue: SchemaIssue };
export function jsonSyntaxIssue(error: unknown, source: string): SchemaIssue {
  const message = error instanceof Error ? error.message : String(error);
  const coordinates = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
  if (coordinates) return { stage: 'parse', message, line: Number(coordinates[1]), column: Number(coordinates[2]) };
  const position = /position\s+(\d+)/i.exec(message);
  if (position) {
    const before = source.slice(0, Number(position[1]));
    const lines = before.split('\n');
    return { stage: 'parse', message, line: lines.length, column: lines.at(-1)!.length + 1 };
  }
  return { stage: 'parse', message };
}
export function parseViewDefinition(source: string, registry: ComponentRegistry): ViewDefinitionResult {
  let value: unknown;
  try { value = JSON.parse(source); }
  catch (error) { return { ok: false, issue: jsonSyntaxIssue(error, source) }; }
  try { validateViewDefinition(value, registry); return { ok: true, definition: value }; }
  catch (error) { return { ok: false, issue: { stage: 'validation', message: error instanceof Error ? error.message : String(error) } }; }
}
