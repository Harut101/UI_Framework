import type {ReactNode} from 'react';
import {OverlayDrawer,DrawerHeader,DrawerHeaderTitle,DrawerBody,Button,Text,mergeClasses} from '@fluentui/react-components';
import {Icon} from '../icons';import {useUiStyles} from '../uiStyles';
export interface SidePanelProps {title:string;description?:string;size?:'medium'|'wide';open?:boolean;children?:ReactNode;onClose?:()=>void}
export function SidePanel({title,description,size='medium',open=true,children,onClose}:SidePanelProps){const styles=useUiStyles();if(!open)return null;return <OverlayDrawer open className={mergeClasses('ui-side-panel',styles.drawer,size==='wide'&&styles.wideDrawer)} position="end" onOpenChange={(_,data)=>{if(!data.open)onClose?.();}} aria-label={title}><DrawerHeader className="ui-side-panel-heading"><DrawerHeaderTitle action={onClose&&<Button appearance="subtle" aria-label={`Close ${title.toLowerCase()}`} icon={<Icon name="close"/>} onClick={()=>onClose()}/ >}>{title}</DrawerHeaderTitle>{description&&<Text block as="p">{description}</Text>}</DrawerHeader><DrawerBody className="ui-side-panel-body">{children}</DrawerBody></OverlayDrawer>;}

