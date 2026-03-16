import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { createEWalletSource, waitForSourceChargeable, EWalletType } from '../services/paymongoService';
import { Browser } from '@capacitor/browser';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonLoading,
  IonToast
} from '@ionic/react';
import { arrowBackOutline, chevronForwardOutline, chevronUpOutline, walletOutline } from 'ionicons/icons';
import './GroceryCheckout.css';

interface CheckoutItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
}

interface CheckoutLocationState {
  storeName: string;
  storeId: number;
  items: CheckoutItem[];
  availableItems: number;
  totalItems: number;
  total: number;
  savings: number;
}

type PaymentMethod = 'cash' | 'gcash' | 'paymaya';

const GroceryCheckout: React.FC = () => {
  const history = useHistory();
  const location = useLocation<CheckoutLocationState>();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [showEWalletOptions, setShowEWalletOptions] = useState(false);
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const {
    storeName = 'Store',
    storeId = 0,
    items = [],
    availableItems = 0,
    totalItems = 0,
    total = 0,
    savings = 0
  } = location.state || {};

  const handleBack = () => {
    history.goBack();
  };

  const handlePlaceOrder = async () => {
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to place an order');
        return;
      }

      // Get public userId
      const { data: userData, error: userError } = await supabase
        .from('USER')
        .select('userId, firstname, lastname, email')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        alert('Error placing order. Please try again.');
        return;
      }

      const publicUserId = userData.userId;
      // Use firstname and lastname if available, otherwise use email
      const customerName = (userData.firstname && userData.lastname) 
        ? `${userData.firstname} ${userData.lastname}`.trim()
        : userData.email || 'Customer';

      // Generate order number (format: ORD-YYYYMMDD-XXXXX)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const orderNumber = `ORD-${dateStr}-${randomNum}`;

      // Create order in ORDERS table
      const { data: orderData, error: orderError } = await supabase
        .from('ORDERS')
        .insert({
          userId: publicUserId,
          storeId: storeId,
          orderNumber: orderNumber,
          status: 'pending',
          paymentMethod: selectedPayment === 'cash' ? 'Cash on Pickup' : selectedPayment.toUpperCase(),
          total: total,
          savings: savings,
          itemsCount: availableItems,
          totalItems: totalItems
        })
        .select('orderId')
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        alert('Error placing order. Please try again.');
        return;
      }

      const orderId = orderData.orderId;

      // Insert order items into ORDER_ITEMS table
      console.log('Items being ordered:', items);
      const orderItems = items.map(item => ({
        orderId: orderId,
        storeItemId: item.id,
        quantity: item.quantity || 1,
        price: item.price,
        subTotal: (item.quantity || 1) * item.price
      }));
      console.log('Order items to insert:', orderItems);

      const { error: itemsError } = await supabase
        .from('ORDER_ITEMS')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        alert('Error placing order. Please try again.');
        return;
      }

      // Get store owner's userId to create notification
      const { data: storeData, error: storeError } = await supabase
        .from('GROCERY_STORE')
        .select('owner_id')
        .eq('storeId', storeId)
        .single();

      if (storeError || !storeData) {
        console.error('Error getting store data:', storeError);
      } else {
        // Get store owner's public userId
        const { data: ownerData } = await supabase
          .from('USER')
          .select('userId')
          .eq('auth_user_id', storeData.owner_id)
          .single();

        if (ownerData) {
          // Create notification for store owner
          await supabase
            .from('NOTIFICATIONS')
            .insert({
              userId: ownerData.userId,
              orderId: orderId,
              customerName: customerName,
              orderNumber: orderNumber,
              paymentMethod: selectedPayment === 'cash' ? 'Cash on Pickup' : selectedPayment.toUpperCase(),
              total: total,
              status: 'pending'
            });
        }
      }

      // Navigate to order confirmation page
      if (selectedPayment === 'cash') {
        history.push('/order-confirmation', {
          storeName,
          storeLocation: 'Tubod, Iligan City',
          paymentMethod: 'Cash on Pickup',
          itemsCount: availableItems,
          totalItems,
          total,
          savings,
          orderNumber,
          orderId
        });
      } else {
        // E-wallet payment via PayMongo
        await processEWalletPayment(
          selectedPayment as EWalletType,
          orderId,
          orderNumber,
          publicUserId,
          customerName
        );
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const processEWalletPayment = async (
    paymentType: EWalletType,
    orderId: number,
    orderNumber: string,
    _userId: string,
    _customerName: string,
  ) => {
    try {
      setProcessingMessage('Creating payment link...');
      setIsProcessing(true);

      // 1. Create PayMongo source (public key, safe client-side)
      const source = await createEWalletSource(paymentType, total, orderId, orderNumber);

      // 2. Open GCash/Maya checkout in the in-app browser
      setProcessingMessage(
        `Waiting for ${paymentType === 'gcash' ? 'GCash' : 'Maya'} payment...`
      );
      await Browser.open({ url: source.checkoutUrl });

      // 3. Poll PayMongo until source is chargeable (user pays) or times out
      const result = await waitForSourceChargeable(
        source.sourceId,
        (status) => {
          if (status === 'chargeable') setProcessingMessage('Payment received! Finalizing...');
        },
        5 * 60 * 1000
      );

      await Browser.close?.()?.catch(() => {});

      if (result !== 'chargeable') {
        setIsProcessing(false);
        setToastMessage(
          result === 'timeout'
            ? 'Payment timed out. Please try again.'
            : 'Payment was cancelled or failed.'
        );
        setShowToast(true);
        // Revert order status to cancelled
        await supabase.from('ORDERS').update({ status: 'cancelled' }).eq('orderId', orderId);
        return;
      }

      // 4. Charge the source via Supabase Edge Function (uses secret key server-side)
      setProcessingMessage('Finalizing payment...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jugtklulvvpcpfsrdxom.supabase.co';
      const chargeRes = await fetch(
        `${supabaseUrl}/functions/v1/charge-paymongo-source`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: source.sourceId,
            orderId,
            amount: Math.round(total * 100), // centavos
          }),
        }
      );

      const chargeData = await chargeRes.json();
      setIsProcessing(false);

      if (!chargeData.success) {
        setToastMessage(`Payment error: ${chargeData.error || 'Unknown error'}`);
        setShowToast(true);
        return;
      }

      // 5. Navigate to order confirmation
      history.push('/order-confirmation', {
        storeName,
        storeLocation: 'Tubod, Iligan City',
        paymentMethod: paymentType === 'gcash' ? 'GCash' : 'Maya',
        itemsCount: availableItems,
        totalItems,
        total,
        savings,
        orderNumber,
        orderId,
      });

    } catch (err) {
      console.error('E-wallet payment error:', err);
      setIsProcessing(false);
      setToastMessage('An error occurred during payment. Please try again.');
      setShowToast(true);
    }
  };

  const handlePaymentChange = (method: PaymentMethod) => {
    setSelectedPayment(method);
    // Auto-expand E-Wallet options when GCash or PayMaya is selected
    if (method === 'gcash' || method === 'paymaya') {
      setShowEWalletOptions(true);
    } else if (method === 'cash') {
      setShowEWalletOptions(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Check Out</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="checkout-container">
          {/* Store Summary */}
          <div className="store-summary-card">
            <div 
              className="store-summary-header"
              onClick={() => setShowItemBreakdown(!showItemBreakdown)}
              style={{ cursor: 'pointer' }}
            >
              <IonIcon icon={walletOutline} className="cart-icon" />
              <div className="store-summary-info">
                <h3>{storeName}</h3>
                <p className="availability-info">Available: {availableItems} of {totalItems} items</p>
                <p className="savings-info">Saved: ₱{savings.toFixed(2)}</p>
              </div>
              <IonIcon 
                icon={showItemBreakdown ? chevronUpOutline : chevronForwardOutline} 
                className="chevron-icon" 
              />
            </div>
            
            {/* Item Breakdown - Expandable */}
            {showItemBreakdown && items.length > 0 && (
              <div className="item-breakdown">
                <IonList>
                  {items.map((item) => (
                    <IonItem key={item.id} lines="none" className="breakdown-item">
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-quantity-price">
                          {item.quantity || 1} x ₱{item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="item-subtotal">
                        ₱{((item.quantity || 1) * item.price).toFixed(2)}
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
            
            <div className="store-summary-total">
              <span className="total-label">TOTAL:</span>
              <span className="total-amount">₱{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="payment-section">
            <div className="section-header">
              <h3>Payment Method</h3>
              <IonIcon icon={chevronForwardOutline} className="section-chevron" />
            </div>

            <IonList className="payment-list">
              <IonRadioGroup 
                value={selectedPayment} 
                onIonChange={(e) => handlePaymentChange(e.detail.value as PaymentMethod)}
              >
                {/* Cash on Pickup */}
                <IonItem lines="none" className="payment-item">
                  <div className="payment-icon" slot="start">💵</div>
                  <IonLabel>Cash on Pickup</IonLabel>
                  <IonRadio slot="end" value="cash" />
                </IonItem>

                {/* E-Wallet Parent Option - Just a toggle, not a radio option */}
                <IonItem 
                  lines="none" 
                  className="payment-item"
                  button
                  onClick={() => {
                    setShowEWalletOptions(!showEWalletOptions);
                    if (!showEWalletOptions && selectedPayment === 'cash') {
                      setSelectedPayment('gcash');
                    }
                  }}
                >
                  <div className="payment-icon" slot="start">👛</div>
                  <IonLabel>E-Wallet</IonLabel>
                  <IonIcon 
                    icon={chevronForwardOutline} 
                    slot="end" 
                    style={{ 
                      transform: showEWalletOptions ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </IonItem>

                {/* E-Wallet Options - Always in DOM but visibility controlled by CSS */}
                <div 
                  className="ewallet-options"
                  style={{ 
                    display: showEWalletOptions ? 'block' : 'none',
                    overflow: 'hidden'
                  }}
                >
                  <IonItem lines="none" className="payment-sub-item">
                    <div className="payment-sub-icon" slot="start">
                      <div className="gcash-icon">G</div>
                    </div>
                    <IonLabel>GCash</IonLabel>
                    <IonRadio slot="end" value="gcash" />
                  </IonItem>

                  <IonItem lines="none" className="payment-sub-item">
                    <div className="payment-sub-icon" slot="start">
                      <div className="paymaya-icon">P</div>
                    </div>
                    <IonLabel>PayMaya</IonLabel>
                    <IonRadio slot="end" value="paymaya" />
                  </IonItem>
                </div>
              </IonRadioGroup>
            </IonList>
          </div>
        </div>

        {/* Footer with Order Summary and Place Order Button */}
        <div className="checkout-footer">
          <div className="footer-summary">
            <div className="footer-availability">
              Available: <strong>{availableItems} of {totalItems} items</strong>
            </div>
            <div className="footer-savings">
              Saved based on SRP: <span className="savings-amount">₱{savings.toFixed(2)}</span>
            </div>
            <div className="footer-total">
              Total: <strong>₱{total.toFixed(2)}</strong>
            </div>
          </div>
          <IonButton 
            color="primary" 
            className="place-order-button"
            onClick={handlePlaceOrder}
            expand="block"
          >
            Place Order
          </IonButton>
        </div>
      </IonContent>

      <IonLoading
        isOpen={isProcessing}
        message={processingMessage}
        backdropDismiss={false}
      />
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={4000}
        color="danger"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default GroceryCheckout;
