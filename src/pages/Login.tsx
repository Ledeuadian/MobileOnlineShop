import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonModal, IonButton, IonInput, IonIcon, IonItem } from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import './Login.css';
import { supabase, checkUserApprovalStatus, getRedirectUrl } from '../services/supabaseService';

const Login: React.FC = () => {
  // ...existing code...
  const history = useHistory();
  React.useEffect(() => {
    if (localStorage.getItem('userEmail')) {
      history.replace('/home');
    }
  }, [history]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const [showLoginForm, setShowLoginForm] = useState(() => !!(location.state as { showLoginForm?: boolean })?.showLoginForm);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRegisterNowModal, setShowRegisterNowModal] = useState(false);

  // Register helpers (used by modals)
  const handleRegisterClick = () => setShowRegisterModal(true);
  const handleRegisterNowClick = () => setShowRegisterNowModal(true);
  const handleRegisterOption = (type: string) => {
    setShowRegisterModal(false);
    setShowRegisterNowModal(false);
    history.push({ pathname: '/register', state: { userType: type } });
  };
  
  // Password reset states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  // OAuth callback: after redirect to /home, check session and insert user if needed
  useEffect(() => {
    const checkOAuthUser = async () => {
      const { data } = await supabase.auth.getSession();
      const userEmail = data?.session?.user?.email;
      if (userEmail) {
        // Check if user exists in public.USER
        const { data: userExists } = await supabase
          .from('USER')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle();
        if (!userExists) {
          await supabase
            .from('USER')
            .insert([{ email: userEmail }]);
        }
        localStorage.setItem('userEmail', userEmail);
        
        // Check user type and redirect accordingly
        const approvalResult = await checkUserApprovalStatus(userEmail);
        
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
      }
    };
    checkOAuthUser();
  }, [history]);

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: getRedirectUrl('reset-password'),
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetMessage('Password reset email sent! Please check your inbox.');
        setResetEmail('');
      }
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setResetError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      {!showLoginForm ? (
        <>
          <img
            src="/Images/GroSho.png"
            alt="Random"
            className="login-image"
          />
          <div className="welcome-text">
            Smart Lists for Smart Shoppers
          </div>
          <button
            type="button"
            className="login-button main-login"
            onClick={() => setShowLoginForm(true)}
          >
            Login
          </button>
          <button
            type="button"
            className="register-button"
            onClick={handleRegisterClick}
          >
            Register
          </button>
          <IonModal isOpen={showRegisterModal} onDidDismiss={() => setShowRegisterModal(false)}>
            <div style={{padding: '32px', textAlign: 'center'}}>
              <h3>Select User Type</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '24px'}}>
                <IonButton expand="block" onClick={() => handleRegisterOption('DTI')}>DTI</IonButton>
                <IonButton expand="block" onClick={() => handleRegisterOption('SHOPPER')}>SHOPPER</IonButton>
                <IonButton expand="block" onClick={() => handleRegisterOption('STORE')}>STORE</IonButton>
              </div>
              <IonButton color="medium" style={{marginTop: '24px'}} onClick={() => setShowRegisterModal(false)}>Cancel</IonButton>
            </div>
          </IonModal>
        </>
      ) : (
        <>
          <form className="login-form" onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            // Authenticate with Supabase
            try {
              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (error) {
                setError(error.message);
                return;
              }
              
              // Store email in localStorage
              localStorage.setItem('userEmail', email);
              
              // Check user type and redirect accordingly
              const approvalResult = await checkUserApprovalStatus(email);
              
              // Check if user is pending approval
              if (approvalResult?.data?.approval_status === 'pending') {
                // User is pending approval - redirect to pending page
                history.push('/pending-approval');
              } else if (approvalResult?.data?.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
                // Admin user - redirect to admin dashboard
                history.push('/admin-dashboard');
              } else if (approvalResult?.data?.userTypeCode === 2 && approvalResult.data.approval_status === 'approved') {
                // DTI user - redirect to DTI dashboard
                history.push('/dti-dashboard');
              } else if (approvalResult?.data?.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
                // Store user - redirect to store dashboard
                history.push('/store-dashboard');
              } else {
                // Regular user or others - redirect to home
                history.push({ pathname: '/home', state: { email } });
              }
            } catch (err: unknown) {
              setError((err as Error).message || 'Login failed');
            }
          }}>
            <div className="login-form-logo">
              <img src="/Images/GroSho.png" alt="GroSho Logo" className="login-image" />
            </div>
            <IonItem className="login-input" style={{ background: '#fff', borderRadius: '8px', height: '48px', boxSizing: 'border-box', padding: '0 12px', marginBottom: '16px', border: '1px solid #ccc' }}>
              <IonInput
                type="email"
                placeholder="Enter your email address"
                value={email}
                onIonInput={(e: CustomEvent) => setEmail((e.target as HTMLInputElement).value)}
                style={{ background: 'transparent', height: '100%', fontSize: '16px' }}
              />
            </IonItem>
            <IonItem className="login-input" style={{ background: 'transparent', borderRadius: '8px', height: '48px', boxSizing: 'border-box', padding: '0 12px', marginBottom: '16px', border: '1px solid #ccc' }}>
              <IonInput
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onIonInput={(e: CustomEvent) => setPassword((e.target as HTMLInputElement).value)}
                style={{background: 'transparent', height: '100%', fontSize: '16px' }}
              />
              <IonButton
                fill="clear"
                slot="end"
                className="password-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                style={{ marginRight: '-8px' }}
              >
                <IonIcon icon={showPassword ? eye : eyeOff} style={{ color: 'gray' }} />
              </IonButton>
            </IonItem>
            <div className="forgot-password">
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" className="login-button main-login">Login</button>
            {error && <div style={{ color: 'red', marginTop: '12px' }}>{error}</div>}
          </form>
          <div className="divider">
            <hr className="divider-line" />
            <span className="divider-text">Or Login with</span>
            <hr className="divider-line" />
          </div>
          <div className="social-login">
              <button
                type="button"
                className="social-btn"
                onClick={async () => {
                  setError(null); // Clear any previous errors
                  
                  try {
                    console.log('Initiating Facebook OAuth...');
                    
                    // Detect if we're running on mobile/Capacitor using the shared helper
                    const isMobile = window.location.protocol === 'capacitor:' || 
                                     window.location.hostname === 'localhost' ||
                                     ('Capacitor' in window);

                    // For web we prefer the centralized getRedirectUrl helper which handles origin paths
                    let redirectTo: string;
                    if (isMobile) {
                      // Mobile: use the app's custom scheme that matches AndroidManifest.xml
                      redirectTo = 'com.groceryshop.app://oauth-callback';
                    } else {
                      // Web: use the helper which may include deployment base path
                      redirectTo = getRedirectUrl('oauth-callback');
                    }

                    console.log('Facebook OAuth redirect URL chosen:', redirectTo);
                    console.log('Mobile environment detected:', isMobile);

                    // Prevent the Supabase SDK from performing a direct browser redirect (which may open the
                    // system browser). We temporarily stub out navigation methods while the SDK runs, then
                    // restore them and open the provider URL explicitly in the in-app Browser on mobile.
                    const originalWindowOpen: typeof window.open = window.open;
                    const originalLocationAssign: ((url?: string | URL) => void) | undefined = (window.location as unknown as { assign?: (url?: string | URL) => void }).assign;
                    try {
                      (window as unknown as { open?: typeof window.open }).open = () => null;
                      try { (window.location as unknown as { assign?: (url?: string | URL) => void }).assign = () => {}; } catch { /* ignore */ }

                      const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'facebook',
                        options: {
                          redirectTo: redirectTo,
                          scopes: 'email',
                          // prevent the Supabase SDK from doing a direct browser redirect
                          // so we can open the provider URL only in the in-app Browser on mobile
                          skipBrowserRedirect: false,
                        }
                      });

                      if (error) {
                        console.error('Facebook OAuth initiation error:', error);
                        setError(`Facebook login failed: ${error.message}`);
                      } else {
                        console.log('Facebook OAuth initiated successfully:', data);

                        // If the Supabase SDK returned a URL, open it appropriately.
                        try {
                          const signInData = data as unknown as { url?: string };
                          const providerUrl = signInData?.url;
                          console.log('Computed redirectTo:', redirectTo, ' providerUrl:', providerUrl, ' raw signInData:', signInData);
                          // Defensive validation: sometimes providerUrl can be a relative path like 'callback'
                          // which causes the in-app Browser to try to resolve it as a hostname (DNS error).
                          const looksLikeAbsolute = typeof providerUrl === 'string' && (providerUrl.includes('://') || providerUrl.startsWith('http') || providerUrl.startsWith('com.') || providerUrl.startsWith('android-app:'));
                          if (!providerUrl) {
                            console.warn('No provider URL returned by supabase.auth.signInWithOAuth(); SDK may have handled redirect automatically.');
                          } else if (!looksLikeAbsolute) {
                            console.error('Provider URL looks malformed or relative. Aborting open to avoid DNS errors. providerUrl=', providerUrl);
                            setError('OAuth redirect URL returned by server looks invalid. Please check your OAuth configuration (Facebook redirect URIs).');
                          } else {
                            if (isMobile) {
                              const imported = await import('@capacitor/browser');
                              await imported.Browser.open({ url: providerUrl });
                              console.log('Opened OAuth provider URL in Capacitor Browser');
                            } else {
                              // Web: navigate in current window
                              window.location.href = providerUrl;
                            }
                          }
                        } catch (openErr) {
                          console.error('Error opening provider URL in in-app browser:', openErr);
                          setError('Failed to open OAuth provider. Please try again.');
                        }
                      }
                    } finally {
                      // Restore originals
                      (window as unknown as { open?: typeof window.open }).open = originalWindowOpen;
                      try { if (originalLocationAssign) (window.location as unknown as { assign?: (url?: string | URL) => void }).assign = originalLocationAssign; } catch (restoreErr) { console.warn('Failed to restore location.assign:', restoreErr); }
                    }
                  } catch (err) {
                    console.error('Facebook OAuth error:', err);
                    setError('Failed to initiate Facebook login. Please try again.');
                  }
                }}
              >
                <span className="icon"> <img src="/Images/fb.png" alt="Facebook Logo" className="social-icon-img" /></span>
              </button>
            <button
              type="button"
              className="social-btn"
              onClick={async () => {
                setError(null);
                try {
                  const isMobile = window.location.protocol === 'capacitor:' ||
                                   window.location.hostname === 'localhost' ||
                                   ('Capacitor' in window);
                  const redirectTo = isMobile ? 'com.groceryshop.app://oauth-callback' : getRedirectUrl('oauth-callback');

                  // Temporarily stub navigation to prevent SDK auto-redirects
                  const originalWindowOpen: typeof window.open = window.open;
                  const originalLocationAssign: ((url?: string | URL) => void) | undefined = (window.location as unknown as { assign?: (url?: string | URL) => void }).assign;
                  try {
                    (window as unknown as { open?: typeof window.open }).open = () => null;
                    try { (window.location as unknown as { assign?: (url?: string | URL) => void }).assign = () => {}; } catch { /* ignore */ }

                    const { data, error } = await supabase.auth.signInWithOAuth({
                      provider: 'twitter',
                      options: { redirectTo, skipBrowserRedirect: true }
                    });

                    if (error) {
                      setError(error.message);
                      return;
                    }

                    const signInData = data as unknown as { url?: string };
                    const providerUrl = signInData?.url;
                    if (providerUrl) {
                      if (isMobile) {
                        const imported = await import('@capacitor/browser');
                        await imported.Browser.open({ url: providerUrl });
                      } else {
                        window.location.href = providerUrl;
                      }
                    } else {
                      console.warn('No provider URL returned by supabase.auth.signInWithOAuth() for twitter');
                    }
                  } finally {
                    (window as unknown as { open?: typeof window.open }).open = originalWindowOpen;
                    try { if (originalLocationAssign) (window.location as unknown as { assign?: (url?: string | URL) => void }).assign = originalLocationAssign; } catch (restoreErr) { console.warn('Failed to restore location.assign:', restoreErr); }
                  }
                } catch (err) {
                  console.error('Twitter OAuth initiation error:', err);
                  setError('Failed to initiate Twitter login. Please try again.');
                }
              }}
            >
              <span className="icon"> <img src="/Images/x.png" alt="X Logo" className="social-icon-img" /></span>
            </button>
          </div>
          <div className="signup-link">
            <div className="signup-row">
              <span className="signup-text">Don't have an account?</span>
              <button type="button" className="register-link-button" onClick={handleRegisterNowClick}>Register Now</button>
            </div>
          </div>
          <IonModal isOpen={showRegisterNowModal} onDidDismiss={() => setShowRegisterNowModal(false)}>
            <div style={{padding: '32px', textAlign: 'center'}}>
              <h3>Select User Type</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '24px'}}>
                <IonButton expand="block" onClick={() => handleRegisterOption('DTI')}>DTI</IonButton>
                <IonButton expand="block" onClick={() => handleRegisterOption('SHOPPER')}>SHOPPER</IonButton>
                <IonButton expand="block" onClick={() => handleRegisterOption('STORE')}>STORE</IonButton>
              </div>
              <IonButton color="medium" style={{marginTop: '24px'}} onClick={() => setShowRegisterNowModal(false)}>Cancel</IonButton>
            </div>
          </IonModal>

          {/* Forgot Password Modal */}
          <IonModal isOpen={showForgotPasswordModal} onDidDismiss={() => setShowForgotPasswordModal(false)}>
            <div style={{padding: '32px', textAlign: 'center'}}>
              <h3>Reset Password</h3>
              <p style={{color: '#666', marginBottom: '24px'}}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <form onSubmit={handleForgotPassword} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <IonItem style={{background: 'transparent', borderRadius: '8px', border: '1px solid #ccc'}}>
                  <IonInput
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onIonInput={(e: CustomEvent) => setResetEmail((e.target as HTMLInputElement).value)}
                    required
                  />
                </IonItem>
                
                {resetError && <div style={{color: 'red', fontSize: '14px'}}>{resetError}</div>}
                {resetMessage && <div style={{color: 'green', fontSize: '14px'}}>{resetMessage}</div>}
                
                <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                  <IonButton 
                    expand="block" 
                    type="submit" 
                    disabled={!resetEmail.trim()}
                    style={{flex: 1}}
                  >
                    Send Reset Link
                  </IonButton>
                  <IonButton 
                    color="medium" 
                    fill="outline"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setResetEmail('');
                      setResetError('');
                      setResetMessage('');
                    }}
                    style={{flex: 1}}
                  >
                    Cancel
                  </IonButton>
                </div>
              </form>
            </div>
          </IonModal>
        </>
      )}
    </div>
  );
};

export default Login;
