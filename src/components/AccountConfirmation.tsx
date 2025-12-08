import React, { useEffect, useState } from 'react';
import { IonContent, IonButton, IonIcon } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './AccountConfirmation.css';

const AccountConfirmation: React.FC = () => {
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔐 AccountConfirmation component loaded');
        console.log('Current URL:', window.location.href);
        console.log('Protocol:', window.location.protocol);
        console.log('Pathname:', window.location.pathname);
        console.log('Search:', window.location.search);
        console.log('Hash:', window.location.hash);
        
        // Check both URL search params and hash for tokens
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        console.log('Search params:', Object.fromEntries(urlParams));
        console.log('Hash params:', Object.fromEntries(hashParams));
        
        // Check for errors
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (errorParam) {
          console.error('❌ Email confirmation error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          return;
        }
        
        // Simply mark as verified - don't try to set session
        console.log('✅ Email verification successful - showing success message');
        setIsVerified(true);
        
        // Check if running in Capacitor (mobile app)
        const isMobile = window.location.protocol === 'capacitor:' || ('Capacitor' in window);
        
        if (isMobile) {
          console.log('Mobile app detected, will redirect to login in 3 seconds...');
          // Redirect to login after 3 seconds on mobile
          setTimeout(() => {
            history.replace('/login');
          }, 3000);
        } else {
          console.log('Web browser detected, showing success message without redirect');
        }
        
      } catch (err) {
        console.error('Error during email confirmation:', err);
        setError('An error occurred during email confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [history]);

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

  if (isVerified) {
    const isMobile = window.location.protocol === 'capacitor:' || ('Capacitor' in window);
    
    return (
      <IonContent className="account-confirmation-content">
        <div className="confirmation-container">
          <IonIcon icon={checkmarkCircleOutline} className="confirmation-check" />
          <h2 className="confirmation-title">Email Verified Successfully!</h2>
          <p className="confirmation-message">
            Your email address has been confirmed. You can now log in to your account.
          </p>
          {isMobile && (
            <p className="confirmation-message" style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Redirecting to login page...
            </p>
          )}
          {!isMobile && (
            <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <IonButton expand="block" className="confirmation-btn">
                Go to Login
              </IonButton>
            </Link>
          )}
        </div>
      </IonContent>
    );
  }

  return null;
};

export default AccountConfirmation;
