import type {ReactNode} from 'react';
import {Card as FluentCard,CardHeader,Text,mergeClasses} from '@fluentui/react-components';
import {useUiStyles} from '../uiStyles';
export interface CardProps {title?:string;description?:string;children?:ReactNode;className?:string}
export function Card({title,description,children,className=''}:CardProps){const styles=useUiStyles();return <FluentCard role="region" className={mergeClasses('ui-card',styles.surface,className)}>{(title||description)&&<CardHeader className="ui-card-heading" header={title&&<Text block as="h3" weight="semibold">{title}</Text>} description={description&&<Text block as="p">{description}</Text>}/ >}{children&&<div className="ui-card-body">{children}</div>}</FluentCard>;}
