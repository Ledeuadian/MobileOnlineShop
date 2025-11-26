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
  RefresherEventDetail
} from '@ionic/react';
import { arrowBackOutline, personOutline, chevronForwardOutline } from 'ionicons/icons';
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

type FilterType = 'all' | 'ready' | 'picked_up';

const Notifications: React.FC = () => {
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    // Mark as read
    if (!notification.isRead) {
      await supabase
        .from('NOTIFICATIONS')
        .update({ isRead: true })
        .eq('notificationId', notification.notificationId);
      
      // Reload notifications
      loadNotifications();
    }

    // Navigate to order details (you can create this page later)
    history.push(`/order-details/${notification.orderId}`);
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

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.status === filter;
  });

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
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ready">
              <IonLabel>Ready</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="picked_up">
              <IonLabel>Picked Up</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Notifications List */}
          <IonList className="notifications-list">
            {loading ? (
              <div className="loading-message">Loading notifications...</div>
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
