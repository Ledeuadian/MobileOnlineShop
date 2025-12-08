import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonToast
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { mapOutline, timeOutline } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './ItemDetails.css';

interface RouteParams {
  storeItemId: string;
}

interface StoreItem {
  storeItemId: number;
  name: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  availability: number;
  unit: string;
  item_image_url: string;
  productTypeId: number;
  created_at: string;
  updated_at: string;
  storeId: number;
}

interface StoreDetails {
  name: string;
  location: string;
}

interface PriceHistory {
  price: number;
  updated_at: string;
  location: string;
}

const ItemDetails: React.FC = () => {
  const { storeItemId } = useParams<RouteParams>();
  const [item, setItem] = useState<StoreItem | null>(null);
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [srpPrice, setSrpPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchItemDetails = async () => {
    try {
      setLoading(true);

      // Fetch item details
      const { data: itemData, error: itemError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*')
        .eq('storeItemId', storeItemId)
        .single();

      if (itemError) throw itemError;
      setItem(itemData);

      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('GROCERY_STORE')
        .select('name, location')
        .eq('storeId', itemData.storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Fetch SRP price
      const { data: srpData } = await supabase
        .from('SRP')
        .select('Price')
        .eq('productTypeId', itemData.productTypeId)
        .maybeSingle();

      if (srpData) {
        setSrpPrice(srpData.Price);
      }

      // Fetch price history (mock data - you can replace with actual history table)
      const history: PriceHistory[] = [
        {
          price: itemData.price,
          updated_at: itemData.updated_at,
          location: storeData.location
        },
        // Add more historical prices if you have a price history table
      ];
      setPriceHistory(history);

    } catch (error) {
      console.error('Error fetching item details:', error);
      setToastMessage('Error loading item details');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeItemId]);

  const handleProceedToAction = () => {
    setToastMessage('Action reviewed and processed');
    setShowToast(true);
    // Add your action logic here
  };

  const calculateDeviation = () => {
    if (!item || !srpPrice) return null;
    const diff = item.price - srpPrice;
    const percentage = ((diff / srpPrice) * 100).toFixed(0);
    return {
      amount: diff,
      percentage: parseInt(percentage)
    };
  };

  const deviation = calculateDeviation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { formattedDate, time };
  };

  const calculateDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/dti-dashboard" />
            </IonButtons>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: '50%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!item || !store) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/dti-dashboard" />
            </IonButtons>
            <IonTitle>Item Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Item details not found.</p>
        </IonContent>
      </IonPage>
    );
  }

  const daysAgo = calculateDaysAgo(item.updated_at);
  const { formattedDate, time } = formatDate(item.updated_at);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dti-dashboard" />
          </IonButtons>
          <IonTitle>{item.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding item-details-content">
        <div className="item-details-container">
          <h1 className="item-title">{item.name}</h1>
          
          <p className="store-name">{store.name}</p>

          <IonCard className="price-info-card">
            <IonCardContent>
              <div className="price-row">
                <div className="price-item">
                  <span className="price-label">DTI SRP</span>
                  <span className="price-value">₱ {srpPrice?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="price-item">
                  <span className="price-label">Actual Store Price</span>
                  <span className="price-value actual-price">₱ {item.price.toFixed(2)}</span>
                </div>
                <div className="price-item">
                  <span className="price-label">Deviation</span>
                  <span className={`price-value ${deviation && deviation.percentage > 0 ? 'deviation-positive' : 'deviation-negative'}`}>
                    {deviation ? `${deviation.percentage > 0 ? '+' : ''}${deviation.percentage}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Last Updated</span>
              <span className="info-value">
                ({daysAgo} days ago) {formattedDate} | {time}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Photo Proof</span>
            </div>
            {item.item_image_url && (
              <div className="photo-proof-container">
                <img 
                  src={item.item_image_url} 
                  alt="Price proof" 
                  className="proof-image"
                />
                <div className="image-metadata">
                  <div className="metadata-item">
                    <IonIcon icon={mapOutline} />
                    <span>{store.location}</span>
                  </div>
                  <div className="metadata-item">
                    <IonIcon icon={timeOutline} />
                    <span>{formattedDate} | {time}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="price-history-section">
            <h3 className="section-title">Price History</h3>
            {priceHistory.map((history, index) => {
              const historyDate = formatDate(history.updated_at);
              return (
                <div key={index} className="history-item">
                  <span className="history-price">₱ {history.price.toFixed(2)}</span>
                  <span className="history-separator">|</span>
                  <span className="history-date">{historyDate.formattedDate}</span>
                  <span className="history-separator">|</span>
                  <span className="history-time">{historyDate.time}</span>
                  <span className="history-separator">|</span>
                  <span className="history-location">{history.location}</span>
                </div>
              );
            })}
          </div>

          <IonButton
            expand="block"
            className="action-button"
            onClick={handleProceedToAction}
          >
            Reviewed: Proceed to Action
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default ItemDetails;
