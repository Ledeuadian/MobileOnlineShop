import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Add startup logging for debugging
console.log('Starting app initialization...');

// Catch any uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  alert(`Uncaught Error: ${event.error?.message || 'Unknown error'}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  alert(`Promise Rejection: ${event.reason?.message || event.reason || 'Unknown rejection'}`);
});

try {
  console.log('Getting root container...');
  const container = document.getElementById('root');
  
  if (!container) {
    throw new Error('Root container not found');
  }
  
  console.log('Creating React root...');
  const root = createRoot(container);
  
  console.log('Rendering app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to initialize app:', error);
  alert(`Initialization Error: ${(error as Error).message}`);
}