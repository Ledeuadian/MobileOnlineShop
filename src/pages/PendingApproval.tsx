import React from 'react';
import { IonContent, IonPage, IonButton, IonIcon, IonText } from '@ionic/react';
import { hourglassOutline, logOutOutline } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './PendingApproval.css';

const PendingApproval: React.FC = () => {

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      
      // Clear localStorage first
      localStorage.removeItem('userEmail');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      console.log('User logged out successfully, redirecting to login...');
      
      // Force redirect to login page
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <IonPage>
      <IonContent className="pending-approval-content">
        <div className="pending-approval-container">
          <div className="pending-approval-icon">
            <IonIcon icon={hourglassOutline} size="large" color="warning" />
          </div>
          
          <div className="pending-approval-header">
            <h1>Account Pending Approval</h1>
          </div>
          
          <div className="pending-approval-message">
            <IonText>
              <p>
                Your account registration has been submitted successfully and is currently 
                waiting for admin approval.
              </p>
              <p>
                You will be able to access the application once an administrator 
                reviews and approves your account.
              </p>
              <p>
                Please check back later or contact support if you have any questions.
              </p>
            </IonText>
          </div>
          
          <div className="pending-approval-actions">
            <IonButton 
              expand="block" 
              color="medium" 
              onClick={handleLogout}
              className="logout-button"
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </div>
          
          <div className="pending-approval-footer">
            <IonText color="medium">
              <small>
                If you believe this is an error, please contact your administrator.
              </small>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PendingApproval;
