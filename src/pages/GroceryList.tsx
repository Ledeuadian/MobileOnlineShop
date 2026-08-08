import React, { useState, useEffect } from 'react';
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
  IonSearchbar,
  IonList,
  IonItem,
  IonBadge,
  IonSpinner,
  IonMenuToggle
} from '@ionic/react';
import ProfileMenu from '../components/ProfileMenu';
import { 
  arrowBackOutline, 
  cartOutline, 
  personOutline, 
  searchOutline,
  storefrontOutline,
  locationOutline,
  trashOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './GroceryList.css';

interface GroceryItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  brand?: string;
  variant?: string;
  unit?: string;
  checked: boolean;
  showingDelete?: boolean;
  productTypeId?: number; // Add productTypeId to preserve database reference
  storeItemId?: number; // For custom items without productTypeId
}

const GroceryList: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ addProductTypeId?: number }>();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Load saved selections from localStorage
  const loadSavedSelections = (): Set<number> => {
    try {
      const saved = localStorage.getItem('groceryListSelections');
      if (saved) {
        const selections = JSON.parse(saved);
        return new Set(selections);
      }
    } catch (error) {
      console.error('Error loading saved selections:', error);
    }
    return new Set();
  };

  // Save selections to localStorage
  const saveSelections = (items: GroceryItem[]) => {
    try {
      const selectedProductTypeIds = items
        .filter(item => item.checked && item.productTypeId)
        .map(item => item.productTypeId);
      localStorage.setItem('groceryListSelections', JSON.stringify(selectedProductTypeIds));
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  };

  // Haversine distance in km between two lat/lng points (mirrors KNNService.calculateDistance)
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  };

  // Nearby-stores radius (km) used when the shopper has no purchase history
  const NEARBY_RADIUS_KM = 5;

  // Function to fetch product types from database.
  // Sorting logic:
  //   1) If the shopper has prior purchases, rank by THEIR purchase history (most-bought first,
  //      most-recent purchase as tie-breaker). Items they bought but that are no longer in stock
  //      are filtered out; the rest of the catalog (in-stock, no purchases) is appended.
  //   2) If the shopper has NO purchase history, fall back to the most-purchased items
  //      among NEARBY stores (within NEARBY_RADIUS_KM of the shopper's saved location).
  //   3) If the shopper has no location either, fall back to the previous global "most purchased" logic.
  const fetchProductTypes = async (autoCheckProductTypeId?: number) => {
    try {
      setLoading(true);
      // Load previously saved selections
      const savedSelections = loadSavedSelections();

      // Resolve shopper identity (public USER row) and saved location (for nearby-store fallback)
      let shopperUserId: number | null = null;
      let shopperLat: number | null = null;
      let shopperLng: number | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          // Use .maybeSingle() to avoid 406 when no USER row exists yet
          // (e.g. auth user created but profile registration not yet completed).
          const { data: userData } = await supabase
            .from('USER')
            .select('userId, latitude, longitude')
            .eq('email', user.email)
            .maybeSingle();
          if (userData) {
            shopperUserId = userData.userId;
            shopperLat = userData.latitude != null ? Number(userData.latitude) : null;
            shopperLng = userData.longitude != null ? Number(userData.longitude) : null;
          }
        }
      } catch {
        // Shopper identity/location is optional — silently continue without it
      }
      
      // Step 1: Get all product types from PRODUCT_TYPE.
      // NOTE: explicit limit to avoid Supabase's default 1000-row truncation.
      const { data: productsInStock, error: stockError } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit')
        .order('Name', { ascending: true })
        .limit(50000);

      if (stockError) {
        console.error('Error fetching product types:', stockError);
        setGroceryItems([]);
        return;
      }

      // Step 2: Get in-stock items from ITEMS_IN_STORE.
      // Filter by availability > 0 and productTypeId > 0 (equivalent to IS NOT NULL but
      // more reliable across Supabase JS versions).
      // NOTE: explicit limit to avoid Supabase's default 1000-row truncation.
      const { data: itemsInStore, error: itemsError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('productTypeId, storeItemId, storeId, price, availability, name, brand, variant, unit')
        .gt('productTypeId', 0)
        .gt('availability', 0)
        .limit(50000);

      if (itemsError) {
        console.error('Error fetching items in store:', itemsError);
      }

      const productTypeIdsInStock = new Set(itemsInStore?.map(item => item.productTypeId) || []);

      // Map storeItemId -> productTypeId (used to translate order history into product types)
      const storeItemToProductType = new Map<number, number>();
      // Track which stores currently carry each productTypeId (for nearby-store fallback)
      const productTypeToStoreIds = new Map<number, Set<number>>();
      itemsInStore?.forEach(item => {
        if (item.productTypeId != null) {
          storeItemToProductType.set(item.storeItemId, item.productTypeId);
          if (!productTypeToStoreIds.has(item.productTypeId)) {
            productTypeToStoreIds.set(item.productTypeId, new Set());
          }
          if (item.storeId != null) {
            productTypeToStoreIds.get(item.productTypeId)!.add(item.storeId);
          }
        }
      });

      // ---- Build personalized ranking from the shopper's purchase history ----
      // personalPurchases: productTypeId -> { count: total qty, lastBoughtAt: ms timestamp }
      const personalPurchases = new Map<number, { count: number; lastBoughtAt: number }>();

      if (shopperUserId != null) {
        // Get the shopper's order ids (exclude cancelled)
        const { data: shopperOrders, error: ordersErr } = await supabase
          .from('ORDERS')
          .select('orderId, createdAt, status')
          .eq('userId', shopperUserId)
          .neq('status', 'cancelled');

        if (!ordersErr && shopperOrders && shopperOrders.length > 0) {
          const orderIdToCreatedAt = new Map<number, number>(
            shopperOrders.map(o => [o.orderId, o.createdAt ? new Date(o.createdAt).getTime() : 0])
          );
          const orderIds = shopperOrders.map(o => o.orderId);

          const { data: orderItemsData, error: orderItemsErr } = await supabase
            .from('ORDER_ITEMS')
            .select('orderId, storeItemId, quantity')
            .in('orderId', orderIds);

          if (!orderItemsErr && orderItemsData) {
            orderItemsData.forEach(oi => {
              const productTypeId = storeItemToProductType.get(oi.storeItemId);
              if (productTypeId == null) return;
              const qty = oi.quantity || 1;
              const ts = orderIdToCreatedAt.get(oi.orderId) || 0;
              const cur = personalPurchases.get(productTypeId);
              if (cur) {
                cur.count += qty;
                if (ts > cur.lastBoughtAt) cur.lastBoughtAt = ts;
              } else {
                personalPurchases.set(productTypeId, { count: qty, lastBoughtAt: ts });
              }
            });
          }
        }
      }
      const hasPurchaseHistory = personalPurchases.size > 0;

      // ---- Fallback: nearby-store ranking (only used when there is NO purchase history) ----
      // nearbyStoreIds: stores within NEARBY_RADIUS_KM of the shopper's saved location.
      let nearbyStoreIds: Set<number> | null = null;
      let globalSalesCountMap: Map<number, number> | null = null;

      if (!hasPurchaseHistory) {
        if (shopperLat != null && shopperLng != null) {
          const { data: storesWithCoords, error: storesErr } = await supabase
            .from('GROCERY_STORE')
            .select('storeId, latitude, longitude');
          if (!storesErr && storesWithCoords) {
            nearbyStoreIds = new Set<number>();
            storesWithCoords.forEach(s => {
              if (s.latitude == null || s.longitude == null) return;
              const d = haversineKm(shopperLat, shopperLng, Number(s.latitude), Number(s.longitude));
              if (d <= NEARBY_RADIUS_KM) nearbyStoreIds!.add(s.storeId);
            });

          }
        }

        // Compute sales counts, optionally restricted to nearby stores
        const { data: orderItemsData, error: orderError } = await supabase
          .from('ORDER_ITEMS')
          .select(`
            storeItemId,
            quantity,
            ORDERS!inner(createdAt)
          `)
          .neq('ORDERS.status', 'cancelled');

        if (!orderError) {
        globalSalesCountMap = new Map<number, number>();
        if (orderItemsData) {
          // Local non-nullable alias so the compiler is happy inside the callback
          // (it cannot prove the map is non-null at the moment the callback runs).
          const salesMap = globalSalesCountMap;
          orderItemsData.forEach(orderItem => {
            const productTypeId = storeItemToProductType.get(orderItem.storeItemId);
            if (!productTypeId) return;
            // If filtering by nearby stores, only count when at least one store carrying
            // this productTypeId is nearby (i.e. the product is actually available nearby).
            if (nearbyStoreIds) {
              const stores = productTypeToStoreIds.get(productTypeId);
              if (!stores || !Array.from(stores).some(sid => nearbyStoreIds!.has(sid))) {
                return;
              }
            }
            const currentCount = salesMap.get(productTypeId) || 0;
            salesMap.set(productTypeId, currentCount + (orderItem.quantity || 1));
          });
        }
        }
        } // end if (!orderError)

      // Filter products to only include those in stock
      const productsWithStock = productsInStock?.filter(product => 
        product.productTypeId && 
        product.Name && 
        product.Name.trim() !== '' &&
        productTypeIdsInStock.has(product.productTypeId)
      ) || [];

      // Remove duplicates based on Name, Brand, Variant, Unit combination
      const uniqueProducts = productsWithStock.filter((product, index, self) => 
        index === self.findIndex(p => 
          p.Name === product.Name && 
          p.Brand === product.Brand && 
          p.Variant === product.Variant && 
          p.Unit === product.Unit
        )
      );

      // ---- Sort ----
      let sortedProducts: typeof uniqueProducts;
      if (hasPurchaseHistory) {
        // 1) Shopper's previously purchased items, most-bought first, then most-recent, then alphabetical.
        //    Only items that are still in stock somewhere are surfaced (no point showing something they
        //    can't reorder).
        // 2) Remaining in-stock products the shopper has never bought, appended in alphabetical order.
        sortedProducts = [...uniqueProducts].sort((a, b) => {
          const aData = personalPurchases.get(a.productTypeId);
          const bData = personalPurchases.get(b.productTypeId);
          if (aData && !bData) return -1;        // a purchased, b not  -> a first
          if (!aData && bData) return 1;         // b purchased, a not  -> b first
          if (aData && bData) {
            if (bData.count !== aData.count) return bData.count - aData.count;
            if (bData.lastBoughtAt !== aData.lastBoughtAt) return bData.lastBoughtAt - aData.lastBoughtAt;
          }
          return a.Name.localeCompare(b.Name);
        });
      } else {
        // Fallback ranking: most-purchased among (nearby) stores, then alphabetical.
        const salesMap = globalSalesCountMap ?? new Map<number, number>();
        sortedProducts = [...uniqueProducts].sort((a, b) => {
          const salesA = salesMap.get(a.productTypeId) || 0;
          const salesB = salesMap.get(b.productTypeId) || 0;
          if (salesB !== salesA) return salesB - salesA;
          return a.Name.localeCompare(b.Name);
        });
      }

      // Build a map: productTypeId -> first matching store-item name.
      // Used to display the actual store-listed name (e.g. "Bear Brand Fortified")
      // instead of the generic PRODUCT_TYPE.Name (e.g. "Milk").
      const storeItemNameByProductTypeId = new Map<number, { name: string; brand?: string; variant?: string; unit?: string }>();
      itemsInStore?.forEach(item => {
        if (item.productTypeId != null && item.name && item.name.trim() !== '') {
          if (!storeItemNameByProductTypeId.has(item.productTypeId)) {
            storeItemNameByProductTypeId.set(item.productTypeId, {
              name: item.name,
              brand: (item as Record<string, unknown>).brand as string | undefined,
              variant: (item as Record<string, unknown>).variant as string | undefined,
              unit: (item as Record<string, unknown>).unit as string | undefined,
            });
          }
        }
      });

      // Generate unique IDs for each item to avoid conflicts, but preserve productTypeId
      const formattedItems: GroceryItem[] = sortedProducts.map((item, index) => {
        const isAutoChecked = autoCheckProductTypeId && item.productTypeId === autoCheckProductTypeId;
        const wasPreviouslyChecked = savedSelections.has(item.productTypeId);

        // Prefer the actual store-item name when it differs from the generic
        // PRODUCT_TYPE.Name (e.g. "Bear Brand Fortified" instead of "Milk").
        const storeInfo = storeItemNameByProductTypeId.get(item.productTypeId);
        const storeName = storeInfo?.name?.trim() ?? '';
        const useStoreName = storeName !== '' && storeName.toLowerCase() !== (item.Name ?? '').toLowerCase();

        return {
          id: index + 1,
          productTypeId: item.productTypeId,
          name: useStoreName ? storeInfo!.name : item.Name,
          brand: (useStoreName && storeInfo?.brand ? storeInfo.brand : item.Brand) || undefined,
          variant: (useStoreName && storeInfo?.variant ? storeInfo.variant : item.Variant) || undefined,
          unit: (useStoreName && storeInfo?.unit ? storeInfo.unit : item.Unit) || undefined,
          quantity: 1,
          checked: isAutoChecked || wasPreviouslyChecked
        };
      });

      // Step 4: Fetch items from ITEMS_IN_STORE that don't have a productTypeId
      // These are "custom" products added by stores that don't match any standard product type.
      // NOTE: explicit limit to avoid Supabase's default 1000-row truncation.
      const { data: customItems, error: customError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('storeItemId, name, description, brand, unit, category')
        .is('productTypeId', null)
        .not('availability', 'is', null)
        .gt('availability', 0)
        .limit(50000);

      if (customError) {
        console.error('Error fetching custom items:', customError);
      }

      if (customItems && customItems.length > 0) {
        // Remove duplicates based on name, brand, unit combination
        const uniqueCustomItems = customItems.filter((item, index, self) => 
          index === self.findIndex(i => 
            i.name === item.name && 
            i.brand === item.brand && 
            i.unit === item.unit
          )
        );

        // Add custom items to the list with negative IDs to distinguish them
        const customFormattedItems: GroceryItem[] = uniqueCustomItems.map((item, index) => ({
          id: -(index + 1), // Negative ID to indicate custom item (no productTypeId)
          productTypeId: undefined, // No productTypeId for custom items
          storeItemId: item.storeItemId, // Store the actual storeItemId for purchasing
          name: item.name,
          brand: item.brand || undefined,
          variant: undefined,
          unit: item.unit || undefined,
          quantity: 1,
          checked: false
        }));

        // Combine standard products with custom items
        formattedItems.push(...customFormattedItems);
      }

      if (autoCheckProductTypeId) {
        // Auto-check is handled by the wasPreviouslyChecked logic above
      }

      setGroceryItems(formattedItems);
      
      // Save selections to localStorage
      saveSelections(formattedItems);
    } catch (error) {
      console.error('Error loading grocery list:', error);
      setGroceryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCartCount = async () => {
      const count = await getCartItemCount();
      setCartItemCount(count);
    };

    const loadData = async () => {
      const addProductTypeId = location.state?.addProductTypeId;
      
      if (addProductTypeId) {
        await fetchProductTypes(addProductTypeId);
        history.replace('/grocery-list', {});
      } else {
        await fetchProductTypes();
      }
      
      await loadCartCount();
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCartItemCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get userId from public.USER table
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .maybeSingle();

      if (userError || !userData) return 0;

      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', userData.userId)
        .single();

      if (cartError || !cart) return 0;

      // Get count of unique items in cart (not total quantity)
      const { data: cartItems, error: itemsError } = await supabase
        .from('CART_ITEMS')
        .select('cartItemId')
        .eq('cartId', cart.cartId);

      if (itemsError) return 0;

      return cartItems?.length || 0;
    } catch (error) {
      console.error('Error counting cart items:', error);
      return 0;
    }
  };

  // Separate selected and unselected items
  const selectedItems = groceryItems.filter(item => item.checked);
  const unselectedItems = groceryItems.filter(item => !item.checked);

  // Apply search filter to both groups
  const filteredSelectedItems = selectedItems.filter(item => {
    if (!searchText.trim()) return true;
    return (
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.variant?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.unit?.toLowerCase().includes(searchText.toLowerCase())
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filteredUnselectedItems = unselectedItems.filter(item => {
    if (!searchText.trim()) return true;
    return (
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.variant?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.unit?.toLowerCase().includes(searchText.toLowerCase())
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  const changeQuantity = (id: number, delta: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setGroceryItems(prevItems =>
      prevItems.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const toggleItemCheck = (id: number) => {
    setGroceryItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked, showingDelete: false } : { ...item, showingDelete: false }
      );
      saveSelections(newItems);
      return newItems;
    });
  };

  const toggleDeleteView = (id: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setGroceryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, showingDelete: !item.showingDelete } : { ...item, showingDelete: false }
      )
    );
  };

  const deleteItem = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Capture the productTypeId BEFORE state update (state is async)
    const itemToDelete = groceryItems.find(item => item.id === id);
    const deletedProductTypeId = itemToDelete?.productTypeId;
    
    setGroceryItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, checked: false, showingDelete: false } : item
      );
      
      // Update localStorage after state change
      setTimeout(() => {
        if (deletedProductTypeId) {
          try {
            const saved = localStorage.getItem('groceryListSelections');
            if (saved) {
              const selections: number[] = JSON.parse(saved);
              const updatedSelections = selections.filter(pid => pid !== deletedProductTypeId);
              localStorage.setItem('groceryListSelections', JSON.stringify(updatedSelections));
            }
          } catch (error) {
            console.error('Error updating localStorage after delete:', error);
          }
        }
      }, 0);
      
      return newItems;
    });
  };

  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    const item = groceryItems.find(item => item.id === id);
    if (!item?.checked) return;
    
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent, id: number) => {
    const item = groceryItems.find(item => item.id === id);
    if (!touchStart || !item?.checked) return;
    
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = (id: number) => {
    const item = groceryItems.find(item => item.id === id);
    if (!touchStart || !touchEnd || !item?.checked) {
      // Reset touch state if this wasn't a valid swipe attempt
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    if (!isVerticalSwipe) {
      if (isLeftSwipe) {
        // Swipe left - show delete
        toggleDeleteView(id);
      } else if (isRightSwipe) {
        // Swipe right - hide delete
        setGroceryItems(prevItems =>
          prevItems.map(item =>
            item.id === id ? { ...item, showingDelete: false } : item
          )
        );
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleBackClick = () => {
    history.push('/grocery-list');
  };

  const navigateToCart = () => {
    history.push('/my-purchases');
  };

  const handleSearchGrocery = () => {
    const selectedItems = groceryItems.filter(item => item.checked);
    
    if (selectedItems.length === 0) {
      alert('Please select at least one item from your grocery list to search for stores.');
      return;
    }
    
    // Navigate to grocery store search results with selected items (including quantities)
    history.push('/grocery-store-results', { selectedItems });
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
          <IonTitle>Grocery list</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent id="main-content">
        <div className="grocery-list-container">
          <div className="grocery-header">
            <h2>Grocery list</h2>
          </div>

          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search grocery item"
            showClearButton="focus"
            className="grocery-search"
          />

          {/* Grocery Items List */}
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              color: '#666'
            }}>
              <IonSpinner name="crescent" style={{ marginBottom: '1rem' }} />
              <p>Loading grocery items...</p>
            </div>
          ) : (
            <>
              {/* Selected Items Section (User's Grocery List) */}
              {filteredSelectedItems.length > 0 && (
                <IonList className="grocery-items-list">
                  {filteredSelectedItems.map((item) => (
                    <IonItem 
                      key={item.id} 
                      className="grocery-item selected"
                      lines="none"
                    >
                      <div 
                        className={`item-wrapper ${item.showingDelete ? 'swipe-left' : ''}`}
                        onTouchStart={(e) => handleTouchStart(e, item.id)}
                        onTouchMove={(e) => handleTouchMove(e, item.id)}
                        onTouchEnd={() => handleTouchEnd(item.id)}
                      >
                        <button 
                          className="item-content"
                          onClick={() => toggleDeleteView(item.id)}
                        >
                          <div className="item-details">
                            <h3 className="item-name">
                              {item.name}
                            </h3>
                            <div className="item-info">
                              <span className="item-size">{item.unit}</span>
                              <span className="item-brand">{item.brand}</span>
                              {item.variant && <span className="item-variant">{item.variant}</span>}
                            </div>
                          </div>
                          <div className="quantity-stepper" onClick={e => e.stopPropagation()}>
                            <button
                              className="qty-btn"
                              onClick={(e) => changeQuantity(item.id, -1, e)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              className="qty-btn"
                              onClick={(e) => changeQuantity(item.id, 1, e)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </button>
                        <button 
                          className="delete-background" 
                          onClick={(e) => deleteItem(item.id, e)}
                        >
                          <IonIcon icon={trashOutline} />
                        </button>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              )}

              {/* Empty State for Selected Items */}
              {filteredSelectedItems.length === 0 && !searchText.trim() && (
                <div className="empty-list-message">
                  Your grocery list is empty
                </div>
              )}

              {/* Divider with "Start with popular items" */}
              {!searchText.trim() && (
                <div className="popular-items-divider">
                  <div className="divider-line"></div>
                  <span className="divider-text">Start with popular items</span>
                  <div className="divider-line"></div>
                </div>
              )}

              {/* Unselected Items Section (Popular Items) */}
              <IonList className="grocery-items-list popular-items-list">
                {filteredUnselectedItems.map((item) => (
                  <IonItem 
                    key={item.id} 
                    className="grocery-item"
                    lines="none"
                  >
                    <div className="item-wrapper">
                      <button 
                        className="item-content"
                        onClick={() => toggleItemCheck(item.id)}
                      >
                        <div className="item-details">
                          <h3 className="item-name">
                            {item.name}
                          </h3>
                          <div className="item-info">
                            <span className="item-size">{item.unit}</span>
                            <span className="item-brand">{item.brand}</span>
                            {item.variant && <span className="item-variant">{item.variant}</span>}
                          </div>
                        </div>
                      </button>
                    </div>
                  </IonItem>
                ))}
              </IonList>

              {/* No Results Message */}
              {filteredSelectedItems.length === 0 && filteredUnselectedItems.length === 0 && searchText.trim() && (
                <div className="empty-state">
                  <IonIcon icon={searchOutline} className="empty-state-icon" />
                  <h3>No items found</h3>
                  <p>Try searching with different keywords or check your spelling</p>
                </div>
              )}
            </>
          )}
        </div>


        {/* Bottom Navigation Bar */}
        <div className="bottom-nav-bar">
          <button className="nav-btn" onClick={handleBackClick}>
            <IonIcon icon={storefrontOutline} className="nav-icon" />
          </button>
          <button className="nav-btn cart-nav-btn" onClick={navigateToCart}>
            <IonIcon icon={cartOutline} className="nav-icon" />
            {cartItemCount > 0 && (
              <IonBadge 
                color="danger" 
                className="cart-badge"
              >
                {cartItemCount}
              </IonBadge>
            )}
          </button>
          <IonMenuToggle menu="profile-menu">
            <button className="nav-btn">
              <IonIcon icon={personOutline} className="nav-icon" />
            </button>
          </IonMenuToggle>
        </div>

        {/* Search Grocery Button */}
        <div style={{ 
          position: 'fixed', 
          bottom: '80px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000 
        }}>
          <IonButton 
            color="primary" 
            onClick={handleSearchGrocery}
            style={{ 
              borderRadius: '25px',
              padding: '12px 24px',
              fontWeight: '600'
            }}
          >
            <IonIcon icon={searchOutline} slot="start" />
            Search Nearby Stores
            <IonIcon icon={locationOutline} slot="end" style={{ fontSize: '0.9rem', opacity: 0.8 }} />
          </IonButton>
        </div>

      </IonContent>

      <ProfileMenu />
    </IonPage>
  );
};

export default GroceryList;
