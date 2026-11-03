import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Viewer } from './viewer';
import './viewer.css';
import { viewerTheme } from './theme';

const root = document.getElementById('root');
if (!root) throw new Error('Viewer root element is missing');
createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider theme={viewerTheme}>
      <CssBaseline />
      <Viewer />
    </ThemeProvider>
  </React.StrictMode>,
);
