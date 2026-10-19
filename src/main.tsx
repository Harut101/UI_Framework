import {FluentProvider} from '@fluentui/react-components';
import {guardianTheme} from './theme/guardianTheme';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Playground } from './playground/Playground';
import './styles.css';
import './components/components.css';
createRoot(document.getElementById('root')!).render(<StrictMode><FluentProvider theme={guardianTheme} className="fluent-root"><BrowserRouter><Playground/></BrowserRouter></FluentProvider></StrictMode>);
