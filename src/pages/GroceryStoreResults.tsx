import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip
} from '@ionic/react';
import { 
  arrowBackOutline, 
  storefrontOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  locationOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import { LocationService } from '../services/locationService';
import { KNNService } from '../services/knnService';
import './GroceryStoreResults.css';

interface GroceryItem {
  id: number;
  name: string;
  description?: string;
  brand?: string;
  variant?: string;
  unit?: string;
  checked: boolean;
}

interface StoreItem {
  storeItemId: number;
  name: string;
  description: string;
  category: string;
  price: number;
  availability: number;
  unit: string;
  brand: string;
  productTypeId: number;
}

interface StoreResult {
  storeId: number;
  storeName: string;
  totalItems: number;
  availableItems: number;
  matchedItems: StoreItem[];
  availabilityScore: number;
  distance?: number; // Distance in kilometers
  distanceScore: number; // Score based on proximity (higher = closer)
}

const GroceryStoreResults: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ selectedItems: GroceryItem[] }>();
  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems] = useState<GroceryItem[]>(location.state?.selectedItems || []);

  const fetchStoreResults = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Searching stores for selected items:', selectedItems);

      // Get all stores
      const { data: stores, error: storesError } = await supabase
        .from('GROCERY_STORE')
        .select('storeId')
        .order('storeId');

      if (storesError) {
        console.error('Error fetching stores:', storesError);
        return;
      }

      // Get all items from ITEMS_IN_STORE for the selected product names
      const selectedNames = selectedItems.map(item => item.name);
      
      const { data: storeItems, error: itemsError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*')
        .in('name', selectedNames);

      if (itemsError) {
        console.error('Error fetching store items:', itemsError);
        return;
      }

      console.log(`Found ${storeItems?.length || 0} matching items across stores`);

      // Process results by store
      const storeResultsMap: { [storeId: number]: StoreResult } = {};

      // Initialize all stores
      stores?.forEach(store => {
        storeResultsMap[store.storeId] = {
          storeId: store.storeId,
          storeName: `Store ${store.storeId}`, // Default name, can be enhanced later
          totalItems: 0,
          availableItems: 0,
          matchedItems: [],
          availabilityScore: 0,
          distance: undefined,
          distanceScore: 0
        };
      });

      // Group items by store and calculate availability
      storeItems?.forEach(item => {
        if (storeResultsMap[item.storeId]) {
          storeResultsMap[item.storeId].matchedItems.push(item);
        }
      });

      // Calculate unique matches and availability for each store
      Object.values(storeResultsMap).forEach(store => {
        const uniqueMatches = new Set<string>();
        const availableMatches = new Set<string>();

        store.matchedItems.forEach(item => {
          uniqueMatches.add(item.name);
          if (item.availability === 1) {
            availableMatches.add(item.name);
          }
        });

        store.totalItems = uniqueMatches.size;
        store.availableItems = availableMatches.size;
      });

      // Calculate availability scores and sort
      const baseResults = Object.values(storeResultsMap)
        .map(store => ({
          ...store,
          availabilityScore: store.totalItems > 0 
            ? (store.availableItems / selectedItems.length) * 100 
            : 0
        }))
        .filter(store => store.totalItems > 0); // Only show stores with matching items

      // Get user's current location and calculate distances using KNN
      let results = baseResults;
      try {
        console.log('Getting current location for KNN distance calculations...');
        const userLocation = await LocationService.getCurrentPosition();
        
        if (userLocation) {
          console.log('Current user location:', userLocation);
          
          // Get store owner users (userTypeCode = 2) who represent stores
          const { data: storeOwners, error: ownersError } = await supabase
            .from('USER')
            .select('userId, userTypeCode, latitude, longitude')
            .eq('userTypeCode', 2)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (ownersError) {
            console.warn('Error fetching store owners for distance calculation:', ownersError);
          } else if (storeOwners && storeOwners.length > 0) {
            console.log(`Found ${storeOwners.length} store owners with locations`);
            
            // Calculate distances to all store owners
            const storeDistances = storeOwners.map(owner => ({
              userId: owner.userId,
              userTypeCode: owner.userTypeCode,
              latitude: owner.latitude,
              longitude: owner.longitude,
              distance: KNNService.calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                owner.latitude, 
                owner.longitude
              )
            }));

            console.log('Store distances calculated:', storeDistances);

            // Enhanced results with distance information
            results = baseResults.map(store => {
              // For now, assign random store owner to demonstrate distance calculation
              // In a real system, you'd have a mapping between store IDs and store owners
              const randomStoreOwner = storeDistances[store.storeId % storeDistances.length];
              const distance = randomStoreOwner?.distance || 999;
              const maxDistance = 50; // Maximum reasonable distance in km
              const distanceScore = Math.max(0, 100 - (distance / maxDistance) * 100);

              return {
                ...store,
                distance,
                distanceScore
              };
            });

            console.log('Results with distance calculations:', results);
          }
        } else {
          console.warn('Could not get user location for distance calculations');
        }
      } catch (locationError) {
        console.warn('Error calculating distances:', locationError);
      }

      // Sort by combined score: availability (60%) + distance proximity (40%)
      results.sort((a, b) => {
        const scoreA = (a.availabilityScore * 0.6) + (a.distanceScore * 0.4);
        const scoreB = (b.availabilityScore * 0.6) + (b.distanceScore * 0.4);
        
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Higher combined score first
        }
        
        // Fallback to availability score if combined scores are equal
        if (b.availabilityScore !== a.availabilityScore) {
          return b.availabilityScore - a.availabilityScore;
        }
        
        // Final fallback to distance (closer is better)
        return (a.distance || 999) - (b.distance || 999);
      });

      console.log('Store results:', results);
      setStoreResults(results);

    } catch (error) {
      console.error('Error fetching store results:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedItems]);

  useEffect(() => {
    if (selectedItems.length === 0) {
      history.replace('/grocery-list');
      return;
    }
    fetchStoreResults();
  }, [selectedItems, history, fetchStoreResults]);

  const handleBackClick = () => {
    history.goBack();
  };

  const getAvailabilityColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const getAvailabilityText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Limited';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleBackClick}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Store Results</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="store-results-container">
          <div className="results-header">
            <h2>Best Stores for Your List</h2>
            <p className="search-summary">
              Searching {selectedItems.length} items across grocery stores
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <>
              {storeResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  <IonIcon icon={storefrontOutline} style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                  <h3>No stores found</h3>
                  <p>None of the selected items are available in any stores.</p>
                </div>
              ) : (
                <div className="store-results-list">
                  {storeResults.map((store, index) => (
                    <IonCard key={store.storeId} className="store-result-card">
                      <IonCardHeader>
                        <div className="store-header">
                          <div className="store-info">
                            <IonIcon icon={storefrontOutline} className="store-icon" />
                            <div>
                              <IonCardTitle>{store.storeName}</IonCardTitle>
                              <div className="store-rank">#{index + 1} Best Match</div>
                              {store.distance !== undefined && (
                                <div className="store-distance">
                                  <IonIcon icon={locationOutline} style={{ fontSize: '0.8rem', marginRight: '4px' }} />
                                  {store.distance < 1 
                                    ? `${Math.round(store.distance * 1000)}m away`
                                    : `${store.distance.toFixed(1)}km away`
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="availability-score">
                            <IonBadge 
                              color={getAvailabilityColor(store.availabilityScore)}
                              className="score-badge"
                            >
                              {Math.round(store.availabilityScore)}%
                            </IonBadge>
                            <div className="score-label">
                              {getAvailabilityText(store.availabilityScore)}
                            </div>
                            {store.distance !== undefined && (
                              <div className="distance-score">
                                <small style={{ color: '#666', fontSize: '0.7rem' }}>
                                  Proximity: {Math.round(store.distanceScore)}%
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </IonCardHeader>
                      
                      <IonCardContent>
                        <div className="store-summary">
                          <div className="summary-item">
                            <span className="summary-label">Available:</span>
                            <span className="summary-value">{store.availableItems}/{selectedItems.length} items</span>
                          </div>
                        </div>

                        <div className="matched-items">
                          <h4>Your Items in This Store:</h4>
                          <div className="items-list">
                            {selectedItems.map(selectedItem => {
                              // Find the best match for this product name
                              // Prefer available items over out-of-stock items
                              const matchingItems = store.matchedItems.filter(
                                item => item.name === selectedItem.name
                              );
                              
                              const storeItem = matchingItems.length > 0 
                                ? matchingItems.find(item => item.availability === 1) || matchingItems[0]
                                : null;
                              
                              return (
                                <div key={selectedItem.id} className="item-availability">
                                  <div className="item-info">
                                    <span className="item-name">{selectedItem.name}</span>
                                    <div className="item-details">
                                      {storeItem?.brand && storeItem.brand !== 'null' && (
                                        <span className="item-brand">{storeItem.brand}</span>
                                      )}
                                      {storeItem?.description && 
                                       storeItem.description !== storeItem.name && 
                                       storeItem.description.trim() !== '' && (
                                        <span className="item-variant">
                                          {storeItem.description}
                                        </span>
                                      )}
                                      {storeItem?.unit && storeItem.unit !== 'null' && (
                                        <span className="item-unit">per {storeItem.unit}</span>
                                      )}
                                    </div>
                                    {storeItem && (
                                      <span className="item-price">₱{storeItem.price.toFixed(2)}</span>
                                    )}
                                  </div>
                                  <div className="availability-status">
                                    {storeItem ? (
                                      <IonChip color={storeItem.availability === 1 ? "success" : "medium"}>
                                        <IonIcon icon={storeItem.availability === 1 ? checkmarkCircleOutline : closeCircleOutline} />
                                        <span>{storeItem.availability === 1 ? "Available" : "Out of Stock"}</span>
                                      </IonChip>
                                    ) : (
                                      <IonChip color="danger">
                                        <IonIcon icon={closeCircleOutline} />
                                        <span>Not Available</span>
                                      </IonChip>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GroceryStoreResults;
