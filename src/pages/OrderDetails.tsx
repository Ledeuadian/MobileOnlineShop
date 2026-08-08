import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
  IonList,
  IonItem,
  IonCheckbox,
  IonSpinner,
  IonToast
} from '@ionic/react';
import { arrowBackOutline, personOutline } from 'ionicons/icons';
import './OrderDetails.css';

interface OrderItem {
  orderItemId: number;
  storeItemId: number;
  quantity: number;
  price: number;
  subTotal: number;
  ITEMS_IN_STORE?: {
    name: string;
    unit: string;
    brand?: string;
  };
}

interface OrderDetails {
  orderId: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  savings: number;
  itemsCount: number;
  totalItems: number;
  createdAt: string;
  USER: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

const OrderDetails: React.FC = () => {
  const history = useHistory();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showPickupConfirmAlert, setShowPickupConfirmAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order details with user information
      const { data: orderData, error: orderError } = await supabase
        .from('ORDERS')
        .select(`
          orderId,
          orderNumber,
          status,
          paymentMethod,
          total,
          savings,
          itemsCount,
          totalItems,
          createdAt,
          userId
        `)
        .eq('orderId', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('Error loading order:', orderError);
        return;
      }

      // Fetch user details separately
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('firstname, lastname, email')
        .eq('userId', orderData.userId)
        .maybeSingle();

      if (userError) {
        console.error('Error loading user:', userError);
      }

      setOrder({
        ...orderData,
        USER: userData || { firstname: '', lastname: '', email: '' }
      });

      // Fetch order items with item details
      const { data: itemsData, error: itemsError } = await supabase
        .from('ORDER_ITEMS')
        .select('orderItemId, storeItemId, quantity, price, subTotal')
        .eq('orderId', orderId);

      if (itemsError) {
        console.error('Error loading order items:', itemsError);
        return;
      }

      // Fetch item details for each order item
      const itemsWithDetails: OrderItem[] = [];
      for (const item of itemsData || []) {
        const { data: itemDetail } = await supabase
          .from('ITEMS_IN_STORE')
          .select('name, unit, brand')
          .eq('storeItemId', item.storeItemId)
          .single();

        itemsWithDetails.push({
          ...item,
          ITEMS_IN_STORE: itemDetail || { name: 'Unknown Item', unit: '' }
        });
      }

      setOrderItems(itemsWithDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCheck = (orderItemId: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderItemId)) {
        newSet.delete(orderItemId);
      } else {
        newSet.add(orderItemId);
      }
      return newSet;
    });
  };

  const handleCompleteOrder = () => {
    // Check if all items are checked
    if (checkedItems.size !== orderItems.length) {
      alert('Please check all items before completing the order');
      return;
    }

    // Show confirmation alert
    setShowConfirmAlert(true);
  };

  const confirmCompleteOrder = async () => {
    try {
      setShowConfirmAlert(false);
      
      // Update order status to 'ready'
      const { error } = await supabase
        .from('ORDERS')
        .update({ status: 'ready', updatedAt: new Date().toISOString() })
        .eq('orderId', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Error completing order');
        return;
      }

      // Update notification status
      await supabase
        .from('NOTIFICATIONS')
        .update({ status: 'ready' })
        .eq('orderId', orderId);

      setToastMessage('Order marked as ready for pickup! ✓');
      setShowToast(true);
      
      // Navigate back after a short delay to show the toast
      setTimeout(() => {
        history.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Error completing order');
    }
  };

  const handleMarkAsPickedUp = () => {
    setShowPickupConfirmAlert(true);
  };

  const confirmMarkAsPickedUp = async () => {
    try {
      setShowPickupConfirmAlert(false);
      
      // Update order status to 'picked_up'
      const { error } = await supabase
        .from('ORDERS')
        .update({ status: 'picked_up', updatedAt: new Date().toISOString() })
        .eq('orderId', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Error marking order as picked up');
        return;
      }

      // Update notification status
      await supabase
        .from('NOTIFICATIONS')
        .update({ status: 'picked_up' })
        .eq('orderId', orderId);

      setToastMessage('Order marked as picked up! ✓');
      setShowToast(true);
      
      // Navigate back after a short delay to show the toast
      setTimeout(() => {
        history.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error marking order as picked up:', error);
      alert('Error marking order as picked up');
    }
  };

  const getCustomerName = () => {
    if (!order) return '';
    const { firstname, lastname, email } = order.USER;
    if (firstname && lastname) {
      return `${firstname} ${lastname}`;
    }
    return email || 'Customer';
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <IonSpinner />
            <p>Loading order details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Order not found</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Order Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="order-details-container">
          {/* Customer Information */}
          <div className="customer-info">
            <div className="customer-header">
              <IonIcon icon={personOutline} className="customer-icon" />
              <span className="customer-name">{getCustomerName()}</span>
            </div>
            <p className="order-number">Order #: {order.orderNumber}</p>
            <p className="payment-method">Payment: {order.paymentMethod}</p>
            <p className="order-total">ORDER TOTAL: ₱{order.total.toFixed(2)}</p>
          </div>

          {/* Order Items List */}
          <div className="items-section">
            <IonList className="items-list">
              {orderItems.map((item) => (
                <IonItem
                  key={item.orderItemId}
                  lines="none"
                  className={`order-item ${order.status === 'ready' ? 'item-ready' : checkedItems.has(item.orderItemId) ? 'item-checked' : ''}`}
                  button={order.status === 'pending'}
                  onClick={() => order.status === 'pending' && toggleItemCheck(item.orderItemId)}
                >
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-name">{item.ITEMS_IN_STORE?.name}</span>
                    </div>
                    <div className="item-details">
                      <span className="item-quantity">
                        {item.quantity}{item.ITEMS_IN_STORE?.unit}
                      </span>
                      <span className="item-brand">
                        {item.ITEMS_IN_STORE?.brand || ''}
                      </span>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <IonCheckbox
                      slot="end"
                      checked={checkedItems.has(item.orderItemId)}
                      onIonChange={() => toggleItemCheck(item.orderItemId)}
                    />
                  )}
                </IonItem>
              ))}
            </IonList>
          </div>

          {/* Complete Order Button - Only show for pending orders */}
          {order.status === 'pending' && (
            <div className="complete-button-container">
              <IonButton
                expand="block"
                color="medium"
                className="complete-button"
                onClick={handleCompleteOrder}
                disabled={checkedItems.size !== orderItems.length}
              >
                Complete Order
              </IonButton>
            </div>
          )}

          {/* Mark as Picked Up Button - Only show for ready orders */}
          {order.status === 'ready' && (
            <div className="complete-button-container">
              <IonButton
                expand="block"
                color="success"
                className="pickup-button"
                onClick={handleMarkAsPickedUp}
              >
                ✓ Mark as Picked Up
              </IonButton>
            </div>
          )}
        </div>

        {/* Custom Confirmation Modal */}
        {showConfirmAlert && (
          <div className="custom-alert-backdrop" onClick={() => setShowConfirmAlert(false)}>
            <div className="custom-alert-container" onClick={(e) => e.stopPropagation()}>
              <div className="order-total-header">ORDER TOTAL: ₱{order?.total?.toFixed(2) || '0.00'}</div>
              
              <div className="alert-icon-container">
                <svg viewBox="0 0 120 120" className="warning-icon">
                  <defs>
                    <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ff6b6b', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ee5a6f', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <ellipse cx="60" cy="60" rx="55" ry="45" fill="url(#redGradient)" opacity="0.9" transform="rotate(-15 60 60)" />
                  <path d="M 40 35 Q 60 20 80 35" stroke="#c44" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <rect x="55" y="35" width="10" height="35" rx="5" fill="white" />
                  <circle cx="60" cy="80" r="6" fill="white" />
                  <circle cx="48" cy="82" r="3" fill="white" opacity="0.7" />
                  <circle cx="72" cy="82" r="3" fill="white" opacity="0.7" />
                </svg>
              </div>

              <h2 className="alert-title">Are you sure you've completed this order?</h2>
              <p className="alert-message">Once confirmed, it will be marked as Ready for Pickup.</p>

              <div className="alert-buttons">
                <button className="confirm-btn" onClick={confirmCompleteOrder}>
                  Confirm
                </button>
                <button className="review-btn" onClick={() => setShowConfirmAlert(false)}>
                  Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pickup Confirmation Modal */}
        {showPickupConfirmAlert && (
          <div className="custom-alert-backdrop" onClick={() => setShowPickupConfirmAlert(false)}>
            <div className="custom-alert-container" onClick={(e) => e.stopPropagation()}>
              <div className="order-total-header">ORDER TOTAL: ₱{order?.total?.toFixed(2) || '0.00'}</div>
              
              <div className="alert-icon-container">
                <svg viewBox="0 0 120 120" className="warning-icon">
                  <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <ellipse cx="60" cy="60" rx="55" ry="45" fill="url(#greenGradient)" opacity="0.9" transform="rotate(-15 60 60)" />
                  <path d="M 35 55 L 50 70 L 85 35" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h2 className="alert-title">Mark this order as picked up?</h2>
              <p className="alert-message">Confirm that the customer has received their order.</p>

              <div className="alert-buttons">
                <button className="confirm-btn" onClick={confirmMarkAsPickedUp}>
                  Confirm Pickup
                </button>
                <button className="review-btn" onClick={() => setShowPickupConfirmAlert(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage || "Order marked as ready for pickup! ✓"}
          duration={1500}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default OrderDetails;
