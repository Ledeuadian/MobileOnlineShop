import React, { useEffect, useState } from 'react';
import { Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonSpinner,
  IonContent,
  IonPage,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AccountConfirmation from './components/AccountConfirmation';
import AdminDashboard from './pages/AdminDashboard';
import StoreDashboard from './pages/StoreDashboard';
import { supabase, checkUserApprovalStatus } from './services/supabaseService';

setupIonicReact();

const RedirectHandler: React.FC = () => {
  console.log('RedirectHandler called');
  const history = useHistory();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication in RedirectHandler...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          console.log('User is authenticated, checking profile...');
          // Check user approval status
          const approvalResult = await checkUserApprovalStatus(session.user.email);
            
          if (approvalResult?.error) {
            console.error('Error fetching user profile:', approvalResult.error);
            history.push('/login');
            return;
          }
          
          console.log('User profile:', approvalResult.data);
          
          if (approvalResult?.data?.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
            console.log('Redirecting to admin dashboard');
            history.push('/admin-dashboard');
          } else if (approvalResult?.data?.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
            console.log('Redirecting to store dashboard');
            history.push('/store-dashboard');
          } else {
            console.log('Redirecting to home');
            history.push('/home');
          }
        } else {
          console.log('No authenticated user, redirecting to login');
          history.push('/login');
        }
      } catch (error) {
        console.error('Error in RedirectHandler:', error);
        history.push('/login');
      }
    };
    
    checkAuth();
  }, [history]);
  
  return (
    <IonPage>
      <IonContent>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );
};

const ProtectedAdminRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          history.push('/login');
          return;
        }

        // Check user approval status
        const approvalResult = await checkUserApprovalStatus(session.user.email);
        
        if (approvalResult?.data && 
            approvalResult.data.userTypeCode === 1 && 
            approvalResult.data.approval_status === 'approved') {
          setIsAuthorized(true);
        } else {
          history.push('/home');
        }
      } catch (error) {
        console.error('Error checking admin authorization:', error);
        history.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [history]);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return isAuthorized ? <AdminDashboard /> : null;
};

const ProtectedStoreRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          history.push('/login');
          return;
        }

        // Check user approval status
        const approvalResult = await checkUserApprovalStatus(session.user.email);
        
        if (approvalResult?.data && 
            approvalResult.data.userTypeCode === 3 && 
            approvalResult.data.approval_status === 'approved') {
          setIsAuthorized(true);
        } else {
          history.push('/home');
        }
      } catch (error) {
        console.error('Error checking store authorization:', error);
        history.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [history]);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return isAuthorized ? <StoreDashboard /> : null;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/">
          <RedirectHandler />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/verified">
          <AccountConfirmation />
        </Route>
        <Route exact path="/admin-dashboard">
          <ProtectedAdminRoute />
        </Route>
        <Route exact path="/store-dashboard">
          <ProtectedStoreRoute />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
