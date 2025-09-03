import React, { useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { IonPage } from '@ionic/react';
import ProfileMenu from '../components/ProfileMenu';
import './Home.css';


const Home: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const hasInsertedUser = React.useRef(false);

  useEffect(() => {
    const getSessionEmail = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      } else {
        setEmail('');
      }
    };
    getSessionEmail();
  }, []);

  useEffect(() => {
    const insertUserIfNotExists = async () => {
      if (!email || hasInsertedUser.current) 
        return;
      
      // Check if user exists in public.USER
      const { data: userExists } = await supabase
        .from('USER')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (!userExists) {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUserId = sessionData?.session?.user?.id;
        const { error } = await supabase
          .from('USER')
          .insert([{
            email,
            firstname: null,
            lastname: null,
            contactNumber: null,
            userTypeCode: 4,
            auth_user_id: authUserId
          }]);
        if (error) {
          console.error('Supabase insert error:', error.message);
        } else {
          console.log('Inserted new user');
          hasInsertedUser.current = true;
        }
      } else {
        hasInsertedUser.current = true;
      }
    };
    insertUserIfNotExists();
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
