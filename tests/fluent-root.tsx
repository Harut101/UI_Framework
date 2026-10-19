import {createRoot,type Root} from 'react-dom/client';import {FluentProvider} from '@fluentui/react-components';import {guardianTheme} from '../src/theme/guardianTheme';
// Use the same design-system boundary as the application; never mock Fluent controls.
export function createFluentRoot(container:HTMLElement):Root {const root=createRoot(container);return {render:children=>root.render(<FluentProvider theme={guardianTheme}>{children}</FluentProvider>),unmount:()=>root.unmount()};}
