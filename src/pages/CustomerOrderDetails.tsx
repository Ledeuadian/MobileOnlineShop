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
  IonSpinner
} from '@ionic/react';
import { arrowBackOutline, cartOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import './CustomerOrderDetails.css';

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
  storeId: number;
  GROCERY_STORE?: {
    name: string;
    location?: string;
  };
}

const CustomerOrderDetails: React.FC = () => {
  const history = useHistory();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  useEffect(() => {
    loadOrderDetails(true); // Initial load with loading spinner

    // Poll for status updates every 5 seconds
    const interval = setInterval(() => {
      loadOrderDetails(); // Silent background updates
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetails = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('ORDERS')
        .select('*')
        .eq('orderId', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('Error loading order:', orderError);
        return;
      }

      // Fetch store information
      const { data: storeData, error: storeError } = await supabase
        .from('GROCERY_STORE')
        .select('name, location')
        .eq('storeId', orderData.storeId)
        .single();

      if (storeError) {
        console.error('Error loading store:', storeError);
      }

      setOrder({
        ...orderData,
        GROCERY_STORE: storeData || undefined
      });

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('ORDER_ITEMS')
        .select('*')
        .eq('orderId', orderId);

      if (itemsError) {
        console.error('Error loading order items:', itemsError);
        return;
      }

      // Fetch item details for each order item
      const itemsWithDetails = await Promise.all(
        (itemsData || []).map(async (item) => {
          const { data: itemDetails } = await supabase
            .from('ITEMS_IN_STORE')
            .select('name, unit, brand')
            .eq('storeItemId', item.storeItemId)
            .single();

          return {
            ...item,
            ITEMS_IN_STORE: itemDetails
          };
        })
      );

      setOrderItems(itemsWithDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'ready', 'picked_up'];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="light">
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} color="dark" />
              </IonButton>
            </IonButtons>
            <IonTitle color="dark">Purchase Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="light">
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} color="dark" />
              </IonButton>
            </IonButtons>
            <IonTitle color="dark">Purchase Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Order not found</p>
        </IonContent>
      </IonPage>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} color="dark" />
            </IonButton>
          </IonButtons>
          <IonTitle color="dark">Purchase Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="customer-order-container">
          {/* Order Status Progress */}
          <div className="status-section">
            <h3 className="section-title">Order Status</h3>
            <div className="status-tracker">
              <div className={`status-step ${currentStep >= 0 ? 'active' : ''}`}>
                <div className="step-circle">
                  {currentStep >= 0 && <div className="step-fill"></div>}
                </div>
                <span className="step-label">Order<br/>Placed</span>
              </div>
              <div className={`status-line ${currentStep >= 1 ? 'active' : ''}`}></div>
              <div className={`status-step ${currentStep >= 0 ? 'active' : ''}`}>
                <div className="step-circle">
                  {currentStep >= 0 && <div className="step-fill"></div>}
                </div>
                <span className="step-label">Preparing</span>
              </div>
              <div className={`status-line ${currentStep >= 1 ? 'active' : ''}`}></div>
              <div className={`status-step ${currentStep >= 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {currentStep >= 1 && <div className="step-fill"></div>}
                </div>
                <span className="step-label">Ready for<br/>Pickup</span>
              </div>
              <div className={`status-line ${currentStep >= 2 ? 'active' : ''}`}></div>
              <div className={`status-step ${currentStep >= 2 ? 'active' : ''}`}>
                <div className="step-circle">
                  {currentStep >= 2 && <div className="step-fill"></div>}
                </div>
                <span className="step-label">Picked<br/>up</span>
              </div>
            </div>
          </div>

          {/* Store Information Card */}
          <div className="store-card">
            <div className="store-card-header" onClick={() => setItemsExpanded(!itemsExpanded)}>
              <div className="store-info">
                <IonIcon icon={cartOutline} className="store-icon" />
                <span className="store-name">{order.GROCERY_STORE?.name || 'Store'}</span>
              </div>
              <IonIcon 
                icon={itemsExpanded ? chevronUpOutline : chevronDownOutline} 
                className="expand-icon"
              />
            </div>

            {itemsExpanded && (
              <div className="items-list-container">
                {orderItems.map((item) => (
                  <div key={item.orderItemId} className="order-item-row">
                    <div className="item-info">
                      <span className="item-name">{item.ITEMS_IN_STORE?.name}</span>
                      <span className="item-details">
                        {item.quantity}{item.ITEMS_IN_STORE?.unit}
                        {item.ITEMS_IN_STORE?.brand && ` ${item.ITEMS_IN_STORE.brand}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="store-totals">
              <p className="total-line">
                <span>ORDER TOTAL:</span>
                <span className="total-amount">₱{order.total.toFixed(2)}</span>
              </p>
              <p className="saved-line">
                <span>SAVED:</span>
                <span className="saved-amount">₱{order.savings.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="details-card">
            <div className="details-header">
              <span className="details-title">Order details</span>
              <IonIcon icon={chevronDownOutline} className="details-icon" />
            </div>
            <div className="details-content">
              <p className="detail-item">Order ID: {order.orderNumber}</p>
              <p className="detail-item">Paid by: {order.paymentMethod}</p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerOrderDetails;
