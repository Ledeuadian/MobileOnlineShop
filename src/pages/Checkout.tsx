import React, { useEffect, useState, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonList, IonItem
} from '@ionic/react';
import { arrowBackOutline, chevronForwardOutline } from 'ionicons/icons';

const Checkout: React.FC = () => {
  const history = useHistory();
  type Address = { addressId: number; Name: string; Contact: string; Address: string; isDefault?: boolean };
  type CartItem = { cartItemId: number; cartId: number; storeItemId: number; quantity: number; subTotal: number; ITEMS_IN_STORE?: { name?: string; price?: number } };
  // Supabase row typing removed (normalized later)

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadAddresses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

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
        .single();

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
          .select('name, price, unit')
          .eq('storeItemId', cartItem.storeItemId)
          .maybeSingle();

        if (itemError) {
          console.error('Error loading item details for checkout:', itemError);
        }

        if (!itemData) {
          // Skip if no item detail
          continue;
        }

        cartItemsWithDetails.push({
          cartItemId: cartItem.cartItemId,
          cartId: cartItem.cartId,
          storeItemId: cartItem.storeItemId,
          quantity: cartItem.quantity,
          subTotal: cartItem.subTotal,
          ITEMS_IN_STORE: itemData
        });
      }

      setCartItems(cartItemsWithDetails);
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
            <IonList>
              {cartItems.map((it: CartItem) => (
                <IonItem key={it.cartItemId}>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.ITEMS_IN_STORE?.name}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{it.quantity} x ₱{it.ITEMS_IN_STORE?.price}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₱{(it.subTotal || 0).toFixed(2)}</div>
                  </div>
                </IonItem>
              ))}
            </IonList>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>Total</div>
              <div style={{ fontWeight: 700 }}>₱{getTotal().toFixed(2)}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" color="primary" style={{ marginTop: 16 }}>
          Place Order
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Checkout;
