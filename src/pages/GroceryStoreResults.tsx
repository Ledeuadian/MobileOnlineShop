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
  IonCardContent
} from '@ionic/react';
import { 
  arrowBackOutline, 
  storefrontOutline,
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
  quantity: number;
  checked: boolean;
  productTypeId?: number; // Add productTypeId for database matching
  storeItemId?: number; // For custom items without productTypeId
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
  location?: string; // Full address of the store
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
  const [expandedStoreId, setExpandedStoreId] = useState<number | null>(null);
  const [srpPrices, setSrpPrices] = useState<Record<number, number>>({});

  const toggleStoreExpansion = (storeId: number) => {
    setExpandedStoreId(expandedStoreId === storeId ? null : storeId);
  };

  const calculateStoreTotal = (store: StoreResult) => {
    let total = 0;
    selectedItems.forEach(selectedItem => {
      // Handle items with productTypeId
      if (selectedItem.productTypeId) {
        const matchingItems = store.matchedItems.filter(
          item => item.productTypeId === selectedItem.productTypeId
        );
        const storeItem = matchingItems.length > 0 
          ? matchingItems.find(item => item.availability && item.availability > 0) || matchingItems[0]
          : null;
        
        if (storeItem && storeItem.availability > 0) {
          total += storeItem.price * (selectedItem.quantity || 1);
        }
      }
      
      // Handle custom items (items with storeItemId but no productTypeId)
      if (selectedItem.storeItemId) {
        const customItem = store.matchedItems.find(
          item => item.storeItemId === selectedItem.storeItemId
        );
        
        if (customItem && customItem.availability && customItem.availability > 0) {
          total += customItem.price * (selectedItem.quantity || 1);
        }
      }
    });
    return total;
  };

  const calculateSavings = (store: StoreResult) => {
    // Calculate savings based on SRP prices
    let savings = 0;
    selectedItems.forEach(selectedItem => {
      const productTypeId = selectedItem.productTypeId;
      if (!productTypeId || !srpPrices[productTypeId]) return;

      const matchingItems = store.matchedItems.filter(
        item => item.productTypeId === selectedItem.productTypeId
      );
      const storeItem = matchingItems.length > 0 
        ? matchingItems.find(item => item.availability && item.availability > 0) || matchingItems[0]
        : null;
      
      if (storeItem && storeItem.availability > 0) {
        const srpPrice = srpPrices[productTypeId];
        const storePrice = storeItem.price;
        // Calculate savings: SRP Price - Store Price (positive = saving money)
        const itemSavings = (srpPrice - storePrice) * (selectedItem.quantity || 1);
        if (itemSavings > 0) {
          savings += itemSavings;
        }
      }
    });
    return savings;
  };

  const handleCheckout = (store: StoreResult) => {
    // Navigate to checkout page with store and item details
    const checkoutItems = selectedItems
      .map(selectedItem => {
        // Handle items with productTypeId (standard products)
        if (selectedItem.productTypeId) {
          const matchingItems = store.matchedItems.filter(
            item => item.productTypeId === selectedItem.productTypeId
          );
          const storeItem = matchingItems.length > 0 
            ? matchingItems.find(item => item.availability && item.availability > 0) || matchingItems[0]
            : null;
          
          if (storeItem && storeItem.availability > 0) {
            return {
              id: storeItem.storeItemId, // Use storeItemId instead of selectedItem.id
              name: selectedItem.name,
              description: storeItem.description,
              price: storeItem.price,
              quantity: selectedItem.quantity || 1
            };
          }
        }
        
        // Handle custom items (items with storeItemId but no productTypeId)
        if (selectedItem.storeItemId) {
          const customItem = store.matchedItems.find(
            item => item.storeItemId === selectedItem.storeItemId
          );
          
          if (customItem && customItem.availability && customItem.availability > 0) {
            return {
              id: customItem.storeItemId,
              name: selectedItem.name,
              description: customItem.description,
              price: customItem.price,
              quantity: selectedItem.quantity || 1
            };
          }
        }
        
        return null;
      })
      .filter(item => item !== null);

    history.push('/grocery-checkout', {
      storeName: store.storeName,
      storeId: store.storeId,
      items: checkoutItems,
      availableItems: store.availableItems,
      totalItems: selectedItems.length,
      total: calculateStoreTotal(store),
      savings: calculateSavings(store)
    });
  };

  const fetchStoreResults = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Searching stores for selected items:', selectedItems);

      // Get all stores with location and name data
      const { data: stores, error: storesError } = await supabase
        .from('GROCERY_STORE')
        .select('storeId, name, latitude, longitude, location')
        .order('storeId');

      if (storesError) {
        console.error('Error fetching stores:', storesError);
        return;
      }

            // Get all items from ITEMS_IN_STORE for the selected product type IDs
      const selectedProductTypeIds = selectedItems
        .map(item => item.productTypeId)
        .filter(id => id !== undefined) as number[];
      
      // Get custom items (items with storeItemId but no productTypeId)
      const selectedStoreItemIds = selectedItems
        .map(item => item.storeItemId)
        .filter(id => id !== undefined) as number[];
      
      console.log('Searching for product type IDs:', selectedProductTypeIds);
      console.log('Searching for custom storeItemIds:', selectedStoreItemIds);
      
      let storeItems: any[] = [];
      
      // Query 1: Fetch items by productTypeId (standard products)
      if (selectedProductTypeIds.length > 0) {
        const { data: productTypeItems, error: productTypeError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .in('productTypeId', selectedProductTypeIds);
        
        if (productTypeError) {
          console.error('Error fetching store items by productTypeId:', productTypeError);
        } else {
          storeItems.push(...(productTypeItems || []));
          console.log(`Found ${productTypeItems?.length || 0} items via productTypeId`);
        }
      }
      
      // Query 2: Fetch custom items by storeItemId (products without productTypeId)
      if (selectedStoreItemIds.length > 0) {
        const { data: customItems, error: customError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .in('storeItemId', selectedStoreItemIds);
        
        if (customError) {
          console.error('Error fetching custom store items:', customError);
        } else {
          storeItems.push(...(customItems || []));
          console.log(`Found ${customItems?.length || 0} custom items via storeItemId`);
        }
      }
      
      // Remove duplicates based on storeItemId
      const uniqueItems = new Map();
      storeItems.forEach(item => {
        if (!uniqueItems.has(item.storeItemId)) {
          uniqueItems.set(item.storeItemId, item);
        }
      });
      storeItems = Array.from(uniqueItems.values());

      if (storeItems.length === 0) {
        console.warn('No items found in ITEMS_IN_STORE matching productTypeIds or storeItemIds');
        setStoreResults([]);
        setLoading(false);
        return;
      }

      console.log(`Found ${storeItems?.length || 0} matching items across stores`);
      console.log('Sample matched items:', storeItems?.slice(0, 3));
      
      if (!storeItems || storeItems.length === 0) {
        console.warn('No items found in ITEMS_IN_STORE matching productTypeIds:', selectedProductTypeIds);
        console.warn('This might mean:');
        console.warn('1. The productTypeId column does not exist in ITEMS_IN_STORE');
        console.warn('2. No items in the store match these product type IDs');
        console.warn('3. The column name is different (check your database schema)');
      }

      // Process results by store
      const storeResultsMap: { [storeId: number]: StoreResult } = {};

      // Initialize all stores
      stores?.forEach(store => {
        storeResultsMap[store.storeId] = {
          storeId: store.storeId,
          storeName: store.name || `Store ${store.storeId}`,
          location: store.location || undefined,
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
        const uniqueMatches = new Set<number>();
        const availableMatches = new Set<number>();

        store.matchedItems.forEach(item => {
          // Handle both productTypeId (standard products) and storeItemId (custom items)
          if (item.productTypeId) {
            uniqueMatches.add(item.productTypeId);
            // Check if item is available (availability > 0 means in stock)
            if (item.availability && item.availability > 0) {
              availableMatches.add(item.productTypeId);
            }
          } else if (item.storeItemId) {
            // Custom item - use storeItemId as the unique identifier
            uniqueMatches.add(item.storeItemId);
            // Check if item is available
            if (item.availability && item.availability > 0) {
              availableMatches.add(item.storeItemId);
            }
          }
        });

        store.totalItems = uniqueMatches.size;
        store.availableItems = availableMatches.size;
        
        console.log(`Store ${store.storeId}: ${store.availableItems}/${store.totalItems} items available`, {
          matched: Array.from(uniqueMatches),
          available: Array.from(availableMatches)
        });
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
        const userLocation = await LocationService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0 // Always get fresh location
        });
        
        if (userLocation) {
          console.log('Current user location:', userLocation);
          console.log('Location accuracy:', userLocation.accuracy, 'meters');
          
          // Check if location accuracy is acceptable
          if (userLocation.accuracy && !KNNService.isAccuracyAcceptable(userLocation.accuracy)) {
            console.warn('⚠️ Location accuracy is poor (${userLocation.accuracy}m). Distance calculations may be inaccurate.');
          }
          
          // Build a lookup map of storeId -> real coordinates from already-fetched stores
          const storeLocationMap: { [storeId: number]: { latitude: number; longitude: number } } = {};
          stores?.forEach(store => {
            if (store.latitude != null && store.longitude != null) {
              storeLocationMap[store.storeId] = { latitude: store.latitude, longitude: store.longitude };
            }
          });

          // Calculate real distances using actual store coordinates
          results = baseResults.map(store => {
            const storeCoords = storeLocationMap[store.storeId];
            if (!storeCoords) {
              return { ...store, distance: undefined, distanceScore: 0 };
            }
            
            // Calculate distance with confidence info
            const distanceResult = KNNService.calculateDistanceWithConfidence(
              userLocation.latitude,
              userLocation.longitude,
              storeCoords.latitude,
              storeCoords.longitude,
              userLocation.accuracy
            );
            
            const maxDistance = 50;
            const distanceScore = Math.max(0, 100 - (distanceResult.distance / maxDistance) * 100);
            
            console.log(`Store ${store.storeId}: ${KNNService.formatDistance(distanceResult.distance)} (confidence: ${distanceResult.confidence})`);
            
            return { ...store, distance: distanceResult.distance, distanceScore };
          });

          console.log('Results with real distance calculations:', results);
        } else {
          console.warn('Could not get user location for distance calculations');
        }
      } catch (locationError) {
        console.warn('Error calculating distances:', locationError);
      }

      // Sort by combined score: availability (60%) + distance proximity (40%)
  results = [...results].sort((a, b) => {
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

    // Load SRP prices for selected items
    const loadSrpPrices = async () => {
      const productTypeIds = [...new Set(selectedItems
        .map(item => item.productTypeId)
        .filter(id => id !== undefined))] as number[];

      if (productTypeIds.length > 0) {
        const { data: srpData } = await supabase
          .from('SRP')
          .select('productTypeId, Price')
          .in('productTypeId', productTypeIds);

        const srpMap: Record<number, number> = {};
        (srpData || []).forEach((srp: { productTypeId: number; Price: number }) => {
          srpMap[srp.productTypeId] = srp.Price;
        });
        setSrpPrices(srpMap);
      }
    };

    loadSrpPrices();
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
                  {storeResults.map((store, index) => {
                    const isExpanded = expandedStoreId === store.storeId;
                    const storeTotal = calculateStoreTotal(store);
                    
                    return (
                      <IonCard 
                        key={store.storeId} 
                        className={`store-result-card ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleStoreExpansion(store.storeId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <IonCardHeader>
                          <div className="store-header">
                            <div className="store-info">
                              <IonIcon icon={storefrontOutline} className="store-icon" />
                              <div>
                                <IonCardTitle>{store.storeName}</IonCardTitle>
                                <div className="store-rank">#{index + 1} Best Match</div>
                                {store.location && (
                                  <div className="store-address" style={{ display: 'flex', alignItems: 'flex-start', marginTop: '2px', color: '#555', fontSize: '0.78rem', lineHeight: '1.3' }}>
                                    <IonIcon icon={locationOutline} style={{ fontSize: '0.85rem', marginRight: '3px', marginTop: '1px', flexShrink: 0, color: '#eb445a' }} />
                                    <span>{store.location}</span>
                                  </div>
                                )}
                                {store.distance !== undefined && (
                                  <div className="store-distance" style={{ display: 'flex', alignItems: 'center', marginTop: '3px', color: '#2d6b6b', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <span style={{ marginRight: '4px' }}>📍</span>
                                    {KNNService.formatDistance(store.distance)}
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
                            </div>
                          </div>
                        </IonCardHeader>
                        
                        {isExpanded && (
                          <>
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
                                    // Find the best match by productTypeId
                                    const matchingItems = store.matchedItems.filter(
                                      item => item.productTypeId === selectedItem.productTypeId
                                    );
                                    
                                    // Prefer items with stock over out-of-stock items
                                    const storeItem = matchingItems.length > 0 
                                      ? matchingItems.find(item => item.availability && item.availability > 0) || matchingItems[0]
                                      : null;
                                    
                                    return (
                                      <div key={selectedItem.id} className="item-availability">
                                        <div className="item-info">
                                          <span className="item-name">{selectedItem.name}</span>
                                          <div className="item-details">
                                            {storeItem?.description && storeItem.description.trim() !== '' && (
                                              <span className="item-description">{storeItem.description}</span>
                                            )}
                                          </div>
                                          {storeItem && (
                                            <span className="item-price">
                                              {selectedItem.quantity > 1
                                                ? `${selectedItem.quantity} × ₱${storeItem.price.toFixed(2)} = ₱${(storeItem.price * selectedItem.quantity).toFixed(2)}`
                                                : `₱${storeItem.price.toFixed(2)}`
                                              }
                                            </span>
                                          )}
                                        </div>
                                        <div className="availability-status">
                                          {storeItem && storeItem.availability > 0 ? (
                                            <span style={{ color: '#2dd36f', fontWeight: '600', fontSize: '0.9rem' }}>
                                              Available
                                            </span>
                                          ) : (
                                            <span style={{ color: '#eb445a', fontWeight: '600', fontSize: '0.9rem' }}>
                                              Unavailable
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </IonCardContent>

                            <div className="store-footer">
                              <div className="footer-content">
                                <div className="total-info">
                                  <div className="availability-text">
                                    Available: <strong>{store.availableItems} of {selectedItems.length} items</strong>
                                  </div>
                                  <div className="savings-text">
                                    Saved based on SRP: <span style={{ color: '#2dd36f' }}>₱{calculateSavings(store).toFixed(2)}</span>
                                  </div>
                                  <div className="total-text">
                                    Total: <strong>₱{storeTotal.toFixed(2)}</strong>
                                  </div>
                                </div>
                                <IonButton 
                                  color="primary" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckout(store);
                                  }}
                                  style={{ 
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    minWidth: '120px'
                                  }}
                                >
                                  Check Out
                                </IonButton>
                              </div>
                            </div>
                          </>
                        )}
                      </IonCard>
                    );
                  })}
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
