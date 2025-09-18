import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { IonMenu, IonContent, IonInput, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { settingsOutline, arrowBackOutline, personCircleOutline, mailOutline, keyOutline, callOutline, eye, eyeOff } from 'ionicons/icons';
import './ProfileMenu.css';

interface ProfileMenuProps {
  firstName?: string;
  lastName?: string;
  passwordMasked?: string;
  contactNumber?: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  firstName = '',
  lastName = '',
  passwordMasked = '',
  contactNumber = ''
}) => {
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [contact, setContact] = useState(contactNumber);
  const [sessionEmail, setSessionEmail] = useState('');

  // Password change modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user info from Supabase USER table on mount
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email;
      if (!userEmail) return;
      
      setSessionEmail(userEmail);
      
      const { data } = await supabase
        .from('USER')
        .select('firstname, lastname, contactNumber')
        .eq('email', userEmail)
        .single();
      if (data) {
        if (data.firstname) setFirst(data.firstname);
        if (data.lastname) setLast(data.lastname);
        if (data.contactNumber) setContact(data.contactNumber);
      }
    };
    fetchUserInfo();
  }, []);

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      // Validate inputs
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert('Please fill in all password fields.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        alert('New password and confirmation password do not match. Please make sure both password fields contain the exact same password.');
        return;
      }

      if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
      }

      // First verify the current password by attempting to sign in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: sessionEmail,
        password: currentPassword
      });

      if (signInError) {
        console.error('Current password verification failed:', signInError);
        alert('Current password is incorrect. Please try again.');
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        alert('Failed to change password: ' + error.message);
        return;
      }

      // Clear form and close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePasswordModal(false);
      
      // Reset password visibility states
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
      // Show success message
      alert('Password changed successfully!');
      
    } catch (error) {
      console.error('Unexpected error changing password:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCloseMenu = () => {
    // Try global IonMenuController if available
    const menuController = (window as unknown as { IonMenuController?: { close: (id: string) => void } }).IonMenuController;
    if (menuController && typeof menuController.close === 'function') {
      menuController.close('profile-menu');
    } else {
      const menu = document.querySelector('ion-menu[menu-id="profile-menu"]') as HTMLElement & { close?: () => void };
      if (menu && typeof menu.close === 'function') {
        menu.close();
      }
    }
  };

  return (
    <IonMenu side="end" menuId="profile-menu" contentId="main-content">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="profile-menu-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <IonButton fill="clear" onClick={handleCloseMenu} className="profile-menu-close-btn">
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonIcon icon={settingsOutline} className="profile-menu-settings" />
        </div>
  <h2 className="profile-menu-title">Hi {first}</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon icon={personCircleOutline} className="profile-menu-icon" />
          <IonInput
            value={first}
            placeholder="First Name"
            onIonChange={e => setFirst(e.detail.value!)}
            className="profile-menu-input"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon icon={personCircleOutline} className="profile-menu-icon" />
          <IonInput
            value={last}
            placeholder="Last Name"
            onIonChange={e => setLast(e.detail.value!)}
            className="profile-menu-input"
          />
        </div>
        <div className="profile-menu-divider" />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon icon={mailOutline} className="profile-menu-icon" />
          <IonInput
            value={sessionEmail}
            placeholder="Email"
            readonly
            className="profile-menu-input"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon icon={callOutline} className="profile-menu-icon" />
          <IonInput
            value={contact}
            placeholder="Contact Number"
            inputMode="numeric"
            pattern="[0-9]*"
            onIonChange={e => {
              const val = e.detail.value || '';
              setContact(val.replace(/\D/g, ''));
            }}
            className="profile-menu-input"
          />
        </div>
        <div className="profile-menu-divider" />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon icon={keyOutline} className="profile-menu-icon" />
          <IonButton 
            fill="outline" 
            expand="block" 
            color="primary"
            onClick={() => setShowChangePasswordModal(true)}
            className="profile-menu-change-password-btn"
          >
            Change Password
          </IonButton>
        </div>
        
        {/* Save and Logout Buttons */}
        <div className="profile-menu-actions">
          <IonButton color="primary" onClick={() => setShowSaveModal(true)}>
            Save
          </IonButton>
          <IonButton color="danger" onClick={() => setShowLogoutModal(true)}>
            Logout
          </IonButton>
        </div>
      </IonContent>

      {/* Logout Confirmation Modal */}
      <IonModal isOpen={showLogoutModal} onDidDismiss={() => setShowLogoutModal(false)}>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to logout?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
            <IonButton color="medium" onClick={() => setShowLogoutModal(false)}>Cancel</IonButton>
            <IonButton color="danger" onClick={async () => {
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.href = '/login';
            }}>Logout</IonButton>
          </div>
        </div>
      </IonModal>

      {/* Save Confirmation Modal */}
      <IonModal isOpen={showSaveModal} onDidDismiss={() => setShowSaveModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Confirm Save</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Are you sure you want to save changes to your profile?</p>
          <IonButton color="primary" expand="block" onClick={async () => {
            // Validate contact number length
            if (contact.length !== 11) {
              alert('Contact number must be exactly 11 digits.');
              return;
            }
            // Use sessionEmail from state
            if (!sessionEmail) {
              alert('No session email found.');
              return;
            }
            // Update USER table in Supabase
            const { error } = await supabase
              .from('USER')
              .update({ firstname: first, lastname: last, contactNumber: contact })
              .eq('email', sessionEmail);
            if (error) {
              alert('Failed to save: ' + error.message);
            } else {
              setShowSaveModal(false);
              setShowSuccessModal(true);
            }
          }}>Save</IonButton>
          <IonButton expand="block" onClick={() => setShowSaveModal(false)}>Cancel</IonButton>
        </IonContent>
      </IonModal>

      {/* Custom Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginRight: '8px' }}>Success</span>
            <span style={{ color: 'green' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#4CAF50"/>
                <path d="M7 13.5L10.5 17L17 10.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Profile updated successfully!</p>
          <IonButton color="primary" onClick={() => setShowSuccessModal(false)}>OK</IonButton>
        </div>
      </IonModal>

      {/* Change Password Modal */}
      <IonModal isOpen={showChangePasswordModal} onDidDismiss={() => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Change Password</IonTitle>
            <IonButton 
              slot="end" 
              fill="clear" 
              onClick={() => {
                setShowChangePasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}
            >
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Current Password</p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IonInput
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                placeholder="Enter your current password"
                onIonChange={e => setCurrentPassword(e.detail.value!)}
                style={{
                  '--border-color': '#ccc',
                  '--border-style': 'solid',
                  '--border-width': '1px',
                  '--border-radius': '4px',
                  '--padding-start': '12px',
                  '--padding-end': '44px',
                  '--padding-top': '8px',
                  '--padding-bottom': '8px',
                  marginBottom: '16px',
                  flex: 1
                }}
              />
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-60%)',
                  zIndex: 10,
                  '--color': '#666'
                }}
              >
                <IonIcon icon={showCurrentPassword ? eyeOff : eye} />
              </IonButton>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>New Password</p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IonInput
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                placeholder="Enter your new password"
                onIonChange={e => setNewPassword(e.detail.value!)}
                style={{
                  '--border-color': '#ccc',
                  '--border-style': 'solid',
                  '--border-width': '1px',
                  '--border-radius': '4px',
                  '--padding-start': '12px',
                  '--padding-end': '44px',
                  '--padding-top': '8px',
                  '--padding-bottom': '8px',
                  marginBottom: '16px',
                  flex: 1
                }}
              />
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-60%)',
                  zIndex: 10,
                  '--color': '#666'
                }}
              >
                <IonIcon icon={showNewPassword ? eyeOff : eye} />
              </IonButton>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Confirm New Password</p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IonInput
                type={showConfirmPassword ? "text" : "password"}
                value={confirmNewPassword}
                placeholder="Confirm your new password"
                onIonChange={e => setConfirmNewPassword(e.detail.value!)}
                style={{
                  '--border-color': '#ccc',
                  '--border-style': 'solid',
                  '--border-width': '1px',
                  '--border-radius': '4px',
                  '--padding-start': '12px',
                  '--padding-end': '44px',
                  '--padding-top': '8px',
                  '--padding-bottom': '8px',
                  flex: 1
                }}
              />
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  '--color': '#666'
                }}
              >
                <IonIcon icon={showConfirmPassword ? eyeOff : eye} />
              </IonButton>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <IonButton 
              color="primary" 
              expand="block" 
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              style={{ flex: 1 }}
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </IonButton>
            <IonButton 
              color="medium" 
              fill="outline" 
              expand="block" 
              onClick={() => {
                setShowChangePasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </IonButton>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '8px', fontSize: '0.9rem' }}>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>Password Requirements:</strong><br />
              • At least 6 characters long<br />
              • Should be unique and secure<br />
              • New password must match confirmation<br />
              • Current password must be correct to proceed
            </p>
          </div>
        </IonContent>
      </IonModal>
    </IonMenu>
  );
};

export default ProfileMenu;
