import path from 'node:path';
import ts from 'typescript';

const slash = value => value.replaceAll('\\', '/');
export function documentationModel() {
  const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const format = type => checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope).replace(/import\("[^"]+"\)\./g, '');
  const rows = []; const components = []; const symbols = [];
  const exported = node => node.modifiers?.some(item => item.kind === ts.SyntaxKind.ExportKeyword);
  const sourceName = file => slash(path.relative('.', file.fileName));
  const record = (file, owner, member, kind, type, optional = false, defaultValue = '', note = '') =>
    rows.push({ key: owner + '.' + member, file: sourceName(file), owner, member, kind, type, optional, defaultValue, note });

  function fields(file, owner, members) {
    for (const member of members) {
      if ((ts.isPropertySignature(member) || ts.isMethodSignature(member)) && member.name) {
        record(file, owner, member.name.getText(file).replace(/^['"]|['"]$/g, ''), 'contract',
          member.type?.getText(file) ?? format(checker.getTypeAtLocation(member)), Boolean(member.questionToken));
        if (member.type) nested(file, owner + '.' + member.name.getText(file), member.type);
      } else if (ts.isIndexSignatureDeclaration(member)) {
        record(file, owner, '[key]', 'contract', member.getText(file), true);
      }
    }
  }
  function nested(file, owner, node) {
    if (ts.isTypeLiteralNode(node)) fields(file, owner, node.members);
    else if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) node.types.forEach((part, index) => {
      let label = String(index + 1);
      if (ts.isTypeLiteralNode(part)) {
        const discriminator = part.members.find(member => member.name?.getText(file) === 'type');
        if (discriminator?.type && ts.isLiteralTypeNode(discriminator.type)) label = discriminator.type.literal.text;
      }
      nested(file, owner + '[' + label + ']', part);
    });
    else if (ts.isArrayTypeNode(node)) nested(file, owner + '[]', node.elementType);
    else if (ts.isFunctionTypeNode(node)) for (const parameter of node.parameters)
      if (parameter.type) nested(file, owner + '.payload.' + parameter.name.getText(file), parameter.type);
  }

  for (const file of program.getSourceFiles()) {
    const name = sourceName(file);
    if (!name.startsWith('src/runtime/') && !name.startsWith('src/contracts/') && !name.startsWith('src/components/')) continue;
    for (const node of file.statements) {
      if (name.startsWith('src/components/') && !ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node)) continue;
      if (!exported(node) && (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))) {
        const owner = path.basename(name).replace(/\.tsx?$/, '') + '.' + node.name.text;
        symbols.push({ name: owner, file: name, kind: 'internal-type', signature: node.getText(file) });
        if (ts.isInterfaceDeclaration(node)) fields(file, owner, node.members); else nested(file, owner, node.type);
        continue;
      }
      if (!exported(node)) continue;
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        symbols.push({ name: node.name.text, file: name, kind: 'type', signature: node.getText(file) });
        if (ts.isInterfaceDeclaration(node)) fields(file, node.name.text, node.members);
        else nested(file, node.name.text, node.type);
      }
      if (ts.isClassDeclaration(node) && node.name) {
        symbols.push({ name: node.name.text, file: name, kind: 'class' });
        for (const member of node.members) {
          if (member.modifiers?.some(item => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(item.kind))) continue;
          if (ts.isConstructorDeclaration(member)) {
            record(file, node.name.text, 'constructor', 'api', '(' + member.parameters.map(param => param.getText(file)).join(', ') + ')');
            for (const param of member.parameters) if (param.modifiers?.some(item => item.kind === ts.SyntaxKind.ReadonlyKeyword) && !param.modifiers.some(item => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(item.kind)))
              record(file, node.name.text, param.name.getText(file), 'api', param.type?.getText(file) ?? 'unknown', Boolean(param.questionToken), param.initializer?.getText(file) ?? '');
          } else if (member.name && !ts.isPrivateIdentifier(member.name))
            record(file, node.name.text, member.name.getText(file), 'api', format(checker.getTypeAtLocation(member)), Boolean(member.questionToken), ts.isPropertyDeclaration(member) ? member.initializer?.getText(file) ?? '' : '');
        }
      }
      if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations)
        symbols.push({ name: declaration.name.getText(file), file: name, kind: 'value', signature: format(checker.getTypeAtLocation(declaration.name)) });
      if (ts.isFunctionDeclaration(node) && node.name) {
        symbols.push({ name: node.name.text, file: name, kind: 'function', signature: format(checker.getTypeAtLocation(node.name)) });
      }
    }
  }

  const registryFile = program.getSourceFile('src/components/registry.ts');
  const shared = new Map(); const registered = new Map();
  function scan(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(registryFile) === 'sharedComponents' && node.initializer && ts.isObjectLiteralExpression(node.initializer))
      for (const item of node.initializer.properties) if (ts.isShorthandPropertyAssignment(item)) shared.set(item.name.text, item.name.text); else if (ts.isPropertyAssignment(item)) shared.set(item.name.getText(registryFile).replace(/^['"]|['"]$/g, ''), item.initializer.getText(registryFile));
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'register' && node.arguments.length === 2 && ts.isStringLiteral(node.arguments[0])) {
      const expr = node.arguments[1]; const ref = ts.isPropertyAccessExpression(expr) ? shared.get(expr.name.text) : ts.isElementAccessExpression(expr) ? shared.get(expr.argumentExpression.text) : expr.getText(registryFile);
      registered.set(node.arguments[0].text, ref);
    }
    ts.forEachChild(node, scan);
  }
  scan(registryFile);
  registered.set('schema-outlet', 'SchemaOutlet'); registered.set('route-outlet', 'RouteOutlet');
  for (const [schemaType, functionName] of registered) {
    let found;
    for (const file of program.getSourceFiles()) {
      if (!sourceName(file).startsWith('src/')) continue;
      const node = file.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === functionName);
      if (node) { found = { file, node }; break; }
    }
    if (!found) throw new Error('Component function not found: ' + schemaType + '/' + functionName);
    const { file, node } = found;
    const entry = { schemaType, functionName, file: sourceName(file), fields: [] };
    const parameter = node.parameters[0];
    if (parameter) {
      const defaults = new Map();
      if (ts.isObjectBindingPattern(parameter.name)) for (const item of parameter.name.elements)
        if (item.initializer) defaults.set((item.propertyName ?? item.name).getText(file), item.initializer.getText(file));
      const type = checker.getTypeAtLocation(parameter);
      for (const prop of checker.getPropertiesOfType(type)) {
        const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
        const row = { key: 'component:' + schemaType + '.' + prop.name, file: sourceName(file), owner: 'component:' + schemaType, member: prop.name, kind: 'component',
          type: format(checker.getTypeOfSymbolAtLocation(prop, declaration ?? parameter)), optional: Boolean(prop.flags & ts.SymbolFlags.Optional), defaultValue: defaults.get(prop.name) ?? '' };
        entry.fields.push(row); rows.push(row);
      }
      if (parameter.type && ts.isTypeLiteralNode(parameter.type)) for (const member of parameter.type.members)
        if (member.name && member.type) nested(file, 'component:' + schemaType + '.' + member.name.getText(file), member.type);
      if (checker.getIndexInfoOfType(type, ts.IndexKind.String)) record(file, entry.schemaType, '[props]', 'component', 'unknown', true, '', 'Target component passthrough');
    }
    components.push(entry);
  }
  const unique = new Map(rows.map(row => [row.key, row]));
  const normalize = value => typeof value === 'string' ? value.replace(/\r\n?/g, '\n')
    : Array.isArray(value) ? value.map(normalize)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)])) : value;
  return normalize({ rows: [...unique.values()].sort((a,b) => a.key.localeCompare(b.key)), components: components.sort((a,b) => a.schemaType.localeCompare(b.schemaType)), symbols });
}
