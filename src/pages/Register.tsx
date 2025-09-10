import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './Register.css';
import { IonItem, IonInput, IonButton, IonIcon } from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import { RegisterUser } from '../services/supabaseService';

const Register: React.FC = () => {
  const history = useHistory();
  React.useEffect(() => {
    if (localStorage.getItem('userEmail')) {
      history.replace('/home');
    }
  }, [history]);
  const location = useLocation();
  const userType = (location.state as { userType?: string })?.userType;
  let userTypeCode: number | undefined;
  if (userType === 'DTI') userTypeCode = 2;
  else if (userType === 'STORE') userTypeCode = 3;
  else if (userType === 'SHOPPER') userTypeCode = 4;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    // Validate required fields
    if (!email.trim()) {
      setError('Email required.');
      setIsSubmitting(false);
      return;
    }
    if (!password.trim()) {
      setError('Password required.');
      setIsSubmitting(false);
      return;
    }
    if (!confirmPassword.trim()) {
      setError('Confirm Password required.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await RegisterUser(email, password, confirmPassword, userTypeCode);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Registration successful! Please check your email to verify your account.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-logo">
        <img src="/Images/GroSho.png" alt="GroSho Logo" className="register-image" />
      </div>
      <form className="register-form" onSubmit={handleSubmit}>
        <IonItem className="register-input" style={{ background: '#fff', borderRadius: '8px', height: '48px', boxSizing: 'border-box', padding: '0 12px', marginBottom: '16px', border: '1px solid #ccc' }}>
          <IonInput
            type="email"
            placeholder="Email"
            value={email}
            onIonInput={(e: CustomEvent) => setEmail((e.target as HTMLInputElement).value)}
            style={{ background: 'transparent', height: '100%', fontSize: '16px' }}
          />
        </IonItem>
        <IonItem className="register-input" style={{ background: '#fff', borderRadius: '8px', height: '48px', boxSizing: 'border-box', padding: '0 12px', marginBottom: '16px', border: '1px solid #ccc' }}>
          <IonInput
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onIonInput={(e: CustomEvent) => setPassword((e.target as HTMLInputElement).value)}
            style={{ background: 'transparent', height: '100%', fontSize: '16px' }}
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
        <IonItem className="register-input" style={{ background: '#fff', borderRadius: '8px', height: '48px', boxSizing: 'border-box', padding: '0 12px', marginBottom: '16px', border: '1px solid #ccc' }}>
          <IonInput
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onIonInput={(e: CustomEvent) => setConfirmPassword((e.target as HTMLInputElement).value)}
            style={{ background: 'transparent', height: '100%', fontSize: '16px' }}
          />
          <IonButton
            fill="clear"
            slot="end"
            className="password-eye-btn"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            tabIndex={-1}
            style={{ marginRight: '-8px' }}
          >
            <IonIcon icon={showConfirmPassword ? eye : eyeOff} style={{ color: 'gray' }} />
          </IonButton>
        </IonItem>
        <button type="submit" className="register-button-main" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
        {error && <div style={{ color: 'red', marginTop: '12px' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: '12px' }}>{success}</div>}
      </form>
      <div className="register-signup-link">
        <div className="register-signup-row">
          <span className="register-signup-text">Already have an account?</span>
          <button type="button" className="register-link-button" onClick={() => history.push('/login', { showLoginForm: true })}>Login Now</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
