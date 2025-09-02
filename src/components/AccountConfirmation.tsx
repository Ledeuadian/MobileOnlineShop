import React from 'react';
import { IonContent, IonButton } from '@ionic/react';
import { Link } from 'react-router-dom';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import './AccountConfirmation.css';

const AccountConfirmation: React.FC = () => {
  return (
    <IonContent className="account-confirmation-content">
      <div className="confirmation-container">
        <IonIcon icon={checkmarkCircleOutline} className="confirmation-check" />
        <h2 className="confirmation-title">Email Verified</h2>
        <p className="confirmation-message">Your email address was successfully verified.</p>
        <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
          <IonButton expand="block" className="confirmation-btn">Back to Login</IonButton>
        </Link>
      </div>
    </IonContent>
  );
};

export default AccountConfirmation;
