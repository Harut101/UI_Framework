import { Button as FluentButton, useRestoreFocusTarget } from '@fluentui/react-components';
export interface ButtonProps { label:string; disabled?:boolean; variant?:'primary'|'secondary'|'ghost'; onClick:()=>void }
export function Button({label,disabled=false,variant='primary',onClick}:ButtonProps){const restoreFocus=useRestoreFocusTarget();return <FluentButton {...restoreFocus} className={`ui-button ${variant}`} appearance={variant==='ghost'?'subtle':variant} disabled={disabled} onClick={()=>onClick()}>{label}</FluentButton>;}
