export interface EditorEdit { value: string; start: number; end: number }
export function indentSelection(value: string, start: number, end: number, outdent: boolean): EditorEdit {
  if (!outdent && start === end) return { value: value.slice(0, start) + '  ' + value.slice(end), start: start + 2, end: start + 2 };
  const firstLine = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1;
  const lastBoundary = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const breakAt = value.indexOf('\n', lastBoundary);
  const lastLine = breakAt === -1 ? value.length : breakAt;
  const lines = value.slice(firstLine, lastLine).split('\n');
  let changed = 0;
  let firstChange = 0;
  const replacement = lines.map((line, index) => {
    const removed = outdent ? (line.startsWith('\t') ? 1 : Math.min(2, /^ */.exec(line)![0].length)) : 0;
    const difference = outdent ? -removed : 2;
    if (index === 0) firstChange = difference;
    changed += difference;
    return outdent ? line.slice(removed) : '  ' + line;
  }).join('\n');
  return { value: value.slice(0, firstLine) + replacement + value.slice(lastLine), start: Math.max(firstLine, start + firstChange), end: Math.max(firstLine, end + changed) };
}
export function insertIndentedLine(value: string, start: number, end: number): EditorEdit {
  const before = value.slice(0, start);
  const line = before.slice(before.lastIndexOf('\n') + 1);
  const indent = /^\s*/.exec(line)![0];
  const opens = /[[{]\s*$/.test(line);
  const inside = indent + (opens ? '  ' : '');
  const closes = opens && /^[ \t]*[\]}]/.test(value.slice(end));
  const insertion = '\n' + inside + (closes ? '\n' + indent : '');
  return { value: before + insertion + value.slice(end), start: start + 1 + inside.length, end: start + 1 + inside.length };
}
