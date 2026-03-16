import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { timeOutline, logOutOutline } from 'ionicons/icons';
import { idleTimeout } from '../services/idleTimeoutService';

interface IdleTimeoutWarningProps {
  isOpen: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

const IdleTimeoutWarning: React.FC<IdleTimeoutWarningProps> = ({
  isOpen,
  secondsLeft,
  onStay,
  onLogout
}) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')} minutes`
    : `${seconds} second${seconds !== 1 ? 's' : ''}`;

  const handleStay = () => {
    idleTimeout.extendSession();
    onStay();
  };

  return (
    <IonModal
      isOpen={isOpen}
      backdropDismiss={false}
      style={{ '--height': 'auto', '--border-radius': '16px' }}
    >
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon icon={timeOutline} />
            Session Expiring Soon
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <IonIcon
            icon={timeOutline}
            style={{ fontSize: '3rem', color: 'var(--ion-color-warning)', marginBottom: 16 }}
          />
          <IonText>
            <p style={{ fontSize: '1rem', marginBottom: 8 }}>
              You've been inactive. Your session will expire in:
            </p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ion-color-warning)', margin: '8px 0 24px' }}>
              {display}
            </h2>
            <p style={{ color: 'var(--ion-color-medium)', fontSize: '0.9rem' }}>
              Click "Stay Logged In" to continue your session.
            </p>
          </IonText>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <IonButton
              expand="block"
              color="medium"
              fill="outline"
              style={{ flex: 1 }}
              onClick={onLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Log Out Now
            </IonButton>
            <IonButton
              expand="block"
              color="primary"
              style={{ flex: 1 }}
              onClick={handleStay}
            >
              Stay Logged In
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default IdleTimeoutWarning;
