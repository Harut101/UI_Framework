import { Field, SearchBox } from '@fluentui/react-components';
import type { ValueChangeCallback } from '../types';
import { useUiStyles } from '../uiStyles';
export interface SearchInputProps { value:string;label?:string;placeholder?:string;disabled?:boolean;onChange:ValueChangeCallback<string>;onSearch?:ValueChangeCallback<string> }
export function SearchInput({value,label='Search',placeholder='Search…',disabled=false,onChange,onSearch}:SearchInputProps){const styles=useUiStyles();return <Field className={`ui-field ${styles.field}`} label={label}><SearchBox className={`ui-search ${styles.control}`} value={value} placeholder={placeholder} disabled={disabled} dismiss={{'aria-label':`Clear ${label.toLowerCase()}`}} onChange={(_,data)=>onChange({value:data.value})} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();onSearch?.({value});}}}/></Field>;}
