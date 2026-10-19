import { Checkbox as FluentCheckbox } from '@fluentui/react-components';
import type { ValueChangeCallback } from '../types';
export interface CheckboxProps {label:string;checked:boolean;disabled?:boolean;onChange:ValueChangeCallback<boolean>}
export function Checkbox({label,checked,disabled=false,onChange}:CheckboxProps){return <FluentCheckbox className="ui-checkbox" label={label} checked={checked} disabled={disabled} onChange={(_,data)=>onChange({value:data.checked===true})}/>;}
