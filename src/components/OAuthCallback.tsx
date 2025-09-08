import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonSpinner, IonText } from '@ionic/react';
import { createUserFromOAuthSession, checkUserApprovalStatus } from '../services/supabaseService';

const OAuthCallback: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent multiple executions
      if (processed) {
        console.log('OAuth callback already processed, skipping...');
        return;
      }

      try {
        console.log('Processing OAuth callback...');
        setProcessed(true);
        
        // Create user from OAuth session
        const result = await createUserFromOAuthSession();
        
        if (result.success || result.message === 'User already exists') {
          const userEmail = result.data?.email;
          
          if (userEmail) {
            // Store email in localStorage
            localStorage.setItem('userEmail', userEmail);
            
            // Check user type and redirect accordingly
            const approvalResult = await checkUserApprovalStatus(userEmail);
            
            console.log('User approval status:', approvalResult);
            
            // Check if user is pending approval
            if (approvalResult?.data?.approval_status === 'pending') {
              // User is pending approval - redirect to pending page
              history.replace('/pending-approval');
            } else if (approvalResult?.data?.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
              // Admin user - redirect to admin dashboard
              history.replace('/admin-dashboard');
            } else if (approvalResult?.data?.userTypeCode === 2 && approvalResult.data.approval_status === 'approved') {
              // DTI user - redirect to DTI dashboard
              history.replace('/dti-dashboard');
            } else if (approvalResult?.data?.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
              // Store user - redirect to store dashboard  
              history.replace('/store-dashboard');
            } else {
              // Regular user or others - redirect to home
              history.replace('/home');
            }
          } else {
            setError('Unable to retrieve user email from OAuth session');
            setLoading(false);
          }
        } else if (result.error) {
          console.error('OAuth user creation error:', result.error);
          setError(result.error);
          setLoading(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Failed to process OAuth login');
        setLoading(false);
      }
    };
    
    // Add a small delay to ensure OAuth session is properly set
    setTimeout(handleOAuthCallback, 1000);
  }, [history, processed]);

  if (loading) {
    return (
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: '20px'
        }}>
          <IonSpinner name="crescent" />
          <IonText>
            <p>Completing OAuth login...</p>
          </IonText>
        </div>
      </IonContent>
    );
  }

  if (error) {
    return (
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: '20px'
        }}>
          <IonText color="danger">
            <h3>OAuth Login Failed</h3>
            <p>{error}</p>
          </IonText>
          <button 
            onClick={() => history.replace('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3880ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Return to Login
          </button>
        </div>
      </IonContent>
    );
  }

  return null;
};

export default OAuthCallback;
