import {resetDemoActivity} from './db/resetDemoActivity';
import {resetRequestedWorkItems} from './db/resetRequestedWorkItems';
import {reopenRequestedRepair,resetRequestedScreenRepair} from './db/reopenRequestedRepair';
import {resetAttendanceOnce} from './db/resetAttendance';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import './styles/language.css';
import './styles/readability.css';
import './styles/visual-theme.css';
import './styles/theme-modes.css';
import './styles/dark-contrast.css';
import './styles/interface-polish.css';
import './styles/site-refinement.css';

resetDemoActivity(localStorage);
resetAttendanceOnce(localStorage);
reopenRequestedRepair(localStorage);
resetRequestedScreenRepair(localStorage);
resetRequestedWorkItems(localStorage);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);

