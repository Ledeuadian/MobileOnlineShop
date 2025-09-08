import React, { useEffect, useState } from 'react';
import { IonContent, IonButton, IonSpinner, IonIcon } from '@ionic/react';
import { Link } from 'react-router-dom';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './AccountConfirmation.css';

const AccountConfirmation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if this is an email confirmation callback
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set the session using the tokens from the email confirmation
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setError('Failed to confirm email. Please try again.');
          } else {
            console.log('Email confirmed successfully!');
          }
        } else {
          // No tokens in URL, assume email was already confirmed
          console.log('No confirmation tokens found, assuming email already confirmed');
        }
      } catch (err) {
        console.error('Error during email confirmation:', err);
        setError('An error occurred during email confirmation.');
      } finally {
        setIsLoading(false);
      }
    };

    handleEmailConfirmation();
  }, []);

  if (isLoading) {
    return (
      <IonContent className="account-confirmation-content">
        <div className="confirmation-container">
          <IonSpinner name="crescent" />
          <p className="confirmation-message">Confirming your email...</p>
        </div>
      </IonContent>
    );
  }

  if (error) {
    return (
      <IonContent className="account-confirmation-content">
        <div className="confirmation-container">
          <IonIcon icon={alertCircleOutline} className="confirmation-error" />
          <h2 className="confirmation-title">Email Confirmation Failed</h2>
          <p className="confirmation-message">{error}</p>
          <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
            <IonButton expand="block" className="confirmation-btn" color="danger">
              Back to Login
            </IonButton>
          </Link>
        </div>
      </IonContent>
    );
  }

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
