import { Switch as FluentSwitch } from '@fluentui/react-components';
import type { ValueChangeCallback } from '../types';
export interface SwitchProps {label:string;checked:boolean;disabled?:boolean;onChange:ValueChangeCallback<boolean>}
export function Switch({label,checked,disabled=false,onChange}:SwitchProps){return <FluentSwitch className="ui-switch" label={label} checked={checked} disabled={disabled} onChange={(_,data)=>onChange({value:data.checked})}/>;}
