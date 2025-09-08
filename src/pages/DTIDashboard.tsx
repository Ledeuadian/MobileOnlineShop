import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonList,
  IonSpinner
} from '@ionic/react';
import {
  analyticsOutline,
  storefrontOutline,
  trendingUpOutline,
  eyeOutline,
  cartOutline,
  pricetagOutline,
  logOutOutline,
  refreshOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import ProfileMenu from '../components/ProfileMenu';
import './DTIDashboard.css';

interface DTIStats {
  totalStores: number;
  totalItems: number;
  avgPriceRange: string;
  monthlyTransactions: number;
}

interface StoreData {
  storeId: number;
  storeName: string;
  itemCount: number;
  avgPrice: number;
  status: string;
}

interface ItemPricing {
  itemName: string;
  storeCount: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
}

const DTIDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('analytics');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DTIStats>({
    totalStores: 0,
    totalItems: 0,
    avgPriceRange: 'N/A',
    monthlyTransactions: 0
  });
  const [storesData, setStoresData] = useState<StoreData[]>([]);
  const [itemPricing, setItemPricing] = useState<ItemPricing[]>([]);

  const loadDashboardStats = async () => {
    // Simulate stats - in real implementation, query your grocery database
    setStats({
      totalStores: 25,
      totalItems: 1250,
      avgPriceRange: '$1.50 - $8.99',
      monthlyTransactions: 15420
    });
  };

  const loadStoreAnalytics = async () => {
    // Simulate store data - replace with actual DTI database queries
    const mockStores: StoreData[] = [
      { storeId: 1, storeName: 'Fresh Market Manila', itemCount: 850, avgPrice: 45.50, status: 'Active' },
      { storeId: 2, storeName: 'Metro Grocery Cebu', itemCount: 920, avgPrice: 42.75, status: 'Active' },
      { storeId: 3, storeName: 'City Mall Davao', itemCount: 780, avgPrice: 48.20, status: 'Active' },
      { storeId: 4, storeName: 'SM Supermarket Iloilo', itemCount: 1100, avgPrice: 44.90, status: 'Active' },
      { storeId: 5, storeName: 'Robinsons Supermarket Baguio', itemCount: 650, avgPrice: 46.80, status: 'Under Review' }
    ];
    setStoresData(mockStores);
  };

  const loadItemPricingData = async () => {
    // Simulate item pricing analysis - replace with actual DTI price monitoring
    const mockPricing: ItemPricing[] = [
      { itemName: 'Rice (1kg)', storeCount: 25, minPrice: 48.00, maxPrice: 58.00, avgPrice: 52.50 },
      { itemName: 'Chicken Breast (1kg)', storeCount: 22, minPrice: 180.00, maxPrice: 220.00, avgPrice: 195.50 },
      { itemName: 'Cooking Oil (1L)', storeCount: 25, minPrice: 85.00, maxPrice: 110.00, avgPrice: 96.25 },
      { itemName: 'Sugar (1kg)', storeCount: 24, minPrice: 65.00, maxPrice: 78.00, avgPrice: 71.20 },
      { itemName: 'Onions (1kg)', storeCount: 20, minPrice: 120.00, maxPrice: 160.00, avgPrice: 138.75 }
    ];
    setItemPricing(mockPricing);
  };

  const loadDTIData = useCallback(async () => {
    setLoading(true);
    try {
      await loadDashboardStats();
      await loadStoreAnalytics();
      await loadItemPricingData();
    } catch (error) {
      console.error('Error loading DTI data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDTIData();
  }, [loadDTIData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <IonPage>
        <div className="dti-loading">
          <IonSpinner name="crescent" />
          <p>Loading DTI Dashboard...</p>
        </div>
      </IonPage>
    );
  }

  const renderAnalytics = () => (
    <div className="dti-analytics-container">
      <div className="dti-welcome">
        <h1>DTI Analytics Dashboard</h1>
        <p>Monitor grocery stores and pricing across the Philippines</p>
      </div>
      
      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={storefrontOutline} className="dti-stats-icon stores" />
                <div className="dti-stats-info">
                  <h2>{stats.totalStores}</h2>
                  <p>Monitored Stores</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={cartOutline} className="dti-stats-icon items" />
                <div className="dti-stats-info">
                  <h2>{stats.totalItems}</h2>
                  <p>Tracked Items</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={pricetagOutline} className="dti-stats-icon pricing" />
                <div className="dti-stats-info">
                  <h2>{stats.avgPriceRange}</h2>
                  <p>Price Range</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard className="dti-stats-card">
              <IonCardContent className="dti-stats-content">
                <IonIcon icon={trendingUpOutline} className="dti-stats-icon transactions" />
                <div className="dti-stats-info">
                  <h2>{stats.monthlyTransactions}</h2>
                  <p>Monthly Reports</p>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      <div className="dti-section">
        <h3>K-Nearest Neighbors Algorithm Insights</h3>
        <IonCard>
          <IonCardContent>
            <div className="dti-insights">
              <div className="insight-item">
                <IonIcon icon={eyeOutline} color="primary" />
                <span>Real-time price monitoring across {stats.totalStores} grocery stores</span>
              </div>
              <div className="insight-item">
                <IonIcon icon={analyticsOutline} color="success" />
                <span>ML-powered price prediction and market trend analysis</span>
              </div>
              <div className="insight-item">
                <IonIcon icon={trendingUpOutline} color="warning" />
                <span>Automated alerts for unusual price fluctuations</span>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );

  const renderStoreMonitoring = () => (
    <div className="dti-stores-container">
      <div className="dti-section-header">
        <h2>Store Monitoring</h2>
        <IonButton fill="clear" onClick={() => loadDTIData()}>
          <IonIcon icon={refreshOutline} />
        </IonButton>
      </div>
      
      <IonList>
        {storesData.map((store: StoreData) => (
          <IonCard key={`store-${store.storeId}`}>
            <IonCardContent>
              <div className="store-monitoring-item">
                <div className="store-info">
                  <h3>{store.storeName}</h3>
                  <p>{store.itemCount} items tracked</p>
                  <p>Avg Price: ₱{store.avgPrice.toFixed(2)}</p>
                </div>
                <div className="store-actions">
                  <IonBadge color={store.status === 'Active' ? 'success' : 'warning'}>
                    {store.status}
                  </IonBadge>
                  <IonButton size="small" fill="outline">
                    <IonIcon icon={eyeOutline} slot="start" />
                    View Details
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </IonList>
    </div>
  );

  const renderItemPricing = () => (
    <div className="dti-pricing-container">
      <div className="dti-section-header">
        <h2>Item Pricing Analysis</h2>
        <IonButton fill="clear" onClick={() => loadDTIData()}>
          <IonIcon icon={refreshOutline} />
        </IonButton>
      </div>
      
      <IonList>
        {itemPricing.map((item: ItemPricing) => (
          <IonCard key={`item-${item.itemName.replace(/\s+/g, '-').toLowerCase()}`}>
            <IonCardContent>
              <div className="pricing-analysis-item">
                <div className="item-info">
                  <h3>{item.itemName}</h3>
                  <p>Available in {item.storeCount} stores</p>
                </div>
                <div className="price-range">
                  <div className="price-stat">
                    <span className="price-label">Min:</span>
                    <span className="price-value">₱{item.minPrice.toFixed(2)}</span>
                  </div>
                  <div className="price-stat">
                    <span className="price-label">Max:</span>
                    <span className="price-value">₱{item.maxPrice.toFixed(2)}</span>
                  </div>
                  <div className="price-stat">
                    <span className="price-label">Avg:</span>
                    <span className="price-value avg">₱{item.avgPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </IonList>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>DTI Dashboard</IonTitle>
          <ProfileMenu />
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="dti-segment">
          <IonSegment 
            value={selectedSegment} 
            onIonChange={e => setSelectedSegment(e.detail.value as string)}
          >
            <IonSegmentButton value="analytics">
              <IonIcon icon={analyticsOutline} />
              <IonLabel>Analytics</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="stores">
              <IonIcon icon={storefrontOutline} />
              <IonLabel>Monitor Stores</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="pricing">
              <IonIcon icon={pricetagOutline} />
              <IonLabel>View Item Pricing</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {selectedSegment === 'analytics' && renderAnalytics()}
        {selectedSegment === 'stores' && renderStoreMonitoring()}
        {selectedSegment === 'pricing' && renderItemPricing()}

        <div className="dti-logout-section">
          <IonButton 
            expand="block" 
            fill="clear" 
            className="dti-logout-btn"
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DTIDashboard;
