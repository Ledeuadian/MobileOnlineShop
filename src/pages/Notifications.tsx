import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  RefresherEventDetail
} from '@ionic/react';
import { arrowBackOutline, personOutline, chevronForwardOutline, warningOutline, documentTextOutline } from 'ionicons/icons';
import './Notifications.css';

interface Notification {
  notificationId: number;
  orderId: number;
  customerName: string;
  orderNumber: string;
  paymentMethod: string;
  total: number;
  status: string;
  isRead: boolean;
  createdAt: string;
}

interface Clarification {
  clarificationId: number;
  storeId: number;
  itemId: number | null;
  dtiUserId: number;
  title: string;
  message: string;
  attachmentUrl: string | null;
  status: string;
  storeResponse: string | null;
  supplierInvoiceUrl: string | null;
  deliveryReceiptUrl: string | null;
  proofOfCostUrl: string | null;
  freightJustificationUrl: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'all' | 'ready' | 'picked_up' | 'clarifications';

const Notifications: React.FC = () => {
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Get public userId
      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (!userData) {
        console.error('User data not found');
        return;
      }

      // Fetch notifications for this user (store owner)
      const { data, error } = await supabase
        .from('NOTIFICATIONS')
        .select('*')
        .eq('userId', userData.userId)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);

      // Fetch clarifications for this store owner
      // First get the store ID for this user
      const { data: storeData } = await supabase
        .from('GROCERY_STORE')
        .select('storeId')
        .eq('owner_id', user.id)
        .single();

      if (storeData) {
        const { data: clarificationData, error: clarificationError } = await supabase
          .from('DTI_CLARIFICATIONS')
          .select('*')
          .eq('storeId', storeData.storeId)
          .order('createdAt', { ascending: false });

        if (!clarificationError) {
          setClarifications(clarificationData || []);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadNotifications();
    event.detail.complete();
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await supabase
          .from('NOTIFICATIONS')
          .update({ isRead: true })
          .eq('notificationId', notification.notificationId);
        loadNotifications();
      }
      history.push(`/order-details/${notification.orderId}`);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleClarificationClick = async (clarification: Clarification) => {
    try {
      if (!clarification.isRead) {
        await supabase
          .from('DTI_CLARIFICATIONS')
          .update({ isRead: true })
          .eq('clarificationId', clarification.clarificationId);
        loadNotifications();
      }
      history.push(`/clarification-details/${clarification.clarificationId}`);
    } catch (error) {
      console.error('Error handling clarification click:', error);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const filteredNotifications = filter === 'clarifications' ? [] : notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.status === filter;
  });

  const unreadClarificationsCount = clarifications.filter(c => !c.isRead).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="notifications-container">
          {/* Filter Segment */}
          <IonSegment 
            value={filter} 
            onIonChange={(e) => setFilter(e.detail.value as FilterType)}
            className="filter-segment"
          >
            <IonSegmentButton value="all">
              <IonLabel>Orders</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ready">
              <IonLabel>Ready</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="picked_up">
              <IonLabel>Picked Up</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="clarifications">
              <IonLabel>
                DTI Notices
                {unreadClarificationsCount > 0 && (
                  <IonBadge color="danger" style={{ marginLeft: '4px' }}>
                    {unreadClarificationsCount}
                  </IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Notifications List */}
          <IonList className="notifications-list">
            {loading ? (
              <div className="loading-message">Loading notifications...</div>
            ) : filter === 'clarifications' ? (
              clarifications.length === 0 ? (
                <div className="empty-message">No DTI notices</div>
              ) : (
                clarifications.map((clarif) => (
                  <IonItem 
                    key={clarif.clarificationId}
                    button
                    onClick={() => handleClarificationClick(clarif)}
                    className={`notification-item clarification-item ${!clarif.isRead ? 'unread' : ''}`}
                    lines="none"
                  >
                    <div className="notification-content">
                      <div className="notification-header">
                        <IonIcon icon={warningOutline} className="user-icon" style={{ color: '#ffc107' }} />
                        <span className="customer-name" style={{ color: '#ffc107', fontWeight: 'bold' }}>
                          DTI Notice of Clarification
                        </span>
                      </div>
                      
                      <div className="notification-details">
                        <p className="order-info" style={{ fontWeight: '600', marginTop: '0.5rem' }}>
                          {clarif.title}
                        </p>
                        <p className="payment-info" style={{ fontSize: '13px', color: '#666', marginTop: '0.25rem' }}>
                          {clarif.message.length > 100 ? clarif.message.substring(0, 100) + '...' : clarif.message}
                        </p>
                        {clarif.attachmentUrl && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IonIcon icon={documentTextOutline} style={{ fontSize: '16px', color: '#999' }} />
                            <span style={{ fontSize: '12px', color: '#999' }}>Attachment included</span>
                          </div>
                        )}
                        <IonBadge 
                          color={clarif.status === 'pending' ? 'warning' : clarif.status === 'responded' ? 'primary' : 'success'} 
                          style={{ marginTop: '0.5rem' }}
                        >
                          {clarif.status.toUpperCase()}
                        </IonBadge>
                      </div>
                      
                      <div className="notification-footer">
                        <span className="time-ago">{getTimeAgo(clarif.createdAt)}</span>
                      </div>
                    </div>
                    
                    <IonIcon icon={chevronForwardOutline} slot="end" className="chevron" />
                  </IonItem>
                ))
              )
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-message">No notifications</div>
            ) : (
              filteredNotifications.map((notif) => (
                <IonItem 
                  key={notif.notificationId}
                  button
                  onClick={() => handleNotificationClick(notif)}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  lines="none"
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <IonIcon icon={personOutline} className="user-icon" />
                      <span className="customer-name">{notif.customerName}</span>
                    </div>
                    
                    <div className="notification-details">
                      <p className="order-info">Order #: {notif.orderNumber}</p>
                      <p className="payment-info">Payment: {notif.paymentMethod}</p>
                      <p className="total-info">ORDER TOTAL: ₱{notif.total.toFixed(2)}</p>
                    </div>
                    
                    <div className="notification-footer">
                      <span className="time-ago">{getTimeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                  
                  <IonIcon icon={chevronForwardOutline} slot="end" className="chevron" />
                </IonItem>
              ))
            )}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
