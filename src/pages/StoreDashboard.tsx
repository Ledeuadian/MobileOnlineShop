import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonIcon,
  IonButton,
  IonList,
  IonInput,
  IonTextarea,
  IonModal,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonAlert
} from '@ionic/react';
import {
  storefront,
  statsChart,
  add,
  create,
  trash,
  save,
  close,
  cube,
  logOutOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import './StoreDashboard.css';

interface StoreInfo {
  storeId?: number;
  storeName: string;
  storeDescription: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_image_url?: string;
}

interface StockItem {
  storeItemId?: number;
  item_name: string;
  item_description: string;
  item_price: number;
  item_quantity: number;
  item_category: string;
  item_image_url?: string;
  storeId: number;
}

const StoreDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: '',
    storeDescription: '',
    store_address: '',
    store_phone: '',
    store_email: ''
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newItem, setNewItem] = useState<StockItem>({
    item_name: '',
    item_description: '',
    item_price: 0,
    item_quantity: 0,
    item_category: '',
    storeId: 0
  });
  const [currentUser, setCurrentUser] = useState<{id: string; email?: string} | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Categories for items
  const categories = [
    'Fruits & Vegetables',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Bakery',
    'Pantry',
    'Beverages',
    'Snacks',
    'Frozen Foods',
    'Health & Beauty',
    'Household Items'
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          await loadStoreInfo(user.id);
          await loadStockItems(user.id);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  const loadStoreInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('GROCERY_STORE')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading store info:', error);
        return;
      }

      if (data) {
        setStoreInfo(data);
      }
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  const loadStockItems = async (userId: string) => {
    try {
      // First get the store ID
      const { data: storeData } = await supabase
        .from('GROCERY_STORE')
        .select('storeId')
        .eq('owner_id', userId)
        .single();

      if (storeData) {
        const { data: items, error } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .eq('storeId', storeData.storeId);

        if (error) {
          console.error('Error loading stock items:', error);
          return;
        }

        setStockItems(items || []);
      }
    } catch (error) {
      console.error('Error loading stock items:', error);
    }
  };

  const saveStoreInfo = async () => {
    try {
      if (!currentUser) return;

      const storeData = {
        ...storeInfo,
        owner_id: currentUser.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (storeInfo.storeId) {
        // Update existing store
        result = await supabase
          .from('GROCERY_STORE')
          .update(storeData)
          .eq('storeId', storeInfo.storeId);
      } else {
        // Create new store
        result = await supabase
          .from('GROCERY_STORE')
          .insert([storeData])
          .select()
          .single();
        
        if (result.data) {
          setStoreInfo(result.data);
        }
      }

      if (result.error) {
        throw result.error;
      }

      setAlertMessage('Store information saved successfully!');
      setShowAlert(true);
      setIsStoreModalOpen(false);
    } catch (error) {
      console.error('Error saving store info:', error);
      setAlertMessage('Error saving store information');
      setShowAlert(true);
    }
  };

  const saveStockItem = async () => {
    try {
      if (!storeInfo.storeId) {
        setAlertMessage('Please save store information first');
        setShowAlert(true);
        return;
      }

      const itemData = {
        ...newItem,
        storeId: storeInfo.storeId,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingItem) {
        // Update existing item
        result = await supabase
          .from('ITEMS_IN_STORE')
          .update(itemData)
          .eq('storeItemId', editingItem.storeItemId);
      } else {
        // Create new item
        result = await supabase
          .from('ITEMS_IN_STORE')
          .insert([itemData]);
      }

      if (result.error) {
        throw result.error;
      }

      setAlertMessage(`Item ${editingItem ? 'updated' : 'added'} successfully!`);
      setShowAlert(true);
      setIsItemModalOpen(false);
      setEditingItem(null);
      setNewItem({
        item_name: '',
        item_description: '',
        item_price: 0,
        item_quantity: 0,
        item_category: '',
        storeId: storeInfo.storeId || 0
      });
      
      if (currentUser) {
        await loadStockItems(currentUser.id);
      }
    } catch (error) {
      console.error('Error saving stock item:', error);
      setAlertMessage('Error saving item');
      setShowAlert(true);
    }
  };

  const deleteStockItem = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('ITEMS_IN_STORE')
        .delete()
        .eq('itemId', itemId);

      if (error) {
        throw error;
      }

      setAlertMessage('Item deleted successfully!');
      setShowAlert(true);
      if (currentUser) {
        await loadStockItems(currentUser.id);
      }
    } catch (error) {
      console.error('Error deleting stock item:', error);
      setAlertMessage('Error deleting item');
      setShowAlert(true);
    }
  };

  const openEditItem = (item: StockItem) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsItemModalOpen(true);
  };

  const openAddItem = () => {
    setEditingItem(null);
    setNewItem({
      item_name: '',
      item_description: '',
      item_price: 0,
      item_quantity: 0,
      item_category: '',
      storeId: storeInfo.storeId || 0
    });
    setIsItemModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Store Overview</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="stats-item">
                  <IonIcon icon={storefront} />
                  <div>
                    <h3>{storeInfo.storeName || 'Not Set'}</h3>
                    <p>Store Name</p>
                  </div>
                </div>
                <div className="stats-item">
                  <IonIcon icon={cube} />
                  <div>
                    <h3>{stockItems.length}</h3>
                    <p>Total Items</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Quick Actions</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={() => setIsStoreModalOpen(true)}
                  className="action-button"
                >
                  <IonIcon icon={storefront} slot="start" />
                  Update Store Info
                </IonButton>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={openAddItem}
                  className="action-button"
                >
                  <IonIcon icon={add} slot="start" />
                  Add New Item
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );

  const renderStoreInfo = () => (
    <div className="store-info-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Store Information</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="store-details">
            <IonItem>
              <IonLabel position="stacked">Store Name</IonLabel>
              <p>{storeInfo.storeName || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <p>{storeInfo.storeDescription || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Address</IonLabel>
              <p>{storeInfo.store_address || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Phone</IonLabel>
              <p>{storeInfo.store_phone || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <p>{storeInfo.store_email || 'Not set'}</p>
            </IonItem>
            <IonButton 
              expand="block" 
              onClick={() => setIsStoreModalOpen(true)}
              className="update-button"
            >
              <IonIcon icon={create} slot="start" />
              Update Store Information
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderStock = () => (
    <div className="stock-content">
      <IonButton 
        expand="block" 
        onClick={openAddItem}
        className="add-item-button"
      >
        <IonIcon icon={add} slot="start" />
        Add New Item
      </IonButton>
      
      <IonList>
        {stockItems.map((item) => (
          <IonCard key={item.storeItemId}>
            <IonCardContent>
              <div className="stock-item">
                <div className="item-info">
                  <h3>{item.item_name}</h3>
                  <p>{item.item_description}</p>
                  <div className="item-details">
                    <span className="price">${item.item_price}</span>
                    <span className="quantity">Qty: {item.item_quantity}</span>
                    <span className="category">{item.item_category}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <IonButton 
                    fill="clear" 
                    onClick={() => openEditItem(item)}
                  >
                    <IonIcon icon={create} />
                  </IonButton>
                  <IonButton 
                    fill="clear" 
                    color="danger"
                    onClick={() => deleteStockItem(item.storeItemId!)}
                  >
                    <IonIcon icon={trash} />
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </IonList>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Store Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonSegment 
          value={selectedSegment} 
          onIonChange={e => setSelectedSegment(e.detail.value as string)}
        >
          <IonSegmentButton value="dashboard">
            <IonLabel>Dashboard</IonLabel>
            <IonIcon icon={statsChart} />
          </IonSegmentButton>
          <IonSegmentButton value="store">
            <IonLabel>Store Info</IonLabel>
            <IonIcon icon={storefront} />
          </IonSegmentButton>
          <IonSegmentButton value="stock">
            <IonLabel>Stock</IonLabel>
            <IonIcon icon={cube} />
          </IonSegmentButton>
        </IonSegment>

        {selectedSegment === 'dashboard' && renderDashboard()}
        {selectedSegment === 'store' && renderStoreInfo()}
        {selectedSegment === 'stock' && renderStock()}

        {/* Store Info Modal */}
        <IonModal isOpen={isStoreModalOpen} onDidDismiss={() => setIsStoreModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Update Store Information</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsStoreModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="modal-content">
              <IonItem>
                <IonLabel position="stacked">Store Name</IonLabel>
                <IonInput
                  value={storeInfo.storeName}
                  onIonInput={(e) => setStoreInfo({...storeInfo, storeName: e.detail.value!})}
                  placeholder="Enter store name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={storeInfo.storeDescription}
                  onIonInput={(e) => setStoreInfo({...storeInfo, storeDescription: e.detail.value!})}
                  placeholder="Enter store description"
                  rows={3}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Address</IonLabel>
                <IonTextarea
                  value={storeInfo.store_address}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_address: e.detail.value!})}
                  placeholder="Enter store address"
                  rows={2}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Phone</IonLabel>
                <IonInput
                  value={storeInfo.store_phone}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_phone: e.detail.value!})}
                  placeholder="Enter phone number"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={storeInfo.store_email}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_email: e.detail.value!})}
                  placeholder="Enter email address"
                  type="email"
                />
              </IonItem>
              <IonButton expand="block" onClick={saveStoreInfo} className="save-button">
                <IonIcon icon={save} slot="start" />
                Save Store Information
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Stock Item Modal */}
        <IonModal isOpen={isItemModalOpen} onDidDismiss={() => setIsItemModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingItem ? 'Update Item' : 'Add New Item'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsItemModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="modal-content">
              <IonItem>
                <IonLabel position="stacked">Item Name</IonLabel>
                <IonInput
                  value={newItem.item_name}
                  onIonInput={(e) => setNewItem({...newItem, item_name: e.detail.value!})}
                  placeholder="Enter item name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={newItem.item_description}
                  onIonInput={(e) => setNewItem({...newItem, item_description: e.detail.value!})}
                  placeholder="Enter item description"
                  rows={3}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Category</IonLabel>
                <IonSelect
                  value={newItem.item_category}
                  onIonChange={(e) => setNewItem({...newItem, item_category: e.detail.value})}
                  placeholder="Select category"
                >
                  {categories.map((category) => (
                    <IonSelectOption key={category} value={category}>
                      {category}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Price ($)</IonLabel>
                <IonInput
                  type="number"
                  value={newItem.item_price}
                  onIonInput={(e) => setNewItem({...newItem, item_price: parseFloat(e.detail.value!) || 0})}
                  placeholder="Enter price"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Quantity</IonLabel>
                <IonInput
                  type="number"
                  value={newItem.item_quantity}
                  onIonInput={(e) => setNewItem({...newItem, item_quantity: parseInt(e.detail.value!) || 0})}
                  placeholder="Enter quantity"
                />
              </IonItem>
              <IonButton expand="block" onClick={saveStockItem} className="save-button">
                <IonIcon icon={save} slot="start" />
                {editingItem ? 'Update Item' : 'Add Item'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Store Dashboard"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* Logout Button */}
        <div className="store-logout-section">
          <IonButton 
            expand="block" 
            color="danger" 
            fill="clear"
            onClick={handleLogout}
            className="store-logout-btn"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StoreDashboard;
