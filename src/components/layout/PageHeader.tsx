import type {ReactNode} from 'react';import {Text} from '@fluentui/react-components';
export interface PageHeaderProps {title:string;description?:string;eyebrow?:string;children?:ReactNode}
export function PageHeader({title,description,eyebrow,children}:PageHeaderProps){return <header className="ui-page-header"><div>{eyebrow&&<Text size={200}>{eyebrow}</Text>}<Text block as="h2" size={700} weight="semibold">{title}</Text>{description&&<Text block as="p">{description}</Text>}</div>{children&&<div className="ui-page-header-actions">{children}</div>}</header>;}
