import { Field, Dropdown, Option } from '@fluentui/react-components';
import { useUiStyles } from '../uiStyles';
import type { ValueChangeCallback } from '../types';
export interface SelectOption {value:string;label:string;disabled?:boolean}
export interface SelectProps {label:string;options:SelectOption[];value:string;disabled?:boolean;onChange:ValueChangeCallback<string>}
export function Select({label,options,value,disabled=false,onChange}:SelectProps){const styles=useUiStyles();return <Field label={label} className={`ui-field ${styles.field}`}><Dropdown className={`ui-input ${styles.control}`} value={options.find(option=>option.value===value)?.label??''} selectedOptions={[value]} disabled={disabled} inlinePopup onOptionSelect={(_,data)=>{if(data.optionValue!==undefined)onChange({value:data.optionValue});}}>{options.map(option=><Option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</Option>)}</Dropdown></Field>;}
