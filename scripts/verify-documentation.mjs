import fs from 'node:fs';
import path from 'node:path';
import { documentationModel } from './documentation-model.mjs';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry.ts';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet.tsx';
import { validateApplicationDefinition, validateViewDefinition } from '../src/runtime/shared/validation.ts';
import { readTreeNodes } from '../src/runtime/data-tree/treeData.ts';
import { normalizeFragmentDefinition } from '../src/runtime/fragment/normalizeFragmentDefinition.ts';

const write = process.argv.includes('--write');
const directory = 'docs/production';
const metadata = JSON.parse(fs.readFileSync('scripts/documentation-descriptions.json', 'utf8'));
const model = documentationModel();
const problems = [];
for (const row of model.rows) {
  row.description = metadata.overrides[row.key] ?? metadata.descriptions[row.member];
  if (!row.description?.trim()) problems.push('Missing property description: ' + row.key);
}
for (const symbol of model.symbols.filter(item => item.kind === 'function'))
  if (!metadata.functions[symbol.name]) problems.push('Missing function description: ' + symbol.name);
for (const symbol of model.symbols.filter(item=>item.kind==='value'))
  if (!metadata.values[symbol.name]) problems.push('Missing exported value description: '+symbol.name);
if (problems.length) throw new Error(problems.join('\n'));
for (const component of model.components) if (!metadata.components[component.schemaType]) throw new Error('Missing component description: '+component.schemaType);
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','\\|').replaceAll('\n',' ');
const code = value => '<code>' + escape(value) + '</code>';
const source = file => '[' + file + '](../../' + file + ')';
const table = rows => '| Поле/член | Тип / сигнатура | Optional | Default в реализации | Назначение |\n| --- | --- | --- | --- | --- |\n' +
  rows.map(row => '| ' + code(row.member) + ' | ' + code(row.type) + ' | ' + (row.optional ? 'Да' : 'Нет') + ' | ' +
    (row.defaultValue ? code(row.defaultValue) : '—') + ' | ' + row.description + ' |').join('\n') + '\n';
let components = '# Все registry-компоненты: props, callbacks и defaults\n\n[Оглавление](README.md) · [правила JSON](schema-reference.md)\n\n' +
  'Сгенерировано из TypeScript signatures и фактических register-вызовов. Optional относится к TS; — в Default означает отсутствие явного destructuring default, а не гарантированный fallback. Поля callback связываются через handlers; остальные через props/bindings. children в JSON задаётся отдельным полем. API data shapes перечислены в contracts appendix.\n\n' +
  'Base registry создаёт createComponentRegistry; application adapters добавляет registerApplicationComponents; route-outlet — registerRouteOutlet. Fluent-specific props не становятся schema API автоматически.\n\n';
for (const component of model.components) {
  components += '## ' + component.schemaType + '\n\n' + metadata.components[component.schemaType] + '\n\nРеализация: ' + code(component.functionName) + ' — ' + source(component.file) + '.\n\n';
  components += component.fields.length ? table(component.fields.map(field => model.rows.find(row => row.key === field.key))) :
    'Прямых adapter props нет. Конфигурация берётся из RuntimeContext/NodeDefinitionContext/RouteRuntimeContext; top-level поля описаны в schema reference.\n';
  if (component.schemaType === 'data-tree') components += '\nДополнительные props передаются target component; runtime генерирует onRetryChildren. См. [DATA architecture](data-navigation.md).\n';
  if (component.fields.some(field => /^on[A-Z]/.test(field.member))) components += '\nPayload callbacks: точный тип выше; доступны как $event в local named action. [Семантика callbacks](expressions-actions.md).\n';
  components += '\n';
}
let appendix = '# Все контракты, runtime API и модули\n\n[Оглавление](README.md) · [семантика author JSON](schema-reference.md)\n\n' +
  'Автоматически сверяемый индекс объявленных полей, вложенных type literals, props всех registry functions и публичных class members. Наследуемые поля смотрите у базового типа ниже; сигнатуры сохраняют extends/Omit. Внутренние записи помечены исходным именем модуля. Optional не задаёт default. Это TypeScript/reference appendix, не обещание дополнительных author JSON полей.\n\n';
for (const owner of [...new Set(model.rows.filter(row=>row.kind !== 'component').map(row => row.owner))]) {
  const rows = model.rows.filter(row => row.owner === owner);
  appendix += '## ' + owner + '\n\nИсточник: ' + source(rows[0].file) + '.\n\n' + table(rows) + '\n';
}
appendix += '## Полные объявления типов и наследование\n\n';
for (const symbol of model.symbols.filter(item => ['type','internal-type'].includes(item.kind))) {
  appendix += '### ' + symbol.name + '\n\n' + source(symbol.file) + '\n\n~~~typescript\n' + symbol.signature + '\n~~~\n\n';
}
appendix += '## Экспортируемые runtime функции\n\n';
for (const symbol of model.symbols.filter(item=>item.kind==='function')) {
  appendix += '### ' + symbol.name + '\n\n' + metadata.functions[symbol.name] + '\n\n' + source(symbol.file) + '\n\n~~~typescript\n' + symbol.signature + '\n~~~\n\n';
}
appendix += '## Экспортируемые runtime значения и React contexts\n\n';
for (const symbol of model.symbols.filter(item=>item.kind==='value'))
  appendix += '### '+symbol.name+'\n\n'+metadata.values[symbol.name]+'\n\n'+source(symbol.file)+'\n\n~~~typescript\n'+symbol.signature+'\n~~~\n\n';
const runtimeFiles = fs.readdirSync('src/runtime',{recursive:true}).filter(name=>/\.tsx?$/.test(name)).map(name=>'src/runtime/'+name.replaceAll('\\','/')).sort();
appendix += '## Полный индекс runtime-модулей\n\n' + runtimeFiles.map(file => '- ' + source(file)).join('\n') + '\n';
const outputs = {
  'components-reference.md': components,
  'contracts-api-reference.md': appendix,
  'coverage.json': JSON.stringify({
    componentTypes: model.components.map(component=>component.schemaType),
    propertyAndApiMemberCount: model.rows.length,
    runtimeModuleCount: runtimeFiles.length,
    runtimeModules: runtimeFiles,
    fields: model.rows.map(({key,file,owner,member,kind,type,optional})=>({key,file,owner,member,kind,type,optional})),
  },null,2)+'\n',
};
for (const [name,content] of Object.entries(outputs)) {
  const file = path.join(directory,name);
  if (write) fs.writeFileSync(file,content);
  else if (!fs.existsSync(file) || fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n') !== content) problems.push('Stale/missing generated reference: ' + file + ' (npm run docs:generate)');
}
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry()));
const actualTypes = registry.list();
if (JSON.stringify(actualTypes) !== JSON.stringify(model.components.map(component=>component.schemaType)))
  problems.push('Registry types differ from documented components');
const manifest = JSON.parse(fs.readFileSync(path.join(directory,'examples.json'),'utf8'));
for (const entry of manifest) {
  const file = path.resolve(directory,entry.path);
  try {
    const value = JSON.parse(fs.readFileSync(file,'utf8'));
    if (entry.kind === 'application') validateApplicationDefinition(value,registry);
    else if (entry.kind === 'view') validateViewDefinition(value,registry);
    else if (entry.kind === 'fragment') normalizeFragmentDefinition(value,registry);
    else if (entry.kind === 'navigation-data') readTreeNodes(value);
    else throw new Error('Unknown example kind');
  } catch(error) { problems.push(file + ': ' + error.message); }
}
const appExample = JSON.parse(fs.readFileSync('docs/examples/production/application.json','utf8'));
const viewExample = JSON.parse(fs.readFileSync('docs/examples/production/view.json','utf8'));
if (JSON.stringify(appExample.views[viewExample.id]) !== JSON.stringify(viewExample)) problems.push('Embedded and standalone example View differ');
const actionTypes = new Set();
const definedActionTypes = [...new Set(model.rows.map(row=>/^ActionDefinition\[(.+)\]$/.exec(row.owner)?.[1]).filter(Boolean))].sort();
const visit = value => { if (value && typeof value === 'object') { if (value.actions && !Array.isArray(value.actions)) for (const action of Object.values(value.actions)) actionTypes.add(action.type); Object.values(value).forEach(visit); } };
visit(appExample);
for (const type of definedActionTypes)
  if (!actionTypes.has(type)) problems.push('Missing action type example: '+type);
for (const name of fs.readdirSync(directory).filter(name=>name.endsWith('.md'))) {
  const file = path.join(directory,name);
  const content = fs.readFileSync(file,'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g,'').split('#')[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(target)))) problems.push('Broken local link in '+file+': '+target);
  }
}
if (problems.length) { process.stderr.write(problems.join('\n')+'\n'); process.exitCode=1; }
else process.stdout.write('Documentation verified: '+model.rows.length+' properties/API members, '+model.components.length+' component types, '+runtimeFiles.length+' runtime modules, '+manifest.length+' valid JSON examples.\n');
