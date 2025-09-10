import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonModal,
  IonItem,
  IonLabel,
  IonToast,
  IonBadge
} from '@ionic/react';
import { star, heart, cartOutline, locationOutline, add, remove, close } from 'ionicons/icons';
import './Home.css';

interface Product {
  storeItemId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  unit: string;
  availability: number;
  item_image_url?: string;
  storeId: number;
  storeName?: string;
}

const CategoryProducts: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const history = useHistory();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [subtotal, setSubtotal] = useState(0);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  
  // Debug: Test database connection on component mount
  useEffect(() => {
    const quickTest = async () => {
      const { data, error } = await supabase
        .from('ITEMS_IN_STORE')
        .select('category, name')
        .limit(5);
      console.log('🔬 Quick database test:', { data, error });
    };
    quickTest();
  }, []);

  const loadCategoryProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      const decodedCategory = decodeURIComponent(category || '');
      console.log('🔍 Loading products for category:', decodedCategory);
      console.log('📍 Full URL category param:', category);
      
      // Test if any items exist in the table
      const { count: totalCount } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total items in table:', totalCount);

      // Test the specific category query
      const { data: categoryTest, error: categoryError, count: categoryCount } = await supabase
        .from('ITEMS_IN_STORE')
        .select('*', { count: 'exact' })
        .eq('category', decodedCategory);
      
      console.log('🎯 Category query result:', {
        category: decodedCategory,
        count: categoryCount,
        actualDataLength: categoryTest?.length,
        error: categoryError,
        firstItem: categoryTest?.[0]
      });

      // Main query without JOIN first to test basic functionality
      const { data, error } = await supabase
        .from('ITEMS_IN_STORE')
        .select(`
          storeItemId,
          name,
          description,
          price,
          category,
          unit,
          availability,
          item_image_url,
          storeId
        `)
        .eq('category', decodedCategory)
        .gt('availability', 0);

      console.log('🏪 Main query result:', { 
        category: decodedCategory,
        count: data?.length || 0,
        data, 
        error 
      });

      if (error) {
        console.error('❌ Error loading category products:', error);
        setProducts([]);
      } else if (data && data.length > 0) {
        console.log('✅ Processing products:', data.length);
        const productsWithStore: Product[] = data.map(item => {
          return {
            storeItemId: item.storeItemId as number,
            name: item.name as string,
            description: item.description as string,
            price: item.price as number,
            category: item.category as string,
            unit: item.unit as string, // Now using actual unit from database
            availability: item.availability as number,
            item_image_url: item.item_image_url as string | undefined,
            storeId: item.storeId as number,
            storeName: 'Store' // We'll get store names separately if needed
          };
        });
        console.log('🎉 Final products to display:', productsWithStore);
        setProducts(productsWithStore);
      } else {
        console.log('⚠️ No products found for this category');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadCategoryProducts();
  }, [loadCategoryProducts]);

  useEffect(() => {
    const loadCartCount = async () => {
      const count = await getCartItemCount();
      setCartItemCount(count);
    };
    loadCartCount();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    product.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // Modal functions
  const openAddToCartModal = (product: Product) => {
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

  // Function to get cart item count
  const getCartItemCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get userId from public.USER table
      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (!userData) return 0;

      // Get cart for this user
      const { data: cart } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', userData.userId)
        .single();

      if (!cart) return 0;

      // Get count of unique items in cart (not total quantity)
      const { data: cartItems } = await supabase
        .from('CART_ITEMS')
        .select('cartItemId')
        .eq('cartId', cart.cartId);

      if (!cartItems) return 0;

      return cartItems.length;
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  };

  const confirmAddToCart = async () => {
    if (selectedProduct) {
      try {
        // Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('User not authenticated');
          return;
        }

        // Get the userId from public.USER table based on auth user email
        const { data: userData, error: userError } = await supabase
          .from('USER')
          .select('userId')
          .eq('email', user.email)
          .single();

        if (userError || !userData) {
          console.error('Error getting user data:', userError);
          return;
        }

        const publicUserId = userData.userId;

        // Check if user already has a cart, if not create one
        const { data: existingCart } = await supabase
          .from('CARTS')
          .select('cartId')
          .eq('userId', publicUserId)
          .maybeSingle();

        let cartId;
        
        if (!existingCart) {
          // Create new cart for user
          const { data: newCart, error: cartError } = await supabase
            .from('CARTS')
            .insert({
              userId: publicUserId
            })
            .select('cartId')
            .single();

          if (cartError) {
            console.error('Error creating cart:', cartError);
            return;
          }
          
          cartId = newCart.cartId;
        } else {
          cartId = existingCart.cartId;
        }

        // Check if item already exists in cart
        const { data: existingCartItem } = await supabase
          .from('CART_ITEMS')
          .select('cartItemId, quantity')
          .eq('cartId', cartId)
          .eq('storeItemId', selectedProduct.storeItemId)
          .maybeSingle();

        if (existingCartItem) {
          // Update existing cart item
          const newQuantity = existingCartItem.quantity + quantity;
          const newSubTotal = selectedProduct.price * newQuantity;

          const { error: updateError } = await supabase
            .from('CART_ITEMS')
            .update({
              quantity: newQuantity,
              subTotal: newSubTotal
            })
            .eq('cartItemId', existingCartItem.cartItemId);

          if (updateError) {
            console.error('Error updating cart item:', updateError);
            return;
          }

          setToastMessage(`Updated ${selectedProduct.name} quantity to ${newQuantity} in cart`);
        } else {
          // Create new cart item
          const { error: itemError } = await supabase
            .from('CART_ITEMS')
            .insert({
              cartId: cartId,
              storeItemId: selectedProduct.storeItemId,
              quantity: quantity,
              subTotal: subtotal
            });

          if (itemError) {
            console.error('Error adding item to cart:', itemError);
            setToastMessage('Error adding item to cart');
            setShowToast(true);
            return;
          }

          setToastMessage(`Added ${quantity} of ${selectedProduct.name} to cart`);
        }

        // Update cart item count and show toast
        const newCartCount = await getCartItemCount();
        setCartItemCount(newCartCount);
        setToastMessage(`${toastMessage} (${newCartCount} items in cart)`);
        setShowToast(true);
        closeModal();
      } catch (error) {
        console.error('Error in confirmAddToCart:', error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Fruits & Vegetables': '🥬',
      'Meat & Seafood': '🥩',
      'Dairy & Eggs': '🥛',
      'Bakery': '🍞',
      'Pantry': '🏺',
      'Snacks': '🍿',
      'Beverages': '🥤'
    };
    return categoryMap[category] || '🛒';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>
            {getCategoryIcon(category || '')} {decodeURIComponent(category || '')}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => history.push('/cart')} style={{ position: 'relative' }}>
              <IonIcon icon={cartOutline} />
              {cartItemCount > 0 && (
                <IonBadge 
                  color="danger" 
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  {cartItemCount}
                </IonBadge>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>

        {/* Search Bar */}
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search products..."
            showClearButton="focus"
          />
        </div>

        <div className="section">
          <h3 className="section-title">
            {filteredProducts.length} Products Found
          </h3>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <IonSpinner name="dots" />
              <p>Loading products...</p>
            </div>
          )}
          
          {!loading && filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No products found in this category.</p>
            </div>
          )}
          
          {!loading && filteredProducts.length > 0 && (
            <IonGrid>
              <IonRow>
                {filteredProducts.map((product) => (
                  <IonCol size="6" key={product.storeItemId}>
                    <IonCard className="product-card">
                      <div className="product-image">
                        {product.item_image_url ? (
                          <img src={product.item_image_url} alt={product.name} />
                        ) : (
                          <div className="product-placeholder">
                            {getCategoryIcon(product.category)}
                          </div>
                        )}
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
                          <p className="product-description">{product.description}</p>
                          <div className="product-rating">
                            <IonIcon icon={star} color="warning" />
                            <span>4.{Math.floor(Math.random() * 5) + 5}</span>
                          </div>
                          <p className="product-store">
                            <IonIcon icon={locationOutline} />
                            {product.storeName}
                          </p>
                          <div className="product-footer">
                            <span className="product-price">
                              ₱{product.price.toFixed(2)}/{product.unit}
                            </span>
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
                          <p className="product-availability">
                            {product.availability} {product.unit} available
                          </p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          )}
        </div>

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
    </IonPage>
  );
};

export default CategoryProducts;
