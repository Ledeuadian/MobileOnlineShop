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
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonBadge,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner
} from '@ionic/react';
import { 
  arrowBackOutline, 
  cartOutline, 
  personOutline, 
  addOutline,
  storefrontOutline,
  checkmarkOutline,
  chevronDownOutline
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
}

const GroceryList: React.FC = () => {
  const history = useHistory();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [newItemMeasurement, setNewItemMeasurement] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredItems = groceryItems.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.variant?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.unit?.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleItemCheck = (id: number) => {
    setGroceryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
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

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    // Reset form fields
    setNewItemName('');
    setNewItemBrand('');
    setNewItemSize('');
    setNewItemMeasurement('');
  };

  const addNewItem = async () => {
    if (newItemName.trim()) {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          return;
        }

        // Get user's store ID
        const { data: store, error: storeError } = await supabase
          .from('GROCERY_STORE')
          .select('storeId')
          .eq('owner_id', user.id)
          .single();

        if (storeError || !store) {
          console.error('Store not found for user:', storeError);
          return;
        }

        // Insert item into ITEMS_IN_STORE table
        const { data: insertedItem, error: insertError } = await supabase
          .from('ITEMS_IN_STORE')
          .insert({
            storeId: store.storeId,
            name: newItemName.trim(),
            item_name: newItemName.trim(),
            brand: newItemBrand.trim() || null,
            item_quantity: newItemSize ? parseInt(newItemSize) : 0,
            item_description: newItemSize && newItemMeasurement ? `${newItemSize}${newItemMeasurement}` : null,
            availability: 1
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting item:', insertError);
          return;
        }

        // Add to local grocery list
        const newItem: GroceryItem = {
          id: insertedItem.storeItemId,
          name: newItemName.trim(),
          brand: newItemBrand.trim() || undefined,
          quantity: newItemSize && newItemMeasurement ? `${newItemSize}${newItemMeasurement}` : undefined,
          checked: false
        };
        
        setGroceryItems(prevItems => [...prevItems, newItem]);
        closeAddModal();
      } catch (error) {
        console.error('Error adding new item:', error);
      }
    }
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
            <p className="item-count">{groceryItems.length} grocery items</p>
          </div>

          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search grocery list"
            showClearButton="focus"
            className="grocery-search"
          />

          {/* Grocery Items List */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <IonList className="grocery-items-list">
              {filteredItems.map((item) => (
                <IonItem 
                  key={item.id} 
                  className={`grocery-item ${item.checked ? 'checked' : ''}`}
                  lines="none"
                >
                  <div className="item-content">
                    <div className="item-details">
                      <h3 className="item-name">{item.name}</h3>
                      <div className="item-info">
                        {item.brand && <span className="item-brand">{item.brand}</span>}
                        {item.variant && <span className="item-variant">{item.variant}</span>}
                        {item.unit && <span className="item-unit">{item.unit}</span>}
                        {item.quantity && <span className="item-quantity">{item.quantity}</span>}
                      </div>
                    </div>
                    <IonCheckbox
                      checked={item.checked}
                      onIonChange={() => toggleItemCheck(item.id)}
                      slot="end"
                      className="item-checkbox"
                    />
                  </div>
                </IonItem>
              ))}
              {!loading && filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  {searchText ? 'No items found matching your search' : 'No grocery items available'}
                </div>
              )}
            </IonList>
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
          <button className="nav-btn" onClick={navigateToProfile}>
            <IonIcon icon={personOutline} className="nav-icon" />
          </button>
        </div>

        {/* Add New Item FAB */}
        <IonFab vertical="bottom" horizontal="center" slot="fixed" className="add-fab">
          <IonFabButton color="primary" onClick={openAddModal}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Add New Item Modal */}
        <IonModal isOpen={showAddModal} onDidDismiss={closeAddModal}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton fill="clear" onClick={closeAddModal}>
                  <IonIcon icon={arrowBackOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Add new item</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={addNewItem}>
                  <IonIcon icon={checkmarkOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="add-item-form">
              {/* Grocery Name Field */}
              <div className="form-field">
                <IonInput
                  value={newItemName}
                  onIonInput={(e) => setNewItemName(e.detail.value!)}
                  placeholder="grocery name"
                  className="form-input"
                />
              </div>

              {/* Brand Name Field */}
              <div className="form-field">
                <IonInput
                  value={newItemBrand}
                  onIonInput={(e) => setNewItemBrand(e.detail.value!)}
                  placeholder="brand name"
                  className="form-input"
                />
              </div>

              {/* Size and Measurement Fields */}
              <div className="form-row">
                <div className="form-field size-field">
                  <IonInput
                    value={newItemSize}
                    onIonInput={(e) => setNewItemSize(e.detail.value!)}
                    placeholder="Qty"
                    className="form-input"
                  />
                </div>
                <div className="form-field measurement-field">
                  <IonSelect
                    value={newItemMeasurement}
                    onIonChange={(e) => setNewItemMeasurement(e.detail.value)}
                    placeholder="unit"
                    interface="popover"
                    className="form-select"
                  >
                    <IonSelectOption value="g">g (grams)</IonSelectOption>
                    <IonSelectOption value="kg">kg (kilograms)</IonSelectOption>
                    <IonSelectOption value="ml">ml (milliliters)</IonSelectOption>
                    <IonSelectOption value="L">L (liters)</IonSelectOption>
                    <IonSelectOption value="pcs">pcs (pieces)</IonSelectOption>
                    <IonSelectOption value="pack">pack</IonSelectOption>
                    <IonSelectOption value="bottle">bottle</IonSelectOption>
                    <IonSelectOption value="box">box</IonSelectOption>
                  </IonSelect>
                  <IonIcon icon={chevronDownOutline} className="select-arrow" />
                </div>
              </div>

              {/* Add Button */}
              <div className="form-button-container">
                <IonButton 
                  expand="block" 
                  onClick={addNewItem}
                  className="add-button"
                  disabled={!newItemName.trim()}
                >
                  Add
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default GroceryList;
