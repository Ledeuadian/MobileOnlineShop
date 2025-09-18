import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase, checkUserApprovalStatus } from '../services/supabaseService';
import { LocationService } from '../services/locationService';
import { KNNService } from '../services/knnService';
import {
  IonPage, 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonMenuToggle,
  IonModal,
  IonItem,
  IonLabel,
  IonToast,
  IonBadge,
  IonSpinner,
  IonFooter
} from '@ionic/react';
import { star, heart, cartOutline, locationOutline, storefrontOutline, personOutline, add, remove, close } from 'ionicons/icons';
import ProfileMenu from '../components/ProfileMenu';
import './Home.css';

interface FeaturedProduct {
  storeItemId: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  availability: number;
  item_image_url?: string;
  storeId: number;
}

interface NearbyStore {
  storeId: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  distance?: number;
  store_phone?: string;
  store_email?: string;
  rating?: number;
  estimatedDeliveryTime?: string;
  categories?: string[];
}

const Home: React.FC = () => {
  console.log('Home component mounting...');
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FeaturedProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [subtotal, setSubtotal] = useState(0);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);

  // Helper function to validate URLs
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        // Check user status and redirect if needed
        try {
          const approvalResult = await checkUserApprovalStatus(data.session.user.email);
          if (approvalResult?.data) {
            // Redirect ADMIN users (userTypeCode === 1) to Admin Dashboard
            if (approvalResult.data.userTypeCode === 1 && approvalResult.data.approval_status === 'approved') {
              history.push('/admin-dashboard');
              return;
            }
            
            // Redirect STORE users (userTypeCode === 3) to Store Dashboard  
            if (approvalResult.data.userTypeCode === 3 && approvalResult.data.approval_status === 'approved') {
              history.push('/store-dashboard');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };
    
    const loadFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('ITEMS_IN_STORE')
          .select(`
            storeItemId,
            name,
            description,
            price,
            unit,
            availability,
            item_image_url,
            storeId
          `)
          .gt('availability', 0)
          .limit(8);

        if (data && !error) {
          setFeaturedProducts(data as unknown as FeaturedProduct[]);
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
      }
    };

    const loadNearbyStores = async () => {
      try {
        setLoadingStores(true);
        console.log('🏪 Loading nearby stores...');

        // First, try to get user's location
        const userLocation = await LocationService.getCurrentPosition();
        
        if (!userLocation) {
          console.warn('⚠️ Could not get user location, showing all stores');
          // Fallback: show all stores without distance calculation
          const { data: stores, error } = await supabase
            .from('GROCERY_STORE')
            .select('storeId, name, location, latitude, longitude, store_phone, store_email')
            .limit(5);

          if (stores && !error) {
            const storesWithDefaults: NearbyStore[] = stores.map((store, index) => ({
              ...store,
              rating: 4.0 + Math.random() * 0.9, // Random rating between 4.0-4.9
              estimatedDeliveryTime: `${15 + index * 5}-${20 + index * 5} min delivery`,
              categories: getRandomCategories()
            }));
            setNearbyStores(storesWithDefaults);
          }
          return;
        }

        // Get stores with location data
        const { data: stores, error: storesError } = await supabase
          .from('GROCERY_STORE')
          .select('storeId, name, location, latitude, longitude, store_phone, store_email')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (storesError) {
          console.error('Error fetching stores:', storesError);
          return;
        }

        if (!stores || stores.length === 0) {
          console.log('No stores found with location data');
          setNearbyStores([]);
          return;
        }

        // Calculate distances using KNN service
        const storesWithDistance = stores.map(store => ({
          ...store,
          distance: KNNService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            store.latitude,
            store.longitude
          )
        }));

        // Sort by distance and take top 5
        const nearestStores = [...storesWithDistance]
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .map(store => ({
            ...store,
            rating: 4.0 + Math.random() * 0.9, // Random rating between 4.0-4.9
            estimatedDeliveryTime: getEstimatedDeliveryTime(store.distance),
            categories: getRandomCategories()
          }));

        console.log('🎯 Found nearby stores:', nearestStores);
        setNearbyStores(nearestStores);

      } catch (error) {
        console.error('❌ Error loading nearby stores:', error);
        // Fallback: show some stores without location
        const { data: stores } = await supabase
          .from('GROCERY_STORE')
          .select('storeId, name, location, store_phone, store_email')
          .limit(3);

        if (stores) {
          const fallbackStores: NearbyStore[] = stores.map((store, index) => ({
            ...store,
            latitude: 0,
            longitude: 0,
            rating: 4.0 + Math.random() * 0.9,
            estimatedDeliveryTime: `${20 + index * 5}-${25 + index * 5} min delivery`,
            categories: getRandomCategories()
          }));
          setNearbyStores(fallbackStores);
        }
      } finally {
        setLoadingStores(false);
      }
    };

    // Helper function to get random categories for stores
    const getRandomCategories = (): string[] => {
      const allCategories = [
        'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 
        'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Pantry'
      ];
      const count = Math.floor(Math.random() * 3) + 2; // 2-4 categories
  const shuffled = [...allCategories].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    // Helper function to estimate delivery time based on distance
    const getEstimatedDeliveryTime = (distance: number): string => {
      const baseTime = 15;
      const timePerKm = 5;
      const minTime = baseTime + Math.floor(distance * timePerKm);
      const maxTime = minTime + 10;
      return `${minTime}-${maxTime} min delivery`;
    };

    const loadCartCount = async () => {
      const count = await getCartItemCount();
      setCartItemCount(count);
    };

    checkAuthAndRedirect();
    loadFeaturedProducts();
    loadNearbyStores();
    loadCartCount();

    // Also refresh cart count when window gets focus (user returns to tab/app)
    const handleFocus = () => {
      loadCartCount();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [history]);

  // Categories based on exact database categories
  const categories = [
    { id: 1, name: 'Fruits & Vegetables', icon: '🥬', color: '#4CAF50' },
    { id: 2, name: 'Meat & Seafood', icon: '🥩', color: '#F44336' },
    { id: 3, name: 'Dairy & Eggs', icon: '🥛', color: '#2196F3' },
    { id: 4, name: 'Bakery', icon: '🍞', color: '#FF9800' },
    { id: 5, name: 'Pantry', icon: '🏺', color: '#9C27B0' },
    { id: 6, name: 'Beverages', icon: '🥤', color: '#00BCD4' }
  ];

  const handleCategoryClick = (categoryName: string) => {
    console.log('Category clicked:', categoryName);
    history.push(`/category/${encodeURIComponent(categoryName)}`);
  };

  // Modal functions
  const openAddToCartModal = (product: FeaturedProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSubtotal(product.price);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setQuantity(1);
    setSubtotal(0);
  };

  const getCartItemCount = async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get userId from public.USER table
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .maybeSingle();

      if (userError || !userData) {
        console.warn('Error getting user data for cart count:', userError);
        return 0;
      }

      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', userData.userId)
        .maybeSingle();

      if (cartError) {
        console.warn('Error getting cart for count:', cartError);
        return 0;
      }
      
      if (!cart) {
        console.log('No cart found for user');
        return 0;
      }

      // Get total quantity of all items in cart
      const { data: cartItems, error: itemsError } = await supabase
        .from('CART_ITEMS')
        .select('quantity')
        .eq('cartId', cart.cartId);

      if (itemsError) {
        console.warn('Error getting cart items for count:', itemsError);
        return 0;
      }

      // Sum up all quantities for total count
      const totalQuantity = cartItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
      return totalQuantity;
    } catch (error) {
      console.error('Error counting cart items:', error);
      return 0;
    }
  };

  const navigateToCart = () => {
    history.push('/cart');
  };

  const navigateToGroceryList = () => {
    history.push('/grocery-list');
  };

  const incrementQuantity = () => {
    if (selectedProduct) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      setSubtotal(selectedProduct.price * newQuantity);
    }
  };

  const decrementQuantity = () => {
    if (selectedProduct && quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setSubtotal(selectedProduct.price * newQuantity);
    }
  };

  const confirmAddToCart = async () => {
    if (!selectedProduct) return;

    // Helper: get the public userId from auth user
    const getPublicUserId = async (): Promise<string | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        return null;
      }

      return userData.userId;
    };

    // Helper: get or create a cartId for the given user
    const getOrCreateCartId = async (publicUserId: string): Promise<string | null> => {
      const { data: existingCart } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', publicUserId)
        .maybeSingle();

  if (existingCart?.cartId) return existingCart.cartId;

      const createResult = await supabase
        .from('CARTS')
        .insert({ userId: publicUserId })
        .select('cartId')
        .single();

      const newCart = createResult.data;
      const cartError = createResult.error;

      if (cartError || !newCart) {
        console.error('Error creating cart:', cartError);
        return null;
      }

      return newCart.cartId;
    };

    // Helper: add or update cart item
    const addOrUpdateCartItem = async (cartId: string) => {
      const { data: existingCartItem } = await supabase
        .from('CART_ITEMS')
        .select('cartItemId, quantity')
        .eq('cartId', cartId)
        .eq('storeItemId', selectedProduct.storeItemId)
        .maybeSingle();

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity;
        const newSubTotal = selectedProduct.price * newQuantity;

        const { error: updateError } = await supabase
          .from('CART_ITEMS')
          .update({ quantity: newQuantity, subTotal: newSubTotal })
          .eq('cartItemId', existingCartItem.cartItemId);

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          return false;
        }

        console.log(`Updated ${selectedProduct.name} quantity to ${newQuantity} in cart`);
        return true;
      }

      const { error: itemError } = await supabase
        .from('CART_ITEMS')
        .insert({ cartId, storeItemId: selectedProduct.storeItemId, quantity, subTotal: subtotal });

      if (itemError) {
        console.error('Error adding item to cart:', itemError);
        return false;
      }

      console.log(`Added ${quantity} of ${selectedProduct.name} to cart. Subtotal: ₱${subtotal}`);
      return true;
    };

    try {
      const publicUserId = await getPublicUserId();
      if (!publicUserId) return;

      const cartId = await getOrCreateCartId(publicUserId);
      if (!cartId) return;

      const ok = await addOrUpdateCartItem(cartId);
      if (!ok) return;

      const updatedCount = await getCartItemCount();
      setCartItemCount(updatedCount);

      closeModal();
    } catch (error) {
      console.error('Error in confirmAddToCart:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>GROCERLYTICS</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent id="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1>Fresh Groceries</h1>
          <h2>Delivered to Your Door</h2>
          <p>Shop from local stores and get fresh products delivered fast</p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search for products, stores..."
            showClearButton="focus"
          />
        </div>

        {/* Categories */}
        <div className="section">
          <h3 className="section-title">Shop by Category</h3>
          <IonGrid>
            <IonRow>
              {categories.map((category) => (
                <IonCol size="4" key={category.id}>
                  <button 
                    className="category-card" 
                    onClick={() => handleCategoryClick(category.name)} 
                    style={{ cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
                  >
                    <div 
                      className="category-icon"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <p className="category-name">{category.name}</p>
                  </button>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Featured Products */}
        <div className="section">
          <h3 className="section-title">Featured Products</h3>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <IonCard key={product.storeItemId} className="product-card">
                <div className="product-image">
                  {product.item_image_url && isValidUrl(product.item_image_url) ? (
                    <img 
                      src={product.item_image_url} 
                      alt={product.name}
                      onError={(e) => {
                        // Hide broken image and show placeholder
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="product-placeholder" 
                    style={{ display: product.item_image_url && isValidUrl(product.item_image_url) ? 'none' : 'flex' }}
                  >
                    🛒
                  </div>
                  <IonButton 
                    fill="clear" 
                    className="wishlist-btn"
                    size="small"
                  >
                    <IonIcon icon={heart} />
                  </IonButton>
                </div>
                
                <IonCardContent>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <div className="product-rating">
                      <IonIcon icon={star} color="warning" />
                      <span>4.{Math.floor(Math.random() * 5) + 5}</span>
                    </div>
                    <p className="product-store">
                      <IonIcon icon={locationOutline} />
                      Store
                    </p>
                    <div className="product-footer">
                      <span className="product-price">₱{product.price}/{product.unit}</span>
                      <IonButton 
                        size="small" 
                        fill="solid" 
                        color="primary"
                        className="add-to-cart-btn"
                        onClick={() => openAddToCartModal(product)}
                      >
                        <IonIcon icon={cartOutline} slot="start" />
                        Add
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </div>

        {/* Nearby Stores */}
        <div className="section">
          <h3 className="section-title">Nearby Stores</h3>
          <div className="stores-list">
            {loadingStores ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : nearbyStores.length > 0 ? (
              nearbyStores.map((store) => (
                <IonCard key={store.storeId} className="store-card">
                  <IonCardContent>
                    <div className="store-info">
                      <div className="store-header">
                        <h4>{store.name}</h4>
                        <div className="store-rating">
                          <IonIcon icon={star} color="warning" />
                          <span>{store.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="store-details">
                        <IonIcon icon={locationOutline} />
                        {store.distance ? 
                          `${store.distance.toFixed(1)} km away • ${store.estimatedDeliveryTime}` :
                          `${store.location} • ${store.estimatedDeliveryTime}`
                        }
                      </p>
                      <div className="store-categories">
                        {store.categories?.slice(0, 3).map((category) => (
                          <span key={category} className="category-tag">{category}</span>
                        ))}
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            ) : (
              <IonCard className="store-card">
                <IonCardContent>
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                    <IonIcon icon={storefrontOutline} style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                    <p>No nearby stores found</p>
                    <p style={{ fontSize: '0.9rem' }}>Check your location settings or try again later</p>
                  </div>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        </div>

        {/* Bottom Menu Bar */}
        <IonFooter>
          <div className="bottom-bar">
            <button className="bottom-bar-btn" onClick={navigateToGroceryList}>
              <IonIcon icon={storefrontOutline} className="shop-btn" />
            </button>
            <button className="bottom-bar-btn" onClick={navigateToCart} style={{ position: 'relative' }}>
              <IonIcon icon={cartOutline} className="cart-btn" />
              {cartItemCount > 0 && (
                <IonBadge 
                  color="danger" 
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {cartItemCount}
                </IonBadge>
              )}
            </button>
            <IonMenuToggle menu="profile-menu">
              <button className="bottom-bar-btn" onClick={() => console.log('Profile button clicked')}>
                <IonIcon icon={personOutline} className="profile-btn" />
              </button>
            </IonMenuToggle>
          </div>
        </IonFooter>
      </IonContent>

      {/* Add to Cart Modal */}
      <IonModal 
        isOpen={isModalOpen} 
        onDidDismiss={closeModal}
        backdropDismiss={true}
        showBackdrop={true}
        className="transparent-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add to Cart</IonTitle>
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={closeModal}
            >
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '400px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            margin: '20px auto'
          }}>
          {selectedProduct && (
            <div>
              <IonCard>
                <IonCardContent>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>{selectedProduct.name}</h2>
                    <p style={{ color: '#666' }}>{selectedProduct.description}</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3880ff' }}>
                      ₱{selectedProduct.price} per {selectedProduct.unit}
                    </p>
                  </div>
                  
                  <IonItem lines="none">
                    <IonLabel>Quantity</IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <IonButton 
                        fill="outline" 
                        size="small" 
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <IonIcon icon={remove} />
                      </IonButton>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <IonButton 
                        fill="outline" 
                        size="small" 
                        onClick={incrementQuantity}
                      >
                        <IonIcon icon={add} />
                      </IonButton>
                    </div>
                  </IonItem>
                  
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '10px 0', fontSize: '20px' }}>
                      Subtotal: <span style={{ color: '#3880ff' }}>₱{subtotal.toFixed(2)}</span>
                    </h3>
                  </div>
                  
                  <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={closeModal}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </IonButton>
                    <IonButton 
                      expand="block" 
                      onClick={confirmAddToCart}
                      style={{ flex: 1 }}
                    >
                      Add to Cart
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
          </div>
        </IonContent>
      </IonModal>

      {/* Toast for cart notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color="success"
      />

      {/* Profile Menu */}
      <ProfileMenu />
    </IonPage>
  );
};

export default Home;
