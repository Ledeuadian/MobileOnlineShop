import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  IonSpinner
} from '@ionic/react';
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
  quantity?: string;
  brand?: string;
  variant?: string;
  unit?: string;
  checked: boolean;
  showingDelete?: boolean;
}

const GroceryList: React.FC = () => {
  const history = useHistory();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Function to fetch product types from database
  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      console.log('Fetching product types from PRODUCT_TYPE table...');
      
      const { data, error } = await supabase
        .from('PRODUCT_TYPE')
        .select('productTypeId, Name, Brand, Variant, Unit')
        .order('Name', { ascending: true });

      if (error) {
        console.error('Error fetching product types:', error);
        // Fallback to empty array if there's an error
        setGroceryItems([]);
        return;
      }

      console.log(`Fetched ${data?.length || 0} product types from database`);
      console.log('Sample data:', data?.slice(0, 3));

      // Remove duplicates based on Name, Brand, Variant, Unit combination
      const uniqueProducts = data.filter((product, index, self) => 
        index === self.findIndex(p => 
          p.Name === product.Name && 
          p.Brand === product.Brand && 
          p.Variant === product.Variant && 
          p.Unit === product.Unit
        )
      );

      console.log(`After deduplication: ${uniqueProducts.length} unique products`);

      const formattedItems: GroceryItem[] = uniqueProducts.map(item => ({
        id: item.productTypeId,
        name: item.Name,
        brand: item.Brand || undefined,
        variant: item.Variant || undefined,
        unit: item.Unit || undefined,
        checked: false
      }));

      setGroceryItems(formattedItems);
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
      await Promise.all([
        fetchProductTypes(),
        loadCartCount()
      ]);
    };
    loadData();
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

  const filteredItems = groceryItems.filter(item => {
    // Always show checked items regardless of search
    if (item.checked) {
      return true;
    }
    
    // For unchecked items, apply search filter
    if (!searchText.trim()) {
      return true; // Show all items when no search text
    }
    
    return (
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.variant?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.unit?.toLowerCase().includes(searchText.toLowerCase())
    );
  }).sort((a, b) => {
    // Sort checked items to the top
    if (a.checked && !b.checked) return -1;
    if (!a.checked && b.checked) return 1;
    // For items with same checked status, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  const toggleItemCheck = (id: number) => {
    setGroceryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked, showingDelete: false } : { ...item, showingDelete: false }
      )
    );
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
    if (!groceryItems.find(item => item.id === id)?.checked) return;
    
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent, id: number) => {
    if (!touchStart) return;
    
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = (id: number) => {
    if (!touchStart || !touchEnd || !groceryItems.find(item => item.id === id)?.checked) return;

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
    history.goBack();
  };

  const navigateToCart = () => {
    history.push('/cart');
  };

  const navigateToProfile = () => {
    // TODO: Navigate to profile page when implemented
    console.log('Profile navigation - to be implemented');
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
    
    // Navigate to grocery store search results with selected items
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
      
      <IonContent>
        <div className="grocery-list-container">
          <div className="grocery-header">
            <h2>Grocery list</h2>
            <p className="item-count">
              {groceryItems.filter(item => item.checked).length === 0 
                ? 'Tap items to add to your list' 
                : `${groceryItems.filter(item => item.checked).length} items selected`
              }
            </p>
          </div>

          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder={
              groceryItems.filter(item => item.checked).length > 0 
                ? `Search grocery list (${groceryItems.filter(item => item.checked).length} selected)`
                : "Search grocery list"
            }
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
              {/* Search info message */}
              {searchText.trim() && groceryItems.filter(item => item.checked).length > 0 && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  margin: '0 1rem', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem', 
                  color: '#1976d2',
                  marginBottom: '0.75rem',
                  border: '1px solid #bbdefb'
                }}>
                  📌 Your selected items ({groceryItems.filter(item => item.checked).length}) remain visible during search
                </div>
              )}
              
              <IonList className="grocery-items-list">
                {filteredItems.map((item) => (
                  <IonItem 
                    key={item.id} 
                    className={`grocery-item ${item.checked ? 'selected' : ''}`}
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
                        onClick={() => item.checked ? toggleDeleteView(item.id) : toggleItemCheck(item.id)}
                      >
                        <div className="item-details">
                          <h3 className="item-name">
                            {item.checked && <span className="selected-indicator">✓ </span>}
                            {item.name}
                          </h3>
                          <div className="item-info">
                            <span className="item-size">{item.unit}</span>
                            <span className="item-brand">{item.brand}</span>
                          </div>
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
                {!loading && filteredItems.length === 0 && (
                  <div className="empty-state">
                    <IonIcon icon={searchOutline} className="empty-state-icon" />
                    <h3>{searchText ? 'No items found' : 'No grocery items available'}</h3>
                    <p>
                      {searchText 
                        ? 'Try searching with different keywords or check your spelling'
                        : 'Start by searching for items to add to your grocery list'
                      }
                    </p>
                  </div>
                )}
              </IonList>
            </>
          )}
        </div>

        {/* Scroll Progress Indicator */}
        {filteredItems.length > 5 && (
          <div className="grocery-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(100, (groceryItems.filter(item => item.checked).length / Math.min(filteredItems.length, 10)) * 100)}%`
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
          <button className="nav-btn" onClick={navigateToProfile}>
            <IonIcon icon={personOutline} className="nav-icon" />
          </button>
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
    </IonPage>
  );
};

export default GroceryList;
