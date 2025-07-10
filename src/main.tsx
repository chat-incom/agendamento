console.log('main.tsx initialized at', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
