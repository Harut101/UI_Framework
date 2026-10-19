// @vitest-environment jsdom
import './fluent-setup';
import {act, StrictMode} from 'react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import type {Root} from 'react-dom/client';
import {createFluentRoot} from './fluent-root';
import {chooseOption,dropdown} from './fluent-helpers';
import {Select} from '../src/components/primitive/Select';
import {Icon} from '../src/components/icons';
import {Button} from '../src/components/primitive/Button';
import {Notice} from '../src/playground/ui/Notice';
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root;let container:HTMLDivElement;
beforeEach(()=>{container=document.createElement('div');document.body.append(container);root=createFluentRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();});
describe('Fluent implementation behind public UI contracts',()=>{
  it('adapts a real Dropdown selection to the unchanged plain value callback',async()=>{
    const onChange=vi.fn();
    await act(async()=>root.render(<Select label="Department" value="engineering" options={[{value:'engineering',label:'Engineering'},{value:'finance',label:'Finance'},{value:'disabled',label:'Unavailable',disabled:true}]} onChange={onChange}/>));
    expect(dropdown(container,'Department').textContent).toBe('Engineering');
    expect(container.querySelector('.fui-Dropdown')).not.toBeNull();
    await chooseOption(container,'Department','Finance');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({value:'finance'});
    await act(async()=>dropdown(container,'Department').click());
    const unavailable=[...document.querySelectorAll<HTMLElement>('[role=option]')].find(option=>option.textContent==='Unavailable')!;
    expect(unavailable.getAttribute('aria-disabled')).toBe('true');
  });
  it('keeps missing selections and unknown semantic icons safe',async()=>{
    await act(async()=>root.render(<><Select label="Empty" value="missing" options={[]} onChange={vi.fn()}/><Icon name="unknown-schema-icon"/></>));
    expect(dropdown(container,'Empty').textContent).toBe('');
    expect(container.querySelector('svg[data-fui-icon]')).not.toBeNull();
  });
  it('shares one focus dependency across StrictMode remounts',async()=>{
    const error=vi.spyOn(console,'error');
    await act(async()=>root.render(<StrictMode><Button label="Action" onClick={vi.fn()}/></StrictMode>));
    await act(async()=>root.render(<StrictMode><Select label="Choice" value="a" options={[{value:'a',label:'A'}]} onChange={vi.fn()}/></StrictMode>));
    await act(async()=>root.render(null));
    expect(error.mock.calls.flat().join(' ')).not.toContain('disposed incorrectly');
  });
  it('renders and dismisses notifications through the real Fluent toaster',async()=>{
    const onDismiss=vi.fn();
    await act(async()=>root.render(<StrictMode><Notice message="Completed" tone="success" onDismiss={onDismiss}/></StrictMode>));
    const toasts=[...document.querySelectorAll('.fui-Toast')].filter(toast=>toast.textContent?.includes('Completed'));
    expect(toasts).toHaveLength(1);
    const dismiss=[...document.querySelectorAll<HTMLElement>('button')].find(button=>button.textContent==='Dismiss')!;
    await act(async()=>{dismiss.click();await new Promise(resolve=>setTimeout(resolve,250));});
    expect(onDismiss).toHaveBeenCalled();
  });
});
