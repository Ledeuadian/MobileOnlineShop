import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/react';
import { checkmarkCircleOutline, homeOutline, cartOutline } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './OrderConfirmation.css';

interface OrderConfirmationState {
  storeName: string;
  storeLocation: string;
  paymentMethod: string;
  itemsCount: number;
  totalItems: number;
  total: number;
  savings: number;
  orderId?: number;
}

const OrderConfirmation: React.FC = () => {
  const history = useHistory();
  const location = useLocation<OrderConfirmationState>();
  const [orderStatus, setOrderStatus] = useState<string>('pending');

  const {
    storeName = 'Store',
    storeLocation = '',
    paymentMethod = 'Cash on Pickup',
    itemsCount = 0,
    totalItems = 0,
    total = 0,
    savings = 0,
    orderId
  } = location.state || {};

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('ORDERS')
          .select('status')
          .eq('orderId', orderId)
          .single();

        if (error) {
          console.error('Error fetching order status:', error);
          return;
        }

        if (data) {
          setOrderStatus(data.status);
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
    };

    // Initial fetch
    fetchOrderStatus();

    // Poll for status updates every 5 seconds
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleGoHome = () => {
    history.push('/grocery-list');
  };

  return (
    <IonPage>
      <IonContent className="order-confirmation-content">
        <div className="confirmation-container">
          {/* Success Icon */}
          <div className="success-icon-container">
            <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
          </div>

          {/* Title */}
          <h1 className="confirmation-title">Order Placed Successfully</h1>

          {/* Store Information */}
          <div className="store-info-card">
            <div className="store-header">
              <IonIcon icon={cartOutline} className="store-icon" />
              <span className="store-name">{storeName}</span>
            </div>
            <p className="store-location">{storeLocation}</p>
          </div>

          {/* Order Details */}
          <div className="order-details">
            <p className="detail-line">
              <span className="detail-label">Paid by:</span>
              <span className="detail-value">{paymentMethod}</span>
            </p>
            <p className="detail-line">
              <span className="detail-label">Items:</span>
              <span className="detail-value">{itemsCount} of {totalItems} purchased</span>
            </p>
            <p className="detail-line">
              <span className="detail-label">Total:</span>
              <span className="detail-value">₱{total.toFixed(2)}</span>
            </p>
            <p className="detail-line savings-line">
              <span className="detail-label">Saved:</span>
              <span className="detail-value savings-value">₱{savings.toFixed(2)}</span>
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="progress-tracker">
            <div className="progress-step active">
              <div className="step-icon">
                <IonIcon icon={checkmarkCircleOutline} />
              </div>
              <span className="step-label">Order Placed</span>
            </div>
            <div className={`progress-line ${orderStatus !== 'pending' ? 'active' : ''}`}></div>
            <div className={`progress-step ${orderStatus === 'pending' || orderStatus === 'ready' || orderStatus === 'picked_up' ? 'active' : ''}`}>
              <div className="step-icon">
                {(orderStatus === 'pending' || orderStatus === 'ready' || orderStatus === 'picked_up') && (
                  <IonIcon icon={checkmarkCircleOutline} />
                )}
              </div>
              <span className="step-label">Preparing</span>
            </div>
            <div className={`progress-line ${orderStatus === 'ready' || orderStatus === 'picked_up' ? 'active' : ''}`}></div>
            <div className={`progress-step ${orderStatus === 'ready' || orderStatus === 'picked_up' ? 'active' : ''}`}>
              <div className="step-icon">
                {(orderStatus === 'ready' || orderStatus === 'picked_up') && (
                  <IonIcon icon={checkmarkCircleOutline} />
                )}
              </div>
              <span className="step-label">Ready for Pickup</span>
            </div>
            <div className={`progress-line ${orderStatus === 'picked_up' ? 'active' : ''}`}></div>
            <div className={`progress-step ${orderStatus === 'picked_up' ? 'active' : ''}`}>
              <div className="step-icon">
                {orderStatus === 'picked_up' && (
                  <IonIcon icon={checkmarkCircleOutline} />
                )}
              </div>
              <span className="step-label">Picked up</span>
            </div>
          </div>

          {/* Go Back Button */}
          <IonButton 
            expand="block" 
            color="primary" 
            className="home-button"
            onClick={handleGoHome}
          >
            <IonIcon icon={homeOutline} slot="start" />
            Go back to home
          </IonButton>

          {/* Thank You Message */}
          <p className="thank-you-message">
            Thank you for shopping smart with us.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OrderConfirmation;
