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
  RefresherEventDetail,
  IonSpinner
} from '@ionic/react';
import { arrowBackOutline, cartOutline, chevronForwardOutline } from 'ionicons/icons';
import './MyPurchases.css';

interface Purchase {
  orderId: number;
  orderNumber: string;
  storeId: number;
  status: string;
  paymentMethod: string;
  total: number;
  savings: number;
  itemsCount: number;
  totalItems: number;
  createdAt: string;
  GROCERY_STORE?: {
    name: string;
    location?: string;
  };
}

type FilterType = 'to_pickup' | 'completed';

const MyPurchases: React.FC = () => {
  const history = useHistory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filter, setFilter] = useState<FilterType>('to_pickup');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
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

      // Fetch orders for this user
      const { data, error } = await supabase
        .from('ORDERS')
        .select(`
          orderId,
          orderNumber,
          storeId,
          status,
          paymentMethod,
          total,
          savings,
          itemsCount,
          totalItems,
          createdAt
        `)
        .eq('userId', userData.userId)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error loading purchases:', error);
        return;
      }

      // Fetch store information for each order
      const ordersWithStores = await Promise.all(
        (data || []).map(async (order) => {
          const { data: storeData } = await supabase
            .from('GROCERY_STORE')
            .select('name, location')
            .eq('storeId', order.storeId)
            .single();

          return {
            ...order,
            GROCERY_STORE: storeData || undefined
          };
        })
      );

      setPurchases(ordersWithStores);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadPurchases();
    event.detail.complete();
  };

  const handlePurchaseClick = (purchase: Purchase) => {
    history.push(`/customer-order-details/${purchase.orderId}`);
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'to_pickup') {
      return purchase.status === 'pending' || purchase.status === 'ready';
    } else {
      return purchase.status === 'picked_up';
    }
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} color="dark" />
            </IonButton>
          </IonButtons>
          <IonTitle color="dark">My Purchases</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="purchases-container">
          {/* Filter Segment */}
          <IonSegment 
            value={filter} 
            onIonChange={(e) => setFilter(e.detail.value as FilterType)}
            className="filter-segment"
          >
            <IonSegmentButton value="to_pickup">
              <IonLabel>To Pickup</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>Completed</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Purchases List */}
          <IonList className="purchases-list">
            {loading ? (
              <div className="loading-container">
                <IonSpinner />
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="empty-message">No orders yet</div>
            ) : (
              filteredPurchases.map((purchase) => (
                <IonItem 
                  key={purchase.orderId}
                  button
                  onClick={() => handlePurchaseClick(purchase)}
                  className="purchase-item"
                  lines="none"
                >
                  <div className="purchase-content">
                    <div className="purchase-header">
                      <IonIcon icon={cartOutline} className="cart-icon" />
                      <span className="store-name">{purchase.GROCERY_STORE?.name || 'Store'}</span>
                    </div>
                    
                    <p className="order-number">Order ID: {purchase.orderNumber}</p>
                    <p className="payment-info">Paid by: {purchase.paymentMethod}</p>
                    
                    <div className="purchase-totals">
                      <p className="order-total">ORDER TOTAL: ₱{purchase.total.toFixed(2)}</p>
                      <p className="saved-amount">SAVED: ₱{purchase.savings.toFixed(2)}</p>
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

export default MyPurchases;
