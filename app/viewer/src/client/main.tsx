import React from 'react';
import { createRoot } from 'react-dom/client';
import { Viewer } from './viewer';
import './viewer.css';

const root = document.getElementById('root');
if (!root) throw new Error('Viewer root element is missing');
createRoot(root).render(
  <React.StrictMode>
    <Viewer />
  </React.StrictMode>,
);
