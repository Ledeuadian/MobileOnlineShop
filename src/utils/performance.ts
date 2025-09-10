// Performance monitoring utility
export const measurePerformance = () => {
  // Only measure in development or when explicitly enabled
  if (import.meta.env.DEV || localStorage.getItem('measure-performance') === 'true') {
    console.log('Performance measurement enabled');
    // Note: Install web-vitals package for production metrics
    // npm install web-vitals
  }
};

// Bundle size analysis helper
export const logBundleInfo = () => {
  if (import.meta.env.DEV) {
    console.log('App loaded successfully');
    console.log('Bundle chunks loaded:', performance.getEntriesByType('navigation'));
  }
};

// Database query performance tracker
export const trackDbQuery = async <T>(queryName: string, queryPromise: Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await queryPromise;
    const end = performance.now();
    if (import.meta.env.DEV) {
      console.log(`DB Query "${queryName}" took ${(end - start).toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    const end = performance.now();
    if (import.meta.env.DEV) {
      console.error(`DB Query "${queryName}" failed after ${(end - start).toFixed(2)}ms:`, error);
    }
    throw error;
  }
};
