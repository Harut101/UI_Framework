import {Textarea} from '@fluentui/react-components';
import { Button as ToolButton } from '@fluentui/react-components';
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { indentSelection, insertIndentedLine, type EditorEdit } from './editorUtils';
export function JsonEditor({ value, onChange, onCommit, errorLine }: {
  value: string; onChange: (value: string) => void; onCommit: () => void; errorLine?: number;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [tabIndent, setTabIndent] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const updateCursor = () => {
    const element = textarea.current;
    if (!element) return;
    const lines = element.value.slice(0, element.selectionStart).split('\n');
    setCursor({ line: lines.length, column: lines.at(-1)!.length + 1 });
  };
  useLayoutEffect(() => {
    if (selection.current && textarea.current) {
      textarea.current.setSelectionRange(selection.current.start, selection.current.end);
      selection.current = null;
    }
    updateCursor();
  }, [value]);
  const applyEdit = (edit: EditorEdit) => { selection.current = { start: edit.start, end: edit.end }; onChange(edit.value); };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && (event.key === 'Enter' || event.key.toLowerCase() === 's')) {
      event.preventDefault(); onCommit(); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') { event.preventDefault(); setTabIndent(previous => !previous); return; }
    const element = event.currentTarget;
    if (event.key === 'Tab' && tabIndent) { event.preventDefault(); applyEdit(indentSelection(value, element.selectionStart, element.selectionEnd, event.shiftKey)); }
    if (event.key === 'Enter') { event.preventDefault(); applyEdit(insertIndentedLine(value, element.selectionStart, element.selectionEnd)); }
  };
  const lines = value.split('\n').length;
  return <><div className="schema-json-editor"><div className="schema-line-gutter" ref={gutter} aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index} className={errorLine === index + 1 ? 'error-line' : ''}>{index + 1}</span>)}</div><Textarea resize="none" textarea={{ref:textarea, className:"schema-json-textarea",wrap:"off", onSelect:updateCursor, onScroll:event=>{if(gutter.current)gutter.current.scrollTop=event.currentTarget.scrollTop;}}} aria-label="View schema JSON" aria-describedby="json-editor-help" className="schema-json-control" value={value} spellCheck={false} autoCapitalize="off" autoCorrect="off" onChange={event => onChange(event.target.value)} onKeyDown={keyDown}/></div><div className="schema-editor-status"><span>Ln {cursor.line}, Col {cursor.column}</span><span>JSON · {lines} lines</span><ToolButton type="button" aria-pressed={tabIndent} onClick={() => setTabIndent(!tabIndent)}>{tabIndent ? 'Tab indents' : 'Tab moves focus'}</ToolButton></div><p id="json-editor-help" className="schema-editor-help">Ctrl/⌘ + Enter applies now. Tab indents; Ctrl/⌘ + M toggles Tab focus navigation.</p></>;
}
