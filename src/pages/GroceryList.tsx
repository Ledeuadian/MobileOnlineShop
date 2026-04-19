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
      console.log('Saved selections:', selectedProductTypeIds);
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  };

  // Function to fetch product types from database that are in store stock and order by most recently sold
  const fetchProductTypes = async (autoCheckProductTypeId?: number) => {
    try {
      setLoading(true);
      console.log('Fetching product types from PRODUCT_TYPE table (only in stock, ordered by recent sales)...');
      
      // Load previously saved selections
      const savedSelections = loadSavedSelections();
      console.log('Loaded saved selections:', Array.from(savedSelections));
      
      // Step 1: Get products that have items in ITEMS_IN_STORE (in stock in at least one store)
      const { data: productsInStock, error: stockError } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit')
        .order('Name', { ascending: true });

      if (stockError) {
        console.error('Error fetching product types:', stockError);
        setGroceryItems([]);
        return;
      }

      // Step 2: Get productTypeIds that exist in ITEMS_IN_STORE (have stock)
      const { data: itemsInStore, error: itemsError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('productTypeId');

      if (itemsError) {
        console.error('Error fetching items in store:', itemsError);
      }

      const productTypeIdsInStock = new Set(itemsInStore?.map(item => item.productTypeId) || []);
      console.log(`Products in stock (in ITEMS_IN_STORE): ${productTypeIdsInStock.size}`);

      // Step 3: Get sales data from ORDER_ITEMS joined with ORDERS to count recent sales
      const { data: orderItemsData, error: orderError } = await supabase
        .from('ORDER_ITEMS')
        .select(`
          storeItemId,
          quantity,
          createdAt,
          ORDERS!inner(createdAt)
        `);

      if (orderError) {
        console.warn('Could not fetch order items, proceeding without sales data:', orderError);
      }

      // Get store items to map storeItemId to productTypeId
      const { data: storeItems, error: storeItemsError } = await supabase
        .from('ITEMS_IN_STORE')
        .select('storeItemId, productTypeId');

      if (storeItemsError) {
        console.warn('Could not fetch store items for sales mapping:', storeItemsError);
      }

      // Create a map of storeItemId to productTypeId
      const storeItemToProductType = new Map(storeItems?.map(item => [item.storeItemId, item.productTypeId]) || []);

      // Count sales per productTypeId (most recent = higher count in recent orders)
      const salesCountMap = new Map<number, number>();
      if (orderItemsData) {
        orderItemsData.forEach(orderItem => {
          const productTypeId = storeItemToProductType.get(orderItem.storeItemId);
          if (productTypeId) {
            const currentCount = salesCountMap.get(productTypeId) || 0;
            salesCountMap.set(productTypeId, currentCount + (orderItem.quantity || 1));
          }
        });
      }

      console.log('Sales count map (productTypeId -> total sold):', 
        Array.from(salesCountMap.entries()).slice(0, 5).map(([k, v]) => `${k}: ${v}`));

      // Filter products to only include those in stock
      const productsWithStock = productsInStock?.filter(product => 
        product.productTypeId && 
        product.Name && 
        product.Name.trim() !== '' &&
        productTypeIdsInStock.has(product.productTypeId)
      ) || [];

      console.log(`Products in stock after filtering: ${productsWithStock.length}`);

      // Remove duplicates based on Name, Brand, Variant, Unit combination
      const uniqueProducts = productsWithStock.filter((product, index, self) => 
        index === self.findIndex(p => 
          p.Name === product.Name && 
          p.Brand === product.Brand && 
          p.Variant === product.Variant && 
          p.Unit === product.Unit
        )
      );

      console.log(`After deduplication: ${uniqueProducts.length} unique products`);

      // Sort by sales count (most sold = highest count) in ASCENDING order as requested
      // Products with more sales appear first (since they're more popular/recently sold)
      const sortedProducts = uniqueProducts.sort((a, b) => {
        const salesA = salesCountMap.get(a.productTypeId) || 0;
        const salesB = salesCountMap.get(b.productTypeId) || 0;
        // Sort by sales count descending (most sold first), then alphabetically
        if (salesB !== salesA) {
          return salesB - salesA;
        }
        return a.Name.localeCompare(b.Name);
      });

      console.log('Products sorted by sales (most sold first):', 
        sortedProducts.slice(0, 5).map(p => ({
          name: p.Name,
          sales: salesCountMap.get(p.productTypeId) || 0
        })));

      // Generate unique IDs for each item to avoid conflicts, but preserve productTypeId
      const formattedItems: GroceryItem[] = sortedProducts.map((item, index) => {
        const isAutoChecked = autoCheckProductTypeId && item.productTypeId === autoCheckProductTypeId;
        const wasPreviouslyChecked = savedSelections.has(item.productTypeId);
        
        return {
          id: index + 1, // Use array index + 1 as unique ID for React keys
          productTypeId: item.productTypeId, // Preserve the actual database ID
          name: item.Name,
          brand: item.Brand || undefined,
          variant: item.Variant || undefined,
          unit: item.Unit || undefined,
          quantity: 1,
          checked: isAutoChecked || wasPreviouslyChecked
        };
      });

      console.log('Final formatted items:', formattedItems.map(i => ({ 
        id: i.id, 
        productTypeId: i.productTypeId, 
        name: i.name,
        checked: i.checked
      })));

      if (autoCheckProductTypeId) {
        console.log('Auto-checking item with productTypeId:', autoCheckProductTypeId);
        const checkedItem = formattedItems.find(i => i.productTypeId === autoCheckProductTypeId);
        if (checkedItem) {
          console.log('Found and checked item:', checkedItem.name);
        } else {
          console.warn('Could not find item with productTypeId:', autoCheckProductTypeId);
        }
      }

      setGroceryItems(formattedItems);
      
      // Save selections to localStorage
      saveSelections(formattedItems);
    } catch (error) {
      console.error('Error loading product types:', error);
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
      // Check if navigated from Home with a product to add
      const addProductTypeId = location.state?.addProductTypeId;
      
      console.log('=== GroceryList useEffect ===');
      console.log('Location state:', location.state);
      console.log('addProductTypeId:', addProductTypeId);
      
      if (addProductTypeId) {
        console.log('Loading grocery list with auto-check for productTypeId:', addProductTypeId);
        await fetchProductTypes(addProductTypeId);
        // Clear the state to prevent re-checking on re-renders
        history.replace('/grocery-list', {});
      } else {
        console.log('Loading grocery list without auto-check');
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
        .single();

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
    console.log('Toggling item with id:', id);
    setGroceryItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked, showingDelete: false } : { ...item, showingDelete: false }
      );
      console.log('Updated items:', newItems.filter(i => i.checked).map(i => ({ id: i.id, name: i.name, checked: i.checked })));
      
      // Save selections to localStorage
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
    setGroceryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, checked: false, showingDelete: false } : item
      )
    );
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
    // Get selected items
    const selectedItems = groceryItems.filter(item => item.checked);
    
    if (selectedItems.length === 0) {
      // Show a simple alert for now - can be improved with toast/modal
      alert('Please select at least one item from your grocery list to search for stores.');
      return;
    }
    
    console.log('Searching for stores with selected items:', selectedItems);
    
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

        {/* Scroll Progress Indicator */}
        {(filteredSelectedItems.length + filteredUnselectedItems.length) > 5 && (
          <div className="grocery-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(100, (filteredSelectedItems.length / Math.min((filteredSelectedItems.length + filteredUnselectedItems.length), 10)) * 100)}%`
              }}
            />
          </div>
        )}

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
