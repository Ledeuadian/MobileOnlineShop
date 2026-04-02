import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Add startup logging for debugging
console.log('Starting app initialization...');

// ─── LAYER 1: Build-version cache buster ─────────────────────────────────────
// Every new APK/web build gets a unique __APP_BUILD__ stamp (Unix ms) injected
// by Vite. If the stamp stored in localStorage differs from the current one we
// know the user has old cached assets — wipe everything so stale state can't
// cause a white screen.
(function clearStaleCache() {
  try {
    const BUILD_KEY = '__app_build__';
    const currentBuild = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : '';
    const storedBuild = localStorage.getItem(BUILD_KEY);

    if (currentBuild && storedBuild !== currentBuild) {
      console.log('[Cache Buster] New build detected:', currentBuild, '— clearing stale storage...');
      const buildStamp = currentBuild; // capture before clear
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(BUILD_KEY, buildStamp);
      // Async-clear the service-worker / fetch caches
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      }
      console.log('[Cache Buster] Stale cache cleared.');
    }
  } catch (e) {
    console.error('[Cache Buster] Error:', e);
  }
})();

// ─── LAYER 2: White-screen watchdog ──────────────────────────────────────────
// If the #root element still has no children after 10 seconds the app is stuck
// on a white screen. Clear all storage and do a hard reload. A sessionStorage
// flag prevents an infinite reload loop (only re-clears if 60s have passed).
(function installWhiteScreenWatchdog() {
  const TIMEOUT_MS = 10000;
  const LOOP_KEY = '__wdog_cleared_at__';

  setTimeout(() => {
    try {
      const root = document.getElementById('root');
      const hasContent = root && root.children.length > 0;
      if (hasContent) return; // app rendered fine

      const lastClear = parseInt(sessionStorage.getItem(LOOP_KEY) || '0', 10);
      const now = Date.now();
      if (now - lastClear < 60000) {
        console.warn('[Watchdog] White screen detected but skipping clear — was already cleared recently.');
        return;
      }

      console.error('[Watchdog] White screen detected after', TIMEOUT_MS, 'ms — clearing cache and reloading...');
      sessionStorage.setItem(LOOP_KEY, now.toString());
      localStorage.clear();

      const doReload = () => { window.location.reload(); };
      if ('caches' in window) {
        caches.keys()
          .then(keys => Promise.all(keys.map(k => caches.delete(k))))
          .finally(doReload);
      } else {
        doReload();
      }
    } catch (e) {
      console.error('[Watchdog] Error:', e);
    }
  }, TIMEOUT_MS);
})();

// Capacitor browser guard: prevent triggerEvent error if not running on device
declare global {
  interface Window {
    Capacitor?: {
      triggerEvent?: (...args: any[]) => void;
      [key: string]: any;
    };
  }
}
if (typeof window !== 'undefined') {
  if (!window.Capacitor) {
    window.Capacitor = {};
  }
  if (typeof window.Capacitor.triggerEvent !== 'function') {
    window.Capacitor.triggerEvent = () => {};
  }
}

// Catch any uncaught errors (log only — no alert, which would block React mounting)
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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
}