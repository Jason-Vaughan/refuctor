import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🏦 Refuctor Dashboard initializing...');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('📊 Debt Collector interface loaded successfully'); 