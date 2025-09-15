import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonInput, IonButton, IonItem } from '@ionic/react';
import { supabase } from '../services/supabaseService';
import './Login.css';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Check if user arrived here from password reset email
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Invalid password reset link. Please request a new one.');
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          history.push('/login', { showLoginForm: true });
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Password update error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <img
          src="/Images/GroSho.png"
          alt="GroSho Logo"
          className="login-image"
          style={{ marginBottom: '20px' }}
        />
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Reset Your Password</h2>
        
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <IonItem style={{ background: 'transparent', borderRadius: '8px', border: '1px solid #ccc' }}>
            <IonInput
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onIonInput={(e: CustomEvent) => setNewPassword((e.target as HTMLInputElement).value)}
              required
            />
          </IonItem>
          
          <IonItem style={{ background: 'transparent', borderRadius: '8px', border: '1px solid #ccc' }}>
            <IonInput
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onIonInput={(e: CustomEvent) => setConfirmPassword((e.target as HTMLInputElement).value)}
              required
            />
          </IonItem>
          
          {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          {message && <div style={{ color: 'green', fontSize: '14px', textAlign: 'center' }}>{message}</div>}
          
          <IonButton
            expand="block"
            type="submit"
            disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
            style={{ marginTop: '16px' }}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </IonButton>
          
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => history.push('/login')}
            style={{ marginTop: '8px' }}
          >
            Back to Login
          </IonButton>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;