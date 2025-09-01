import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonModal, IonButton, IonInput, IonIcon, IonItem } from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import './Login.css';
import { fetchAndLogUserTypes, testSupabaseConnection } from '../services/supabaseService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const [showLoginForm, setShowLoginForm] = useState(() => !!(location.state as { showLoginForm?: boolean })?.showLoginForm);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRegisterNowModal, setShowRegisterNowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await fetchAndLogUserTypes();
        await testSupabaseConnection();
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleRegisterClick = () => setShowRegisterModal(true);
  const handleRegisterNowClick = () => setShowRegisterNowModal(true);
  const handleRegisterOption = (type: string) => {
    setShowRegisterModal(false);
    setShowRegisterNowModal(false);
    history.push({ pathname: '/register', state: { userType: type } });
  };

  return (
    <div className="login-container">
      {!showLoginForm ? (
        <>
          <img
            src="./public/images/GroSho.png"
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
          <form className="login-form">
            <div className="login-form-logo">
              <img src="./public/images/GroSho.png" alt="GroSho Logo" className="login-image" />
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
              <button type="button" className="forgot-password-link">Forgot password?</button>
            </div>
            <button type="submit" className="login-button main-login">Login</button>
          </form>
          <div className="divider">
            <hr className="divider-line" />
            <span className="divider-text">Or Login with</span>
            <hr className="divider-line" />
          </div>
          <div className="social-login">
            <button type="button" className="social-btn">
              <span className="icon"> <img src="./public/images/fb.png" alt="Facebook Logo" className="social-icon-img" /></span>
            </button>
            <button type="button" className="social-btn">
              <span className="icon"> <img src="./public/images/x.png" alt="X Logo" className="social-icon-img" /></span>
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
        </>
      )}
    </div>
  );
};

export default Login;
