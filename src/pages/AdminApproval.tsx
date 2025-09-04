import React, { useEffect, useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonList,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonSpinner,
  IonAlert
} from '@ionic/react';
import { 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  personOutline, 
  mailOutline,
  refreshOutline
} from 'ionicons/icons';
import { getPendingUsers, approveUser, rejectUser } from '../services/supabaseService';
import './AdminApproval.css';

interface PendingUser {
  UserID: number;
  email: string;
  firstname: string;
  lastname: string;
  userTypeCode: number;
  approval_status: string;
  created_at: string;
}

const AdminApproval: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [alertAction, setAlertAction] = useState<'approve' | 'reject'>('approve');

  const loadPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPendingUsers();
      if (result && 'data' in result) {
        setPendingUsers(result.data || []);
      } else {
        console.error('Error loading pending users:', result?.error);
        showToastMessage('Error loading pending users', 'danger');
      }
    } catch (error) {
      console.error('Error loading pending users:', error);
      showToastMessage('Error loading pending users', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const showToastMessage = (message: string, color: string = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user);
    setAlertAction('approve');
    setShowAlert(true);
  };

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user);
    setAlertAction('reject');
    setShowAlert(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (alertAction === 'approve') {
        await approveUser(selectedUser.email);
        showToastMessage(`${selectedUser.firstname} ${selectedUser.lastname} has been approved!`);
      } else {
        await rejectUser(selectedUser.email);
        showToastMessage(`${selectedUser.firstname} ${selectedUser.lastname} has been rejected!`, 'warning');
      }
      
      // Refresh the list
      loadPendingUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showToastMessage('Error updating user status', 'danger');
    }
    
    setShowAlert(false);
    setSelectedUser(null);
  };

  const getUserTypeText = (code: number) => {
    switch (code) {
      case 1: return 'ADMIN';
      case 2: return 'DTI';
      case 3: return 'STORE';
      default: return 'Unknown';
    }
  };

  const getUserTypeBadgeColor = (code: number) => {
    switch (code) {
      case 1: return 'primary';
      case 2: return 'secondary';
      case 3: return 'tertiary';
      default: return 'medium';
    }
  };

  const doRefresh = (event: CustomEvent) => {
    loadPendingUsers().then(() => {
      event.detail.complete();
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Approval Panel</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        <div className="admin-container">
          <div className="admin-header">
            <h2>Pending User Approvals</h2>
            <p>Review and approve user registration requests</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Loading pending users...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={personOutline} className="empty-icon" />
              <h3>No Pending Approvals</h3>
              <p>All user registrations have been processed.</p>
            </div>
          ) : (
            <IonList>
              {pendingUsers.map((user) => (
                <IonCard key={user.UserID} className="user-card">
                  <IonCardContent>
                    <div className="user-info">
                      <div className="user-details">
                        <div className="user-name">
                          <IonIcon icon={personOutline} className="user-icon" />
                          <span>{user.firstname} {user.lastname}</span>
                        </div>
                        <div className="user-email">
                          <IonIcon icon={mailOutline} className="email-icon" />
                          <span>{user.email}</span>
                        </div>
                        <div className="user-meta">
                          <IonBadge color={getUserTypeBadgeColor(user.userTypeCode)}>
                            {getUserTypeText(user.userTypeCode)}
                          </IonBadge>
                          <span className="created-date">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <IonButton 
                          size="small" 
                          color="success" 
                          fill="solid"
                          onClick={() => handleApprove(user)}
                        >
                          <IonIcon icon={checkmarkCircleOutline} slot="start" />
                          Approve
                        </IonButton>
                        <IonButton 
                          size="small" 
                          color="danger" 
                          fill="outline"
                          onClick={() => handleReject(user)}
                        >
                          <IonIcon icon={closeCircleOutline} slot="start" />
                          Reject
                        </IonButton>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          )}
        </div>

        {/* Confirmation Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertAction === 'approve' ? 'Approve User' : 'Reject User'}
          message={
            selectedUser
              ? `Are you sure you want to ${alertAction} ${selectedUser.firstname} ${selectedUser.lastname}'s registration?`
              : ''
          }
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: alertAction === 'approve' ? 'Approve' : 'Reject',
              role: 'confirm',
              handler: confirmAction,
            },
          ]}
        />

        {/* Toast for feedback */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminApproval;
