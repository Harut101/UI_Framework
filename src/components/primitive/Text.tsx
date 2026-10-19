import { Text as FluentText } from '@fluentui/react-components';
export interface TextProps {value:string;className?:string}
export function Text({value,className}:TextProps){return <FluentText block as="p" className={className}>{value}</FluentText>;}
