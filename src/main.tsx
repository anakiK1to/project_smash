import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import AppRouter from './app/router';
import theme from './app/theme';

const isElectron =
  window.location.protocol === 'file:' ||
  navigator.userAgent.toLowerCase().includes('electron');

const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppRouter />
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);
