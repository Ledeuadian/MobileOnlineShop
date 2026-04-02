import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  clearing: boolean;
}

/** Clears localStorage, sessionStorage, and CacheStorage, then reloads. */
async function clearCacheAndReload() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (e) {
    console.error('Cache clear failed:', e);
  } finally {
    window.location.reload();
  }
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    clearing: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <IonText color="danger">
                <h2>Something went wrong</h2>
              </IonText>
              <p>The app encountered an error and needs to restart.</p>
              <p><strong>Error:</strong> {this.state.error?.message}</p>
              <IonButton
                disabled={this.state.clearing}
                onClick={async () => {
                  this.setState({ clearing: true });
                  await clearCacheAndReload();
                }}
                color="primary"
              >
                {this.state.clearing ? 'Clearing cache...' : 'Clear Cache & Restart'}
              </IonButton>
              <IonButton
                fill="outline"
                color="medium"
                style={{ marginTop: '12px' }}
                onClick={() => window.location.reload()}
              >
                Restart Without Clearing
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
