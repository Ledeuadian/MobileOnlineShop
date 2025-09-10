import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonList,
  IonItem,
  IonBadge,
  IonAlert,
  IonToast
} from '@ionic/react';
import { 
  cartOutline, 
  trashOutline, 
  addOutline, 
  removeOutline,
  storefront,
  checkmarkCircle,
  arrowBackOutline
} from 'ionicons/icons';
import './Cart.css';

interface CartItem {
  cartItemId: number;
  cartId: number;
  storeItemId: number;
  quantity: number;
  subTotal: number;
  ITEMS_IN_STORE: {
    name: string;
    description: string;
    price: number;
    unit: string;
    category: string;
    item_image_url?: string;
    storeId: number;
    GROCERY_STORE: {
      storeName: string;
    };
  };
}

const Cart: React.FC = () => {
  const history = useHistory();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<number, { quantity: number, subTotal: number }>>(new Map());

  const loadCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Get userId from public.USER table
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        return;
      }

      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', userData.userId)
        .single();

      if (cartError || !cart) {
        console.log('No cart found for user');
        setCartItems([]);
        return;
      }

      // Get cart items first
      const { data: cartItemsData, error: cartItemsError } = await supabase
        .from('CART_ITEMS')
        .select('cartItemId, cartId, storeItemId, quantity, subTotal')
        .eq('cartId', cart.cartId);

      if (cartItemsError) {
        console.error('Error loading cart items:', cartItemsError);
        showToastMessage('Error loading cart items');
        return;
      }

      if (!cartItemsData || cartItemsData.length === 0) {
        setCartItems([]);
        return;
      }

      // Get item details for each cart item
      const cartItemsWithDetails: CartItem[] = [];
      
      for (const cartItem of cartItemsData) {
        // Get item details
        const { data: itemData, error: itemError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('name, description, price, unit, category, item_image_url, storeId')
          .eq('storeItemId', cartItem.storeItemId)
          .single();

        if (itemError) {
          console.error('Error loading item details:', itemError);
          continue;
        }

        // Temporary fix: Use placeholder store name to avoid RLS issues
        // TODO: Fix RLS policies to allow public read access to store names
        const storeName = `Store #${itemData.storeId}`;

        cartItemsWithDetails.push({
          cartItemId: cartItem.cartItemId,
          cartId: cartItem.cartId,
          storeItemId: cartItem.storeItemId,
          quantity: cartItem.quantity,
          subTotal: cartItem.subTotal,
          ITEMS_IN_STORE: {
            ...itemData,
            GROCERY_STORE: {
              storeName: storeName
            }
          }
        });
      }

      setCartItems(cartItemsWithDetails);
    } catch (error) {
      console.error('Error loading cart items:', error);
      showToastMessage('Error loading cart items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  const savePendingChanges = useCallback(async (): Promise<boolean> => {
    if (pendingChanges.size === 0) {
      return true; // No changes to save
    }

    try {
      // Save each pending change to the database  
      for (const [cartItemId, change] of pendingChanges.entries()) {
        const { error } = await supabase
          .from('CART_ITEMS')
          .update({ 
            quantity: change.quantity,
            subTotal: change.subTotal
          })
          .eq('cartItemId', cartItemId);

        if (error) {
          console.error('Error saving quantity change:', error);
          showToastMessage('Error saving changes');
          return false;
        }
      }

      // Clear pending changes after successful save
      setPendingChanges(new Map());
      return true;
    } catch (error) {
      console.error('Error saving pending changes:', error);
      showToastMessage('Error saving changes');
      return false;
    }
  }, [pendingChanges]);

  // Handle navigation away from cart to save pending changes  
  useEffect(() => {
    const handleBeforeUnload = async () => {
      await savePendingChanges();
    };

    const handlePopState = async () => {
      await savePendingChanges();
    };

    // Save changes when user navigates away or refreshes
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Save pending changes when component unmounts
      savePendingChanges();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [savePendingChanges]);

  const handleBackClick = async () => {
    await savePendingChanges();
    history.goBack();
  };

  const updateQuantity = (cartItemId: number, newQuantity: number, price: number) => {
    // Prevent quantity from going below 1
    if (newQuantity < 1) {
      newQuantity = 1;
    }

    const newSubTotal = price * newQuantity;
    
    // Update local state immediately
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.cartItemId === cartItemId 
          ? { ...item, quantity: newQuantity, subTotal: newSubTotal }
          : item
      )
    );

    // Track the change for later database update
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.set(cartItemId, { quantity: newQuantity, subTotal: newSubTotal });
      return newChanges;
    });
  };



  const confirmDeleteItem = (cartItemId: number) => {
    setItemToDelete(cartItemId);
    setShowDeleteAlert(true);
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('CART_ITEMS')
        .delete()
        .eq('cartItemId', itemToDelete);

      if (error) {
        console.error('Error deleting item:', error);
        showToastMessage('Error removing item from cart');
      } else {
        await loadCartItems();
        showToastMessage('Item removed from cart');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToastMessage('Error removing item from cart');
    } finally {
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get userId from public.USER table
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        return;
      }

      // Get user's cart
      const { data: cart, error: cartError } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', userData.userId)
        .single();

      if (cartError || !cart) {
        console.log('No cart found for user');
        return;
      }

      // Delete all cart items
      const { error } = await supabase
        .from('CART_ITEMS')
        .delete()
        .eq('cartId', cart.cartId);

      if (error) {
        console.error('Error clearing cart:', error);
        showToastMessage('Error clearing cart');
      } else {
        await loadCartItems();
        showToastMessage('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      showToastMessage('Error clearing cart');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + item.subTotal;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.length;
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const groupItemsByStore = () => {
    return cartItems.reduce((groups, item) => {
      const storeId = item.ITEMS_IN_STORE.storeId;
      const storeName = item.ITEMS_IN_STORE.GROCERY_STORE?.storeName || 'Unknown Store';
      
      if (!groups[storeId]) {
        groups[storeId] = {
          storeName,
          items: []
        };
      }
      
      groups[storeId].items.push(item);
      return groups;
    }, {} as Record<number, { storeName: string; items: CartItem[] }>);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={handleBackClick}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>My Cart</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const storeGroups = groupItemsByStore();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleBackClick}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            My Cart {cartItems.length > 0 && (
              <IonBadge color="light">{getTotalItems()}</IonBadge>
            )}
          </IonTitle>
          {cartItems.length > 0 && (
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={clearCart}>
                Clear All
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <IonIcon icon={cartOutline} />
            <h2>Your cart is empty</h2>
            <p>Start shopping to add items to your cart</p>
            <IonButton 
              expand="block" 
              onClick={() => history.push('/home')}
              className="shop-now-btn"
            >
              Shop Now
            </IonButton>
          </div>
        ) : (
          <>
            {Object.entries(storeGroups).map(([storeId, storeGroup]) => (
              <div key={storeId} className="store-group">
                <div className="store-header">
                  <IonIcon icon={storefront} />
                  <span>{storeGroup.storeName}</span>
                </div>
                
                <IonList>
                  {storeGroup.items.map((item) => (
                    <IonItem key={item.cartItemId}>
                        <div className="cart-item">
                          <div className="item-image">
                            {item.ITEMS_IN_STORE.item_image_url ? (
                              <img 
                                src={item.ITEMS_IN_STORE.item_image_url} 
                                alt={item.ITEMS_IN_STORE.name}
                              />
                            ) : (
                              <div className="image-placeholder">
                                🛒
                              </div>
                            )}
                          </div>
                          
                          <div className="item-details">
                            <h3>{item.ITEMS_IN_STORE.name}</h3>
                            <p>{item.ITEMS_IN_STORE.description}</p>
                            <div className="item-meta">
                              <span className="price">
                                ₱{item.ITEMS_IN_STORE.price} / {item.ITEMS_IN_STORE.unit}
                              </span>
                              <span className="category">
                                {item.ITEMS_IN_STORE.category}
                              </span>
                            </div>
                            <div className="quantity-total">
                              <span className="total">
                                Total: ₱{item.subTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="item-actions">
                            <div className="quantity-controls">
                              <IonButton 
                                fill="clear" 
                                size="small"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1, item.ITEMS_IN_STORE.price)}
                              >
                                <IonIcon icon={removeOutline} />
                              </IonButton>
                              <span className="quantity">{item.quantity}</span>
                              <IonButton 
                                fill="clear" 
                                size="small"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1, item.ITEMS_IN_STORE.price)}
                              >
                                <IonIcon icon={addOutline} />
                              </IonButton>
                            </div>
                            <IonButton 
                              fill="clear" 
                              color="danger" 
                              size="small"
                              onClick={() => confirmDeleteItem(item.cartItemId)}
                              className="delete-btn"
                            >
                              <IonIcon icon={trashOutline} />
                            </IonButton>
                          </div>
                        </div>
                      </IonItem>
                  ))}
                </IonList>
              </div>
            ))}
            
            <div className="cart-summary">
              <IonCard>
                <IonCardContent>
                  <div className="summary-row">
                    <span>Total Items:</span>
                    <span>{getTotalItems()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>₱{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <IonButton 
                    expand="block" 
                    color="success"
                    className="checkout-btn"
                  >
                    <IonIcon icon={checkmarkCircle} slot="start" />
                    Proceed to Checkout
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </>
        )}
        
        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Remove Item"
          message="Are you sure you want to remove this item from your cart?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowDeleteAlert(false)
            },
            {
              text: 'Remove',
              handler: deleteItem
            }
          ]}
        />
        
        {/* Toast for notifications */}
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

export default Cart;
