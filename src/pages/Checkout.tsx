import React, { useEffect, useState, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonList, IonItem
} from '@ionic/react';
import { arrowBackOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

const Checkout: React.FC = () => {
  const history = useHistory();
  type Address = { addressId: number; Name: string; Contact: string; Address: string; isDefault?: boolean };
  type CartItem = { 
    cartItemId: number; 
    cartId: number; 
    storeItemId: number; 
    quantity: number; 
    subTotal: number; 
    ITEMS_IN_STORE?: { 
      name?: string; 
      price?: number;
      storeId?: number;
      productTypeId?: number;
      GROCERY_STORE?: {
        storeName?: string;
      }
    } 
  };
  // Supabase row typing removed (normalized later)

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
  const [srpPrices, setSrpPrices] = useState<Record<number, number>>({});

  const loadAddresses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .maybeSingle();

      const publicUserId = userData?.userId;
      if (!publicUserId) return;

      const { data } = await supabase
        .from('DELIVERY_ADDRESS')
        .select('*')
        .eq('userId', publicUserId);

      const list = (data || []) as Address[];
      list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      setAddresses(list);
      setSelectedAddress(list[0] || null);
    } catch (err) {
      console.error('Error loading addresses', err);
    }
  }, []);

  const loadCart = useCallback(async () => {
    try {
      // Reuse the same logic used in Cart page to fetch cart items
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .maybeSingle();

      const publicUserId = userData?.userId;
      if (!publicUserId) return;

      const { data: cart } = await supabase
        .from('CARTS')
        .select('cartId')
        .eq('userId', publicUserId)
        .maybeSingle();

      if (!cart) return;

      const { data: cartItemsData } = await supabase
        .from('CART_ITEMS')
        .select('cartItemId, cartId, storeItemId, quantity, subTotal')
        .eq('cartId', cart.cartId);

      const cartItemsWithDetails: CartItem[] = [];
      for (const cartItem of (cartItemsData || [])) {
        const { data: itemData, error: itemError } = await supabase
          .from('ITEMS_IN_STORE')
          .select('name, price, unit, storeId, productTypeId')
          .eq('storeItemId', cartItem.storeItemId)
          .maybeSingle();

        if (itemError) {
          console.error('Error loading item details for checkout:', itemError);
        }

        if (!itemData) {
          // Skip if no item detail
          continue;
        }

        // Add store name (using same approach as Cart.tsx)
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

      // Load SRP prices for all unique productTypeIds
      const productTypeIds = [...new Set(cartItemsWithDetails
        .map(item => item.ITEMS_IN_STORE?.productTypeId)
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
    } catch (err) {
      console.error('Error loading cart for checkout', err);
    }
  }, []);

  const location = useLocation();

  useEffect(() => {
    // Load addresses and cart items
    loadAddresses();
    loadCart();

    // If navigated back from AddressSelection, use selectedAddress from history state
    const state = (location as unknown as { state?: { selectedAddress?: Address } })?.state;
    if (state?.selectedAddress) {
      setSelectedAddress(state.selectedAddress);
      // clear it to avoid reusing on further navigations
      history.replace('/checkout');
    }
  }, [loadAddresses, loadCart, history, location]);

  const goToAddressSelection = () => {
    history.push('/address-selection', { from: '/checkout' });
  };

  const getTotal = () => cartItems.reduce((s, it) => s + (it.subTotal || 0), 0);

  const calculateSavings = (items: CartItem[]) => {
    return items.reduce((total, item) => {
      const productTypeId = item.ITEMS_IN_STORE?.productTypeId;
      if (!productTypeId || !srpPrices[productTypeId]) return total;
      
      const srpPrice = srpPrices[productTypeId];
      const storePrice = item.ITEMS_IN_STORE?.price || 0;
      const quantity = item.quantity || 0;
      
      // Calculate savings: (SRP Price - Store Price) * Quantity
      // Positive means customer saves money
      const itemSavings = (srpPrice - storePrice) * quantity;
      return total + (itemSavings > 0 ? itemSavings : 0); // Only count positive savings
    }, 0);
  };

  const getTotalSavings = () => calculateSavings(cartItems);

  const groupItemsByStore = () => {
    const groups = cartItems.reduce((groups, item) => {
      const storeId = item.ITEMS_IN_STORE?.storeId;
      if (!storeId) return groups;
      
      const storeName = item.ITEMS_IN_STORE?.GROCERY_STORE?.storeName || 'Unknown Store';
      
      if (!groups[storeId]) {
        groups[storeId] = {
          storeName,
          items: []
        };
      }
      
      groups[storeId].items.push(item);
      return groups;
    }, {} as Record<number, { storeName: string; items: CartItem[] }>);
    
    console.log('Store groups:', groups);
    console.log('Cart items:', cartItems);
    return groups;
  };

  const toggleStoreExpansion = (storeId: number) => {
    console.log('Toggling store:', storeId);
    setExpandedStores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
        console.log('Collapsed store:', storeId);
      } else {
        newSet.add(storeId);
        console.log('Expanded store:', storeId);
      }
      console.log('Expanded stores:', Array.from(newSet));
      return newSet;
    });
  };

  const storeGroups = groupItemsByStore();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to place an order.');
        return;
      }
      const { data: userData } = await supabase
        .from('USER')
        .select('userId, firstname, lastname, email')
        .eq('email', user.email)
        .maybeSingle();
      if (!userData) {
        alert('Error placing order. Please try again.');
        return;
      }
      const customerName = (userData.firstname && userData.lastname)
        ? `${userData.firstname} ${userData.lastname}`.trim()
        : userData.email;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

      for (const [storeId, storeGroup] of Object.entries(storeGroups)) {
        const storeIdNum = Number(storeId);
        const storeTotal = storeGroup.items.reduce((s, it) => s + (it.subTotal || 0), 0);
        const storeSavings = calculateSavings(storeGroup.items);
        const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        const { data: orderData, error: orderError } = await supabase
          .from('ORDERS')
          .insert({
            userId: userData.userId,
            storeId: storeIdNum,
            orderNumber,
            status: 'pending',
            paymentMethod: 'Cash on Pickup',
            total: storeTotal,
            savings: storeSavings,
            itemsCount: storeGroup.items.length,
            totalItems: storeGroup.items.length,
          })
          .select('orderId')
          .single();

        if (orderError || !orderData) {
          console.error('Error creating order:', orderError);
          continue;
        }

        const orderItems = storeGroup.items.map(it => ({
          orderId: orderData.orderId,
          storeItemId: it.storeItemId,
          quantity: it.quantity,
          price: it.ITEMS_IN_STORE?.price || 0,
          subTotal: it.subTotal,
        }));
        await supabase.from('ORDER_ITEMS').insert(orderItems);

        // Notify store owner
        const { data: storeData } = await supabase
          .from('GROCERY_STORE')
          .select('owner_id')
          .eq('storeId', storeIdNum)
          .single();
        if (storeData?.owner_id) {
          const { data: ownerData } = await supabase
            .from('USER')
            .select('userId')
            .eq('auth_user_id', storeData.owner_id)
            .maybeSingle();
          if (ownerData) {
            await supabase.from('NOTIFICATIONS').insert({
              userId: ownerData.userId,
              orderId: orderData.orderId,
              customerName,
              orderNumber,
              paymentMethod: 'Cash on Pickup',
              total: storeTotal,
              status: 'pending',
            });
          }
        }
      }
      history.push('/my-purchases');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <div style={{ fontWeight: 700 }}>{selectedAddress ? selectedAddress.Name : 'Select delivery address'}</div>
                {selectedAddress && (
                  <div style={{ fontSize: 13, color: '#666' }}>
                    <div>{selectedAddress.Contact}</div>
                    <div>{selectedAddress.Address}</div>
                  </div>
                )}
                  <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{addresses.length} saved address(es)</div>
              </div>
              <IonButton fill="clear" onClick={goToAddressSelection}>
                <IonIcon icon={chevronForwardOutline} />
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <h3>Items</h3>
            {Object.entries(storeGroups).map(([storeId, storeGroup]) => {
              const storeIdNum = Number(storeId);
              const isExpanded = expandedStores.has(storeIdNum);
              const totalItems = storeGroup.items.length;
              const availableItems = storeGroup.items.length; // All items are available
              const storeSavings = calculateSavings(storeGroup.items);
              const storeTotal = storeGroup.items.reduce((sum, item) => sum + (item.subTotal || 0), 0);

              return (
                <div key={storeId} style={{ marginBottom: 16 }}>
                  <div 
                    onClick={() => toggleStoreExpansion(storeIdNum)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{storeGroup.storeName}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        Available: {availableItems} of {totalItems} items
                      </div>
                      <div style={{ fontSize: 13, color: '#28a745' }}>
                        Saved: ₱{storeSavings.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        ₱{storeTotal.toFixed(2)}
                      </div>
                      <IonIcon 
                        icon={isExpanded ? chevronUpOutline : chevronDownOutline} 
                        style={{ fontSize: 20 }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <IonList style={{ marginTop: 8 }}>
                      {storeGroup.items.map((it: CartItem) => (
                        <IonItem key={it.cartItemId}>
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{it.ITEMS_IN_STORE?.name}</div>
                              <div style={{ fontSize: 13, color: '#666' }}>
                                {it.quantity} x ₱{it.ITEMS_IN_STORE?.price?.toFixed(2)}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700 }}>₱{(it.subTotal || 0).toFixed(2)}</div>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              );
            })}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid #ddd' }}>
              <div style={{ fontWeight: 700 }}>Total</div>
              <div style={{ fontWeight: 700 }}>₱{getTotal().toFixed(2)}</div>
            </div>
            
            {getTotalSavings() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#28a745' }}>
                <div style={{ fontWeight: 700 }}>Saved based on SRP</div>
                <div style={{ fontWeight: 700 }}>₱{getTotalSavings().toFixed(2)}</div>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" color="primary" style={{ marginTop: 16 }} onClick={handlePlaceOrder}>
          Place Order
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Checkout;
