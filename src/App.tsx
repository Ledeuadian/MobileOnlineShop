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
import AccountConfirmation from './components/AccountConfirmation';
import OAuthCallback from './components/OAuthCallback';
import PendingApproval from './pages/PendingApproval';

// Lazy load heavy dashboard components
const Home = React.lazy(() => import('./pages/Home'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const StoreDashboard = React.lazy(() => import('./pages/StoreDashboard'));
const DTIDashboard = React.lazy(() => import('./pages/DTIDashboard'));
const CategoryProducts = React.lazy(() => import('./pages/CategoryProducts'));
const Cart = React.lazy(() => import('./pages/Cart'));
const GroceryList = React.lazy(() => import('./pages/GroceryList'));
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
          
          // Check if user is pending approval
          if (approvalResult?.data?.approval_status === 'pending') {
            console.log('User is pending approval, redirecting to pending page');
            history.push('/pending-approval');
          } else if (approvalResult?.data?.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
            console.log('Redirecting to admin dashboard');
            history.push('/admin-dashboard');
          } else if (approvalResult?.data?.userTypeCode === 2 && approvalResult.data.approval_status === 'approved') {
            console.log('Redirecting to DTI dashboard');
            history.push('/dti-dashboard');
          } else if (approvalResult?.data?.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
            console.log('Redirecting to store dashboard');
            history.push('/store-dashboard');
          } else {
            console.log('Redirecting to home');
            history.push('/home');
          }
        } else {
          console.log('No authenticated user, redirecting to login');
          console.log('History object:', history);
          history.push('/login');
        }
      } catch (error) {
        console.error('Error in RedirectHandler:', error);
        history.push('/login');
      }
    };
    
    checkAuth();
  }, [history]);
  
  // Return null to avoid showing any loading UI
  return null;
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <AdminDashboard />
    </React.Suspense>
  ) : null;
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <StoreDashboard />
    </React.Suspense>
  ) : null;
};

const ProtectedDTIRoute: React.FC = () => {
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
            approvalResult.data.userTypeCode === 2 && 
            approvalResult.data.approval_status === 'approved') {
          setIsAuthorized(true);
        } else {
          history.push('/home');
        }
      } catch (error) {
        console.error('Error checking DTI authorization:', error);
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <DTIDashboard />
    </React.Suspense>
  ) : null;
};

const ProtectedHomeRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          console.log('🔴 No session found, redirecting to login');
          history.push('/login');
          return;
        }

        console.log('🟢 Session found for Home route:', session.user.email);
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking home authorization:', error);
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <Home />
    </React.Suspense>
  ) : null;
};

const ProtectedCategoryRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          console.log('🔴 No session found, redirecting to login');
          history.push('/login');
          return;
        }

        console.log('🟢 Session found for Category route:', session.user.email);
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking category authorization:', error);
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <CategoryProducts />
    </React.Suspense>
  ) : null;
};

const ProtectedCartRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          console.log('🔴 No session found, redirecting to login');
          history.push('/login');
          return;
        }

        console.log('🟢 Session found for Cart route:', session.user.email);
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking cart authorization:', error);
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <Cart />
    </React.Suspense>
  ) : null;
};

const ProtectedGroceryListRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          console.log('🔴 No session found, redirecting to login');
          history.push('/login');
          return;
        }

        console.log('🟢 Session found for Grocery List route:', session.user.email);
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking grocery list authorization:', error);
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

  return isAuthorized ? (
    <React.Suspense fallback={
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
    }>
      <GroceryList />
    </React.Suspense>
  ) : null;
};

const App: React.FC = () => {
  // Global session monitoring
  useEffect(() => {
    console.log('🔐 Initializing global session monitoring...');
    
    // Check initial session
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🟢 Active session detected on app start:', {
            user_id: session.user.id,
            email: session.user.email,
            expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
            access_token: session.access_token.substring(0, 20) + '...',
            refresh_token: session.refresh_token?.substring(0, 20) + '...' || 'N/A'
          });
        } else {
          console.log('🔴 No active session on app start');
        }
      } catch (error) {
        console.error('❌ Error checking initial session:', error);
      }
    };

    checkInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (session) {
        console.log('🟢 Active session:', {
          event: event,
          user_id: session.user.id,
          email: session.user.email,
          expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
          access_token: session.access_token.substring(0, 20) + '...',
          refresh_token: session.refresh_token?.substring(0, 20) + '...' || 'N/A',
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata
        });
      } else {
        console.log('🔴 No active session (user logged out or session expired)');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up global session monitor');
      subscription.unsubscribe();
    };
  }, []);

  return (
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
            <ProtectedHomeRoute />
          </Route>
          <Route exact path="/category/:category">
            <ProtectedCategoryRoute />
          </Route>
          <Route exact path="/cart">
            <ProtectedCartRoute />
          </Route>
          <Route exact path="/grocery-list">
            <ProtectedGroceryListRoute />
          </Route>
          <Route exact path="/verified">
            <AccountConfirmation />
          </Route>
          <Route exact path="/oauth-callback">
            <OAuthCallback />
          </Route>
          <Route exact path="/pending-approval">
            <PendingApproval />
          </Route>
          <Route exact path="/admin-dashboard">
            <ProtectedAdminRoute />
          </Route>
          <Route exact path="/store-dashboard">
            <ProtectedStoreRoute />
          </Route>
          <Route exact path="/dti-dashboard">
            <ProtectedDTIRoute />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
