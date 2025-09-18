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
import { App as CapacitorApp } from '@capacitor/app';

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
import ResetPassword from './pages/ResetPassword';
import AccountConfirmation from './components/AccountConfirmation';
import OAuthCallback from './components/OAuthCallback';
import LocationRequirement from './components/LocationRequirement';
import PendingApproval from './pages/PendingApproval';

// Lazy load heavy dashboard components
const Home = React.lazy(() => import('./pages/Home'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const StoreDashboard = React.lazy(() => import('./pages/StoreDashboard'));
const DTIDashboard = React.lazy(() => import('./pages/DTIDashboard'));
const CategoryProducts = React.lazy(() => import('./pages/CategoryProducts'));
const Cart = React.lazy(() => import('./pages/Cart'));
const GroceryList = React.lazy(() => import('./pages/GroceryList'));
const GroceryStoreResults = React.lazy(() => import('./pages/GroceryStoreResults'));
const NearbyUsers = React.lazy(() => import('./pages/NearbyUsers'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AddressSelection = React.lazy(() => import('./pages/AddressSelection'));
const AddAddress = React.lazy(() => import('./pages/AddAddress'));
import { supabase, checkUserApprovalStatus } from './services/supabaseService';
import { LocationRequirementService } from './services/locationRequirementService';

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

const ProtectedNearbyUsersRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
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

        // Get user details to pass userId to component
        const { data: userData, error: userError } = await supabase
          .from('USER')
          .select('userId')
          .eq('email', session.user.email)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          history.push('/login');
          return;
        }

        setCurrentUserId(userData.userId);
        setIsAuthorized(true);
        console.log('🟢 User authorized for nearby users feature:', session.user.email);
      } catch (error) {
        console.error('Error checking nearby users authorization:', error);
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
      <NearbyUsers currentUserId={currentUserId} />
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
        
        // Check user approval status and userTypeCode
        const approvalResult = await checkUserApprovalStatus(session.user.email);
        
        if (approvalResult?.error) {
          console.error('Error fetching user profile:', approvalResult.error);
          history.push('/login');
          return;
        }
        
        // Check if user is DTI (userTypeCode === 2) - they should not access /home
        if (approvalResult?.data?.userTypeCode === 2) {
          console.log('🔒 DTI user attempting to access /home, redirecting to /dti-dashboard');
          history.push('/dti-dashboard');
          return;
        }
        
        // Check if user is Admin (userTypeCode === 1) - they should not access /home
        if (approvalResult?.data?.userTypeCode === 1) {
          console.log('🔒 Admin user attempting to access /home, redirecting to /admin-dashboard');
          history.push('/admin-dashboard');
          return;
        }
        
        // Check if user is Store (userTypeCode === 3) - they should not access /home
        if (approvalResult?.data?.userTypeCode === 3) {
          console.log('🔒 Store user attempting to access /home, redirecting to /store-dashboard');
          history.push('/store-dashboard');
          return;
        }
        
        // If user is pending approval, redirect to pending page
        if (approvalResult?.data?.approval_status === 'pending') {
          console.log('🟡 User is pending approval, redirecting to pending page');
          history.push('/pending-approval');
          return;
        }
        
        // Only regular consumers (userTypeCode === 4 or other) can access /home
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

const ProtectedGroceryStoreResultsRoute: React.FC = () => {
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

        console.log('🟢 Session found for Grocery Store Results route:', session.user.email);
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking grocery store results authorization:', error);
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
      <GroceryStoreResults />
    </React.Suspense>
  ) : null;
};

const ProtectedCheckoutRoute: React.FC = () => {
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
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking checkout authorization:', error);
        history.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [history]);

  if (isLoading) return (
    <IonPage>
      <IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );

  return isAuthorized ? (
    <React.Suspense fallback={<IonPage><IonContent /></IonPage>}> 
      <Checkout />
    </React.Suspense>
  ) : null;
};

const ProtectedAddressSelectionRoute: React.FC = () => {
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
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking address selection authorization:', error);
        history.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [history]);

  if (isLoading) return (
    <IonPage>
      <IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );

  return isAuthorized ? (
    <React.Suspense fallback={<IonPage><IonContent /></IonPage>}> 
      <AddressSelection />
    </React.Suspense>
  ) : null;
};

const ProtectedAddAddressRoute: React.FC = () => {
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
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking add-address authorization:', error);
        history.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [history]);

  if (isLoading) return (
    <IonPage>
      <IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );

  return isAuthorized ? (
    <React.Suspense fallback={<IonPage><IonContent /></IonPage>}> 
      <AddAddress />
    </React.Suspense>
  ) : null;
};

const App: React.FC = () => {
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [isLocationChecking, setIsLocationChecking] = useState(true);

  // Check location requirements on app start
  useEffect(() => {
    const checkLocationRequirement = async () => {
      try {
        console.log('📍 Checking location requirements on app start...');
        const isReady = await LocationRequirementService.isLocationReady();
        console.log('📍 Location ready status:', isReady);
        
        setIsLocationReady(isReady);
      } catch (error) {
        console.error('❌ Error checking location requirements:', error);
        setIsLocationReady(false);
      } finally {
        setIsLocationChecking(false);
      }
    };

    checkLocationRequirement();
  }, []);

  // Global session monitoring
  useEffect(() => {
    console.log('🔐 Initializing global session monitoring...');
    
    // Add deep link handler for OAuth callback
    const setupDeepLinkHandler = async () => {
      try {
        // Listen for deep link events
        const listener = CapacitorApp.addListener('appUrlOpen', (data) => {
          // Log raw deep link payload for debugging (exact string received from OS)
          console.log('Deep link opened (raw):', data.url);

          // Try to parse URL components for easier inspection
          try {
            const parsed = new URL(data.url);
            console.log('Deep link parsed -> protocol:', parsed.protocol, 'host:', parsed.host, 'pathname:', parsed.pathname, 'search:', parsed.search, 'hash:', parsed.hash);
            // Also log full search/hash param objects
            console.log('Deep link query params:', Object.fromEntries(new URLSearchParams(parsed.search)));
            console.log('Deep link hash params:', Object.fromEntries(new URLSearchParams(parsed.hash.substring(1))));
          } catch (err) {
            console.warn('Could not parse deep link as URL, it may be a custom scheme:', err);
          }

          // Check if this is an OAuth callback
          if (data.url.includes('oauth-callback')) {
            console.log('OAuth callback detected from deep link');
            // Navigate to OAuth callback route to handle the auth result
            window.location.href = '/oauth-callback';
          }
          // Check if this is a verified/confirmation callback
          else if (data.url.includes('verified')) {
            console.log('Email verification detected from deep link');
            // Navigate to verified route to handle the confirmation
            window.location.href = '/verified';
          }
          // Check if this is a password reset callback
          else if (data.url.includes('reset-password')) {
            console.log('Password reset detected from deep link');
            // Navigate to reset password route
            window.location.href = '/reset-password';
          }
          // Handle any other deep link paths
          else {
            console.log('Other deep link detected, extracting path');
            try {
              const url = new URL(data.url);
              const path = url.pathname || '/';
              console.log('Navigating to path:', path);
              window.location.href = path;
            } catch (error) {
              console.error('Error parsing deep link URL:', error);
              window.location.href = '/';
            }
          }
        });

        console.log('Deep link handler registered');
        
        // Check if app was opened with a URL (cold start)
        const urlInfo = await CapacitorApp.getLaunchUrl();
        if (urlInfo?.url) {
          console.log('App launched with URL (cold start raw):', urlInfo.url);
          try {
            const parsed = new URL(urlInfo.url);
            console.log('Launch URL parsed -> protocol:', parsed.protocol, 'host:', parsed.host, 'pathname:', parsed.pathname, 'search:', parsed.search, 'hash:', parsed.hash);
            console.log('Launch URL query params:', Object.fromEntries(new URLSearchParams(parsed.search)));
            console.log('Launch URL hash params:', Object.fromEntries(new URLSearchParams(parsed.hash.substring(1))));
          } catch (err) {
            console.warn('Could not parse launch URL as standard URL; it may be a custom scheme:', err);
          }

          if (urlInfo.url.includes('oauth-callback')) {
            console.log('App launched with OAuth callback URL');
            window.location.href = '/oauth-callback';
          } else if (urlInfo.url.includes('verified')) {
            console.log('App launched with email verification URL');
            window.location.href = '/verified';
          } else if (urlInfo.url.includes('reset-password')) {
            console.log('App launched with password reset URL');
            window.location.href = '/reset-password';
          } else {
            console.log('App launched with other deep link URL');
            try {
              const url = new URL(urlInfo.url);
              const path = url.pathname || '/';
              console.log('Navigating to path:', path);
              window.location.href = path;
            } catch (error) {
              console.error('Error parsing launch URL:', error);
            }
          }
        }

        return listener;
      } catch (error) {
        console.error('Error setting up deep link handler:', error);
        return null;
      }
    };

    setupDeepLinkHandler();
    
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

  const handleLocationReady = () => {
    console.log('✅ Location requirements satisfied, proceeding to app');
    setIsLocationReady(true);
  };

  // Show loading screen while checking location
  if (isLocationChecking) {
    return (
      <IonApp>
        <IonPage>
          <IonContent>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              gap: '20px'
            }}>
              <IonSpinner name="crescent" color="primary" style={{ transform: 'scale(1.5)' }} />
              <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center' }}>
                Initializing location services...
              </p>
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  // Show location requirement screen if location is not ready
  if (!isLocationReady) {
    return (
      <IonApp>
        <LocationRequirement 
          onLocationReady={handleLocationReady} 
          showSkipOption={false}
          forceCheck={true}
        />
      </IonApp>
    );
  }

  // Main app content (only shown after location is ready)
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
          <Route exact path="/reset-password">
            <ResetPassword />
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
          <Route exact path="/checkout">
            <ProtectedCheckoutRoute />
          </Route>
          <Route exact path="/address-selection">
            <ProtectedAddressSelectionRoute />
          </Route>
          <Route exact path="/add-address">
            <ProtectedAddAddressRoute />
          </Route>
          <Route exact path="/grocery-list">
            <ProtectedGroceryListRoute />
          </Route>
          <Route exact path="/grocery-store-results">
            <ProtectedGroceryStoreResultsRoute />
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
          <Route exact path="/nearby-users">
            <ProtectedNearbyUsersRoute />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
