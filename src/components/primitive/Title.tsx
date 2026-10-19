import { Text } from '@fluentui/react-components';
export interface TitleProps {value:string;level?:1|2|3|4;subtitle?:string}
const tags={1:'h1',2:'h2',3:'h3',4:'h4'} as const;
export function Title({value,level=2,subtitle}:TitleProps){return <div className="ui-title"><Text as={tags[level]} size={level===1?800:level===2?700:level===3?600:400} weight="semibold">{value}</Text>{subtitle&&<Text block as="p">{subtitle}</Text>}</div>;}
