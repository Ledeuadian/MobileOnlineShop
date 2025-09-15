import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonBadge,
  IonModal,
  IonList,
  IonItem,
  IonText,
  IonButtons
} from '@ionic/react';
import {
  statsChartOutline,
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  storefront,
  person,
  logOutOutline,
  closeOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import AdminApproval from './AdminApproval';
import ProfileMenu from '../components/ProfileMenu';
import './AdminDashboard.css';

interface DashboardStats {
  totalShoppers: number; // Changed from totalUsers to totalShoppers
  pendingApprovals: number;
  approvedDTIUsers: number;
  approvedStores: number;
}

interface User {
  userId: string;
  email: string;
  firstname?: string;
  lastname?: string;
  userTypeCode: number;
  approval_status: string;
  created_at: string;
  contactNumber?: string;
  location?: string;
  // Store-specific fields from GROCERY_STORE table
  store_name?: string;
  store_phone?: string;
  store_email?: string;
}

const AdminDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalShoppers: 0, // Changed from totalUsers to totalShoppers
    pendingApprovals: 0,
    approvedDTIUsers: 0,
    approvedStores: 0
  });

  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getSessionEmail = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };
    getSessionEmail();
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Get total shopper users (userTypeCode = 4)
      const { count: totalShoppers } = await supabase
        .from('USER')
        .select('*', { count: 'exact', head: true })
        .eq('userTypeCode', 4); // Only count shopper users

      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('USER')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      // Get approved DTI users (userTypeCode = 2)
      const { count: approvedDTIUsers } = await supabase
        .from('USER')
        .select('*', { count: 'exact', head: true })
        .eq('userTypeCode', 2)
        .eq('approval_status', 'approved');

      // Get approved stores (userTypeCode = 3)
      const { count: approvedStores } = await supabase
        .from('USER')
        .select('*', { count: 'exact', head: true })
        .eq('userTypeCode', 3)
        .eq('approval_status', 'approved');

      setStats({
        totalShoppers: totalShoppers || 0, // Updated to use totalShoppers
        pendingApprovals: pendingApprovals || 0,
        approvedDTIUsers: approvedDTIUsers || 0,
        approvedStores: approvedStores || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  // Functions to fetch user lists for modals
  const fetchShoppers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('USER')
        .select('userId, email, firstname, lastname, userTypeCode, approval_status, created_at, contactNumber, location')
        .eq('userTypeCode', 4)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
      setModalTitle('Total Shoppers');
      setShowUsersModal(true);
    } catch (error) {
      console.error('Error fetching shoppers:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDTIUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('USER')
        .select('userId, email, firstname, lastname, userTypeCode, approval_status, created_at, contactNumber, location')
        .eq('userTypeCode', 2)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
      setModalTitle('Active DTI Users');
      setShowUsersModal(true);
    } catch (error) {
      console.error('Error fetching DTI users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchActiveStores = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('USER')
        .select(`
          userId, 
          email, 
          firstname, 
          lastname, 
          userTypeCode, 
          approval_status, 
          created_at,
          GROCERY_STORE!userId(
            name,
            location,
            store_phone,
            store_email
          )
        `)
        .eq('userTypeCode', 3)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten the GROCERY_STORE fields
      const transformedData = data?.map(user => ({
        userId: user.userId,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        userTypeCode: user.userTypeCode,
        approval_status: user.approval_status,
        created_at: user.created_at,
        store_name: user.GROCERY_STORE?.[0]?.name,
        location: user.GROCERY_STORE?.[0]?.location,
        store_phone: user.GROCERY_STORE?.[0]?.store_phone,
        store_email: user.GROCERY_STORE?.[0]?.store_email
      })) || [];

      setUsersList(transformedData);
      setModalTitle('Active Stores');
      setShowUsersModal(true);
    } catch (error) {
      console.error('Error fetching active stores:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeModal = () => {
    setShowUsersModal(false);
    setUsersList([]);
    setModalTitle('');
    setExpandedUserId(null);
  };

  const toggleUserDetails = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="admin-welcome">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {email}</p>
      </div>

      {/* Stats Cards */}
      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonCard className="stats-card clickable" button onClick={fetchShoppers}>
              <IonCardContent>
                <div className="stats-content">
                  <IonIcon icon={peopleOutline} className="stats-icon total" />
                  <div className="stats-info">
                    <h2>{stats.totalShoppers}</h2>
                    <p>Total Shoppers</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          
          <IonCol size="6">
            <IonCard className="stats-card">
              <IonCardContent>
                <div className="stats-content">
                  <IonIcon icon={timeOutline} className="stats-icon pending" />
                  <div className="stats-info">
                    <h2>{stats.pendingApprovals}</h2>
                    <p>Pending Approvals</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="6">
            <IonCard className="stats-card clickable" button onClick={fetchDTIUsers}>
              <IonCardContent>
                <div className="stats-content">
                  <IonIcon icon={person} className="stats-icon dti" />
                  <div className="stats-info">
                    <h2>{stats.approvedDTIUsers}</h2>
                    <p>Active DTI Users</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          
          <IonCol size="6">
            <IonCard className="stats-card clickable" button onClick={fetchActiveStores}>
              <IonCardContent>
                <div className="stats-content">
                  <IonIcon icon={storefront} className="stats-icon stores" />
                  <div className="stats-info">
                    <h2>{stats.approvedStores}</h2>
                    <p>Active Stores</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12">
            {/* This row is for future expansion if needed */}
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <IonCard>
          <IonCardContent>
            <div className="action-item">
              <div className="action-info">
                <h4>Pending DTI & Store Registrations</h4>
                <p>Review and approve new user applications</p>
              </div>
              <div className="action-button">
                {stats.pendingApprovals > 0 && (
                  <IonBadge color="warning">{stats.pendingApprovals}</IonBadge>
                )}
                <IonButton 
                  fill="outline" 
                  color="primary"
                  onClick={() => setSelectedSegment('approvals')}
                >
                  Review
                </IonButton>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>System Overview</h3>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>User Registration Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="activity-summary">
              <div className="summary-item">
                <IonIcon icon={checkmarkCircleOutline} color="success" />
                <span>Auto-approved ADMIN accounts</span>
              </div>
              <div className="summary-item">
                <IonIcon icon={timeOutline} color="warning" />
                <span>DTI & Store registrations require approval</span>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Portal</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen id="main-content">
        {/* Side Drawer Menu */}
        <ProfileMenu
          passwordMasked={localStorage.getItem('userPasswordMasked') || '****'}
        />

        {/* Segment Navigation */}
        <IonSegment 
          value={selectedSegment} 
          onIonChange={e => setSelectedSegment(e.detail.value as string)}
          className="admin-segment"
        >
          <IonSegmentButton value="dashboard">
            <IonIcon icon={statsChartOutline} />
            <IonLabel>Dashboard</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="approvals">
            <IonIcon icon={checkmarkCircleOutline} />
            <IonLabel>Approve Registrations</IonLabel>
            {stats.pendingApprovals > 0 && (
              <IonBadge color="danger">{stats.pendingApprovals}</IonBadge>
            )}
          </IonSegmentButton>
        </IonSegment>

        {/* Content based on selected segment */}
        {selectedSegment === 'dashboard' && renderDashboard()}
        {selectedSegment === 'approvals' && <AdminApproval />}

        {/* Logout Button */}
        <div className="admin-logout-section">
          <IonButton 
            expand="block" 
            color="danger" 
            fill="clear"
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>

        {/* Users List Modal */}
        <IonModal isOpen={showUsersModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{modalTitle}</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={closeModal}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {loadingUsers ? (
              <div className="loading-container">
                <p>Loading users...</p>
              </div>
            ) : (
              <IonList>
                {usersList.length === 0 ? (
                  <IonItem>
                    <IonText>No users found</IonText>
                  </IonItem>
                ) : (
                  usersList.map((user) => (
                    <IonItem key={user.userId}>
                      <div className="user-item-content">
                        <div className="user-info">
                          {user.userTypeCode === 3 ? (
                            // Store display with expandable details
                            <>
                              <div className="user-header">
                                <div className="user-basic-info">
                                  <h3>{user.store_name || 'Store name not provided'}</h3>
                                  <small>Joined: {new Date(user.created_at).toLocaleDateString()}</small>
                                </div>
                                <IonButton 
                                  fill="clear" 
                                  size="small"
                                  onClick={() => toggleUserDetails(user.userId)}
                                >
                                  <IonIcon 
                                    icon={expandedUserId === user.userId ? chevronUpOutline : chevronDownOutline} 
                                    slot="start" 
                                  />
                                  View Information
                                </IonButton>
                              </div>
                              
                              {expandedUserId === user.userId && (
                                <div className="user-details">
                                  <p><strong>Email:</strong> {user.store_email || user.email}</p>
                                  {user.location && (
                                    <p><strong>Location:</strong> {user.location}</p>
                                  )}
                                  {user.store_phone && (
                                    <p><strong>Phone:</strong> {user.store_phone}</p>
                                  )}
                                  <p><strong>Status:</strong> {user.approval_status}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            // Shopper and DTI user display
                            <>
                              <div className="user-header">
                                <div className="user-basic-info">
                                  <h3>{user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : 'Name not provided'}</h3>
                                  <small>Joined: {new Date(user.created_at).toLocaleDateString()}</small>
                                </div>
                                <IonButton 
                                  fill="clear" 
                                  size="small"
                                  onClick={() => toggleUserDetails(user.userId)}
                                >
                                  <IonIcon 
                                    icon={expandedUserId === user.userId ? chevronUpOutline : chevronDownOutline} 
                                    slot="start" 
                                  />
                                  View Information
                                </IonButton>
                              </div>
                              
                              {expandedUserId === user.userId && (
                                <div className="user-details">
                                  <p><strong>Email:</strong> {user.email}</p>
                                  {user.contactNumber && (
                                    <p><strong>Contact Number:</strong> {user.contactNumber}</p>
                                  )}
                                  {user.location && (
                                    <p><strong>Location:</strong> {user.location}</p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </IonItem>
                  ))
                )}
              </IonList>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
