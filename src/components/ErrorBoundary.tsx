import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo);
    
    // Show alert with error details for debugging
    setTimeout(() => {
      alert(`App Error: ${error.message}\n\nCheck console for details.`);
    }, 100);
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
                onClick={() => window.location.reload()}
                color="primary"
              >
                Restart App
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