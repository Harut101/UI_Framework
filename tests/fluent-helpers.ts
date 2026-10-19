import {act} from 'react';
export function dropdown(scope:ParentNode,label:string):HTMLElement{
 const field=[...scope.querySelectorAll('.ui-field')].find(node=>node.querySelector('label')?.textContent===label);
 const trigger=field?.querySelector<HTMLElement>('[role="combobox"]');if(!trigger)throw new Error('Missing Dropdown '+label);return trigger;
}
export async function chooseOption(scope:ParentNode,label:string,text:string){
 await act(async()=>dropdown(scope,label).click());
 const option=[...document.querySelectorAll<HTMLElement>('[role="option"]')].find(node=>node.textContent===text);if(!option)throw new Error('Missing option '+text);
 await act(async()=>option.click());
}
