import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const files = (root, pattern) => fs.readdirSync(root, { recursive: true, encoding: 'utf8' }).filter(file => pattern.test(file)).map(file => path.join(root, file));
const sourceFiles = files('src', /\.tsx?$/);
const failures = [];
const fail = (file, message) => failures.push(file + ': ' + message);
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const normalized = file.replaceAll('\\', '/');
  const business = normalized.startsWith('src/components/') && !normalized.endsWith('/registry.ts');
  const runtime = normalized.startsWith('src/runtime/');
  const navigation = normalized.endsWith('/GenericNavigation.tsx');
  const inspect = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.moduleSpecifier.text === 'lucide-react') fail(file, 'legacy icon dependency');
      if (runtime && node.moduleSpecifier.text.startsWith('@fluentui/')) fail(file, 'Fluent dependency outside the UI layer');
    }
    if (business && ts.isStringLiteral(node) && /^\$(?:appState|appData|viewState|viewData|state|data)(?:\.|$)/.test(node.text)) fail(file, 'schema expression in business UI');
    if ((business || normalized.startsWith('src/playground/')) && (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^(button|input|select|textarea|dialog|details|label|progress)$/.test(node.tagName.getText(tree))) fail(file, 'native control duplicates Fluent: ' + node.tagName.getText(tree));
    if (ts.isIdentifier(node) && ['EventDispatcher', 'EventBindingResolver'].includes(node.text)) fail(file, 'forbidden event infrastructure ' + node.text);
    if (business && ts.isIdentifier(node) && ['useSelector', 'useDispatch', 'ActionEngine', 'DataSourceManager', 'SchemaFragmentManager'].includes(node.text)) fail(file, 'business component accesses ' + node.text);
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (/(?:^|\/)backend(?:\/|$)/.test(specifier)) fail(file, 'frontend imports backend implementation/schema');
      if (runtime && specifier === 'react-redux' && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) &&
        node.importClause.namedBindings.elements.some(element => (element.propertyName ?? element.name).text === 'Provider'))
        fail(file, 'runtime scope introduces a Redux Provider');
      if (runtime && /(?:rendering|binding)\//.test(normalized) && /DependencyGraph/.test(specifier))
        fail(file, 'React/binding layer depends on datasource dependency graph');
      if (business && /react-redux|reduxjs|(?:^|\/)runtime(?:\/|$)|(?:^|\/)schemas(?:\/|$)|(?:^|\/)playground(?:\/|$)|(?:^|\/)(api|services)(?:\/|$)|axios|ofetch|superagent|^node:(http|https)/.test(specifier)) fail(file, 'business component imports infrastructure/API: ' + specifier);
      if (runtime && /(?:^|\/)(playground|components|schemas)(?:\/|$)/.test(specifier)) fail(file, 'runtime depends on business/playground code: ' + specifier);
    }
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'configureStore' && normalized !== 'src/runtime/redux/createRuntimeStore.ts')
      fail(file, 'store creation outside the common store factory');
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'createRuntimeStore' && normalized !== 'src/runtime/shared/RuntimeEnvironment.ts')
      fail(file, 'scope creates a separate Redux store');
    if (business && ts.isCallExpression(node) && /(?:^|\.)(fetch|XMLHttpRequest|WebSocket)$/.test(node.expression.getText(tree))) fail(file, 'business component performs API access');
    if (business && ts.isNewExpression(node) && /(?:^|\.)(XMLHttpRequest|WebSocket)$/.test(node.expression.getText(tree))) fail(file, 'business component constructs a network client');
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name && /^use(?:Report|User|GenericNavigation|Navigation|Button|TextInput|SearchInput|Select|Switch|Checkbox|Card|Page|SidePanel)/.test(node.name.getText(tree))) fail(file, 'component-specific runtime hook: ' + node.name.getText(tree));
    if (runtime && ts.isStringLiteral(node) && /\/api\/(reports|users)|reporting\.catalog|users\.catalog|forestRecoveryNavigation|objectDetailsPanel|microsoft-365|forest-recovery|^(report|user)-(list|navigation|card)$|filters\.(module|department)/.test(node.text)) fail(file, 'domain-specific runtime behavior: ' + node.text);
    if (runtime && ts.isIdentifier(node) && /^(selectModule|selectDepartment|selectedReportId|highlightedPerson|ReportList|ReportNavigation|GenericNavigation)$/.test(node.text)) fail(file, 'domain-specific runtime identifier: ' + node.text);
    if (navigation && ((ts.isIdentifier(node) && /report|user|department|datasource|filter|^module$/i.test(node.text)) || (ts.isStringLiteral(node) && /\/api\/|reports|users|department|filters\./i.test(node.text)))) fail(file, 'domain/datasource logic in shared navigation');
    ts.forEachChild(node, inspect);
  };
  inspect(tree);
}
const schemas = [...files('src/schemas', /\.json$/), ...files('backend/data/ui', /\.json$/)];
for (const file of schemas) {
  const inspect = value => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && /fluent|@fluentui/i.test(value.type)) fail(file, 'library-specific schema type');
    if (typeof value.type === 'string' && value.handlers) for (const handler of Object.values(value.handlers)) {
      if (!handler || typeof handler !== 'object' || Object.keys(handler).length !== 1 || typeof handler.action !== 'string') fail(file, 'inline action or malformed handler');
    }
    Object.values(value).forEach(inspect);
  };
  inspect(JSON.parse(fs.readFileSync(file, 'utf8')));
}
if (failures.length) { process.stderr.write([...new Set(failures)].join('\n') + '\n'); process.exitCode = 1; }
else process.stdout.write('Architecture audit passed (' + sourceFiles.length + ' source files, ' + schemas.length + ' JSON schemas).\n');

