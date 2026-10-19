import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import path from 'node:path';
import { catalogEntries } from '../src/playground/components-tab/catalog';
import { sharedComponents, createComponentRegistry } from '../src/components/registry';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import type { ViewDefinition } from '../src/runtime/view/types';

describe('component catalog contracts', () => {
  it('documents all 19 shared components and registers their exact implementations', () => {
    const registry = createComponentRegistry();
    expect(catalogEntries).toHaveLength(19);
    expect(catalogEntries.map(entry => entry.type).sort()).toEqual(Object.keys(sharedComponents).sort());
    expect(new Set(catalogEntries.map(entry => entry.type)).size).toBe(19);
    for (const entry of catalogEntries) {
      expect(registry.get(entry.type)).toBe(sharedComponents[entry.type]);
      expect(entry.description.length).toBeGreaterThan(20);
      expect(Object.keys(entry.props).length).toBeGreaterThan(0);
    }
  });
  it.each(catalogEntries)('validates the $name schema example and its named action references', entry => {
    const definition: ViewDefinition = { id: `example-${entry.type}`, title: entry.name, initialState: {}, dataSources: {}, actions: entry.actions, root: entry.schema };
    expect(() => validateViewDefinition(definition, createComponentRegistry())).not.toThrow();
  });
  it('typechecks the React examples against the real public component contracts', () => {
    const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
    const files = new Map(catalogEntries.map(entry => [path.resolve(`src/.catalog-example-${entry.type}.tsx`), entry.reactExample]));
    const host = ts.createCompilerHost(parsed.options);
    const getSourceFile = host.getSourceFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const readFile = host.readFile.bind(host);
    host.getSourceFile = (file, language, error, fresh) => {
      const source = files.get(path.normalize(file));
      return source === undefined ? getSourceFile(file, language, error, fresh) : ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX);
    };
    host.fileExists = file => files.has(path.normalize(file)) || fileExists(file);
    host.readFile = file => files.get(path.normalize(file)) ?? readFile(file);
    const program = ts.createProgram([...files.keys()], parsed.options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const output = diagnostics.map(item => `${item.file?.fileName ?? ''}: ${ts.flattenDiagnosticMessageText(item.messageText, '\n')}`);
    expect(output).toEqual([]);
  }, 20000);
});
