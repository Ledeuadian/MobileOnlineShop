import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { IonMenu, IonContent, IonInput, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { settingsOutline, arrowBackOutline, personCircleOutline, mailOutline, keyOutline, callOutline } from 'ionicons/icons';
import './ProfileMenu.css';

interface ProfileMenuProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordMasked?: string;
  contactNumber?: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  firstName = '',
  lastName = '',
  email = '',
  passwordMasked = '',
  contactNumber = ''
}) => {
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [contact, setContact] = useState(contactNumber);

  // Fetch user info from Supabase USER table on mount
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionEmail = sessionData?.session?.user?.email;
      if (!sessionEmail) return;
      const { data, error } = await supabase
        .from('USER')
        .select('firstname, lastname, contactNumber')
        .eq('email', sessionEmail)
        .single();
      if (data) {
        if (data.firstname) setFirst(data.firstname);
        if (data.lastname) setLast(data.lastname);
        if (data.contactNumber) setContact(data.contactNumber);
      }
    };
    fetchUserInfo();
  }, []);
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
    <IonMenu side="start" menuId="profile-menu">
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
            value={email}
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
          <IonInput
            value={passwordMasked}
            placeholder="Password"
            type="password"
            readonly
            className="profile-menu-input"
          />
        </div>
        {/* Save and Logout Buttons */}
        <div style={{ display: 'flex', justifyContent: 'start', gap: '5px', marginTop: '50%', marginLeft: '20%'}}>
          <IonButton color="primary" onClick={() => setShowSaveModal(true)}>
            Save
          </IonButton>
          <IonButton color="danger" onClick={() => setShowLogoutModal(true)}>
            Logout
          </IonButton>
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
              // Get session email from Supabase active session
              const { data: sessionData } = await supabase.auth.getSession();
              const sessionEmail = sessionData?.session?.user?.email;
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
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default ProfileMenu;
