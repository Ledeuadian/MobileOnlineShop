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
  IonBadge
} from '@ionic/react';
import {
  statsChartOutline,
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  storefront,
  person,
  logOutOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import AdminApproval from './AdminApproval';
import ProfileMenu from '../components/ProfileMenu';
import './AdminDashboard.css';

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  approvedDTIUsers: number;
  approvedStores: number;
}

const AdminDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedDTIUsers: 0,
    approvedStores: 0
  });
  
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
      // Get total users
      const { count: totalUsers } = await supabase
        .from('USER')
        .select('*', { count: 'exact', head: true });

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
        totalUsers: totalUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        approvedDTIUsers: approvedDTIUsers || 0,
        approvedStores: approvedStores || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
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
            <IonCard className="stats-card">
              <IonCardContent>
                <div className="stats-content">
                  <IonIcon icon={peopleOutline} className="stats-icon total" />
                  <div className="stats-info">
                    <h2>{stats.totalUsers}</h2>
                    <p>Total Users</p>
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
            <IonCard className="stats-card">
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
            <IonCard className="stats-card">
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
      
      <IonContent fullscreen>
        {/* Side Drawer Menu */}
        <ProfileMenu
          email={email}
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
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
