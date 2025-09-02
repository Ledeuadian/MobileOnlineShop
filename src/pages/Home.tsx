import React, { useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { IonPage } from '@ionic/react';
import ProfileMenu from '../components/ProfileMenu';
// ...existing code...
import './Home.css';


const Home: React.FC = () => {
  const [email, setEmail] = React.useState('');

  useEffect(() => {
    const getSessionEmail = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
        console.log('Active session email:', data.session.user.email);
      } else {
        setEmail('');
        console.log('No active session email found.');
      }
    };
    getSessionEmail();
  }, []);

  useEffect(() => {
    console.log('Active session email:', email);
  }, [email]);

  return (
    <IonPage>
      <div className="home-container">
      {/* Side Drawer Menu */}
      <ProfileMenu
        email={email}
        passwordMasked={localStorage.getItem('userPasswordMasked') || '****'}
      />
      <h2>Welcome!</h2>
      <p>You are logged in as: <strong>{email}</strong></p>

      {/* Bottom Navigation Bar */}
      <nav
        className="bottom-bar"
      >
        <button style={{ background: 'none', border: 'none', outline: 'none', padding: 0 }}>
          <img src="/Images/Shop.png" alt="Shop" className="shop-btn" />
        </button>
        <button style={{ background: 'none', border: 'none', outline: 'none', padding: 0 }}>
          <img src="/Images/Cart.png" alt="Cart" className="cart-btn" />
        </button>
        <button
          className="bottom-bar-btn"
          aria-label="Open profile menu"
          onClick={() => {
            // Try global IonMenuController if available
            const menuController = (window as unknown as { IonMenuController?: { open: (id: string) => void } }).IonMenuController;
            if (menuController && typeof menuController.open === 'function') {
              menuController.open('profile-menu');
            } else {
              const menu = document.querySelector('ion-menu[menu-id="profile-menu"]') as HTMLElement & { open?: () => void };
              if (menu && typeof menu.open === 'function') {
                menu.open();
              }
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              const menuController = (window as unknown as { IonMenuController?: { open: (id: string) => void } }).IonMenuController;
              if (menuController && typeof menuController.open === 'function') {
                menuController.open('profile-menu');
              } else {
                const menu = document.querySelector('ion-menu[menu-id="profile-menu"]') as HTMLElement & { open?: () => void };
                if (menu && typeof menu.open === 'function') {
                  menu.open();
                }
              }
            }
          }}
        >
          <img src="/Images/Profile.png" alt="Profile" className="profile-btn" />
        </button>
      </nav>
      </div>
    </IonPage>
  );
};

export default Home;
