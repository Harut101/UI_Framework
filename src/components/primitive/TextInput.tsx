import { Field, Input } from '@fluentui/react-components';
import type { ValueChangeCallback } from '../types';
import { useUiStyles } from '../uiStyles';
export interface TextInputProps { label:string;value:string;placeholder?:string;disabled?:boolean;onChange:ValueChangeCallback<string> }
export function TextInput({label,value,placeholder,disabled=false,onChange}:TextInputProps){const styles=useUiStyles();return <Field className={`ui-field ${styles.field}`} label={label}><Input className={`ui-input ${styles.control}`} value={value} placeholder={placeholder} disabled={disabled} onChange={(_,data)=>onChange({value:data.value})}/></Field>;}
