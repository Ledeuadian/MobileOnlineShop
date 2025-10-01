import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonSpinner, IonText } from '@ionic/react';
import { createUserFromOAuthSession, checkUserApprovalStatus, supabase } from '../services/supabaseService';

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
        console.log('🔐 Processing OAuth callback...');
        console.log('Current URL:', window.location.href);
        console.log('URL search params:', window.location.search);
        console.log('URL hash:', window.location.hash);
        setProcessed(true);

        // Helper: dump parsed URL params (search + hash) and combined view for easier debugging
        const dumpUrlDetails = () => {
          try {
            const raw = window.location.href;
            const parsedSearch = Object.fromEntries(new URLSearchParams(window.location.search));
            const parsedHash = Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)));
            const combined = { ...parsedSearch, ...parsedHash };
            console.log('OAuth URL dump -> raw:', raw);
            console.log('OAuth URL dump -> parsedSearch:', parsedSearch);
            console.log('OAuth URL dump -> parsedHash:', parsedHash);
            console.log('OAuth URL dump -> combinedParams:', combined);
            // If state is present, log partially for easier correlation (avoid logging very long values)
            if (combined.state) {
              console.log('OAuth state (truncated):', String(combined.state).slice(0, 200));
            }
            return { parsedSearch, parsedHash, combined };
          } catch (err) {
            console.error('Error dumping URL details:', err);
            return { parsedSearch: {}, parsedHash: {}, combined: {} };
          }
        };

  // Execute URL dump for logs (no need to keep the returned object here)
  void dumpUrlDetails();

        // Check URL for OAuth parameters (both query and hash)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        console.log('URL params:', Object.fromEntries(urlParams));
        console.log('Hash params:', Object.fromEntries(hashParams));
        
        // Look for access_token in both locations
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        console.log('OAuth tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken, error, errorDescription });
        
        if (error) {
          console.error('OAuth error in URL:', error, errorDescription);
          setError(`OAuth error: ${errorDescription || error}`);
          setLoading(false);
          return;
        }
        
        // If we have tokens in URL, set them explicitly
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens from URL...');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (setSessionError) {
            console.error('Error setting session with tokens:', setSessionError);
            setError('Failed to establish session with OAuth tokens');
            setLoading(false);
            return;
          }
          
          console.log('Session set successfully with URL tokens');
        }
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for active session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Current session after processing:', sessionData);
        console.log('Session error:', sessionError);
        
        if (!sessionData.session) {
          console.error('No active session found after OAuth callback');
          
          // Try to manually get session from URL hash/params one more time
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          // Check for Facebook OAuth errors
          const errorParam = urlParams.get('error') || hashParams.get('error');
          const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
          const errorReason = urlParams.get('error_reason') || hashParams.get('error_reason');
          
          if (errorParam) {
            console.error('Facebook OAuth error detected:', {
              error: errorParam,
              description: errorDescription,
              reason: errorReason
            });
            
            let userFriendlyError = 'Facebook login failed';
            
            if (errorDescription) {
              if (errorDescription.includes('user denied') || errorParam === 'access_denied') {
                userFriendlyError = 'Facebook login was cancelled';
              } else if (errorDescription.includes('invalid_request')) {
                userFriendlyError = 'Facebook login configuration error';
              } else {
                userFriendlyError = `Facebook error: ${errorDescription}`;
              }
            }
            
            setError(userFriendlyError);
            setLoading(false);
            
            // Redirect back to login after showing error
            setTimeout(() => {
              history.replace('/login');
            }, 3000);
            return;
          }
          
          setError('No active authentication session found. Please try logging in again.');
          setLoading(false);
          
          // Redirect back to login after a delay
          setTimeout(() => {
            history.replace('/login');
          }, 3000);
          return;
        }
        
        // Create user from OAuth session
        const result = await createUserFromOAuthSession();
        console.log('User creation result:', result);
        
        // If user creation failed, try alternative session detection
        if (!result.success && result.message !== 'User already exists') {
          console.log('Standard user creation failed, trying alternative session detection...');
          
          // Try refreshing session one more time
          const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
          console.log('Session refresh attempt:', { session: refreshedSession, error: refreshError });
          
          if (refreshedSession?.session) {
            console.log('Session refresh successful, trying user creation again...');
            const retryResult = await createUserFromOAuthSession();
            console.log('Retry user creation result:', retryResult);
            
            if (retryResult.success || retryResult.message === 'User already exists') {
              // Use the refreshed session result
              result.success = true;
              result.data = { email: refreshedSession.session.user.email };
            }
          }
        }
        
        if (result.success || result.message === 'User already exists') {
          const userEmail = result.data?.email;
          
          if (userEmail) {
            // Store email in localStorage
            localStorage.setItem('userEmail', userEmail);
            console.log('✅ User email stored:', userEmail);
            
            // Check user type and redirect accordingly
            const approvalResult = await checkUserApprovalStatus(userEmail);
            
            console.log('User approval status:', approvalResult);
            
            // Check if user is pending approval
            if (approvalResult?.data?.approval_status === 'pending') {
              // User is pending approval - redirect to pending page
              console.log('🔄 Redirecting to pending approval');
              history.replace('/pending-approval');
            } else if (approvalResult?.data?.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
              // Admin user - redirect to admin dashboard
              console.log('🔄 Redirecting to admin dashboard');
              history.replace('/admin-dashboard');
            } else if (approvalResult?.data?.userTypeCode === 2 && approvalResult.data.approval_status === 'approved') {
              // DTI user - redirect to DTI dashboard
              console.log('🔄 Redirecting to DTI dashboard');
              history.replace('/dti-dashboard');
            } else if (approvalResult?.data?.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
              // Store user - redirect to store dashboard  
              console.log('🔄 Redirecting to store dashboard');
              history.replace('/store-dashboard');
            } else {
              // Regular user or others - redirect to home
              console.log('🔄 Redirecting to home');
              history.replace('/home');
            }
          } else {
            console.error('Unable to retrieve user email from OAuth session');
            setError('Unable to retrieve user email from OAuth session');
            setLoading(false);
          }
        } else if (result.error) {
          console.error('OAuth user creation error:', result.error);
          setError(result.error);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError('Failed to process OAuth login. Please try again.');
        setLoading(false);
      }
    };
    
    // Add a delay to ensure OAuth session is properly set - longer for mobile
    const isMobile = window.location.protocol === 'capacitor:' || ('Capacitor' in window);
    const delayTime = isMobile ? 3000 : 1000; // Longer delay for mobile WebView
    console.log(`Adding ${delayTime}ms delay for ${isMobile ? 'mobile' : 'web'} environment...`);
    const timeoutId = setTimeout(handleOAuthCallback, delayTime);
    
    return () => clearTimeout(timeoutId);
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
