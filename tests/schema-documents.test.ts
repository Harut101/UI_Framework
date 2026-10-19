import { describe, expect, it } from 'vitest';
import { createComponentRegistry } from '../src/components/registry';
import { parseViewDefinition } from '../src/runtime/shared/parseViewDefinition';
import { schemaSamples } from '../src/playground/schema-tab/samples';
import { indentSelection, insertIndentedLine } from '../src/playground/schema-tab/editorUtils';
const registry = createComponentRegistry();
describe('schema document validation', () => {
  it.each(schemaSamples)('validates the $label sample', sample => {
    const result = parseViewDefinition(sample.source, registry);
    expect(result.ok).toBe(true);
  });
  it('distinguishes parse errors from contract errors', () => {
    const parse = parseViewDefinition('{', registry);
    expect(parse).toMatchObject({ ok: false, issue: { stage: 'parse' } });
    const validation = parseViewDefinition('{}', registry);
    expect(validation).toMatchObject({ ok: false, issue: { stage: 'validation' } });
  });
  it('rejects unsafe, malformed, and unknown expression paths before rendering', () => {
    const sample = JSON.parse(schemaSamples[2].source);
    for (const source of ['$state.__proto__.value', '$state.', '$unknown.value']) {
      sample.root.children[0].bindings.value = source;
      expect(parseViewDefinition(JSON.stringify(sample), registry).ok).toBe(false);
    }
  });
  it('treats static dollar-prefixed props and state as literals', () => {
    const sample = JSON.parse(schemaSamples[2].source);
    sample.initialState.message = '$128.4K';
    sample.root.children[0] = { id: 'price', type: 'text', props: { value: '$128.4K' } };
    expect(parseViewDefinition(JSON.stringify(sample), registry).ok).toBe(true);
  });
  it('rejects a missing action value and a non-expression visibility string', () => {
    const sample = JSON.parse(schemaSamples[2].source);
    delete sample.actions.showMessage.value;
    expect(parseViewDefinition(JSON.stringify(sample), registry)).toMatchObject({ ok: false, issue: { stage: 'validation', message: 'State action requires value' } });
    sample.actions.showMessage.value = 'Updated'; sample.root.visibility = 'yes';
    expect(parseViewDefinition(JSON.stringify(sample), registry).ok).toBe(false);
  });
});
describe('editor indentation', () => {
  it('indents and outdents a multiline selection without consuming its trailing newline', () => {
    const original = 'first\nsecond\nthird';
    const indented = indentSelection(original, 0, 13, false);
    expect(indented.value).toBe('  first\n  second\nthird');
    expect(indentSelection(indented.value, indented.start, indented.end, true).value).toBe(original);
  });
  it('inserts two spaces at a caret and handles a blank first line', () => {
    expect(indentSelection('{}', 1, 1, false)).toEqual({ value: '{  }', start: 3, end: 3 });
    expect(indentSelection('\nnext', 0, 0, true)).toEqual({ value: '\nnext', start: 0, end: 0 });
  });
  it('creates an indented line between matching braces', () => {
    expect(insertIndentedLine('{}', 1, 1)).toEqual({ value: '{\n  \n}', start: 4, end: 4 });
    expect(insertIndentedLine('  "value": 1', 12, 12).value).toContain('\n  ');
  });
});
