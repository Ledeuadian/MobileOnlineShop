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
  IonAlert,
  IonProgressBar,
  IonIcon
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
  store_id?: number;
  storeId?: number;
  id?: number;
  name: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_image_url: string;
}

interface StockItem {
  storeItemId?: number;
  name: string;
  description: string;
  price: number;
  availability: number;
  category: string;
  unit?: string;
  brand?: string;
  item_image_url?: string;
  storeId: number;
}

const StoreDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: '',
    store_description: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_image_url: ''
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newItem, setNewItem] = useState<StockItem>({
    name: '',
    description: '',
    price: 0,
    availability: 0,
    category: '',
    unit: '',
    brand: '',
    storeId: 0
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Item image upload states
  const [selectedItemImage, setSelectedItemImage] = useState<File | null>(null);
  const [itemUploadProgress, setItemUploadProgress] = useState(0);
  const [isItemUploading, setIsItemUploading] = useState(false);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
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
        // Map database column names to frontend field names
        const mappedData = {
          ...data,
          store_address: data.location // Map location to store_address
        };
        setStoreInfo(mappedData);
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
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (storeData) {
        const currentStoreId = storeData.store_id || storeData.storeId || storeData.id;
        
        const { data: items, error } = await supabase
          .from('ITEMS_IN_STORE')
          .select('*')
          .eq('storeId', currentStoreId);

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

      // Map the frontend fields to database column names
      const storeData = {
        storeId: storeInfo.store_id || storeInfo.storeId,
        name: storeInfo.name,
        store_description: storeInfo.store_description,
        location: storeInfo.store_address, // Map store_address to location
        store_phone: storeInfo.store_phone,
        store_email: storeInfo.store_email,
        store_image_url: storeInfo.store_image_url,
        owner_id: currentUser.id,
        updated_at: new Date().toISOString()
      };

      // Use upsert to either insert or update based on storeId
      const result = await supabase
        .from('GROCERY_STORE')
        .upsert(storeData, { 
          onConflict: 'storeId',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      // Update local state with the result
      if (result.data) {
        // Map database column names back to frontend field names
        const mappedData = {
          ...result.data,
          store_address: result.data.location // Map location back to store_address
        };
        setStoreInfo(mappedData);
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAlertMessage('Please select a valid image file');
        setShowAlert(true);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage('Image size must be less than 5MB');
        setShowAlert(true);
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToSupabase = async (): Promise<string | null> => {
    if (!selectedImage || !currentUser) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Verify user session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Create unique filename (simplified - no folders)
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `store-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage with explicit options
      const { error } = await supabase.storage
        .from('Images')
        .upload(fileName, selectedImage, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting
          contentType: selectedImage.type
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);
      
      setUploadProgress(100);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Bucket not found')) {
          setAlertMessage('Storage bucket not found. Please create an "Images" bucket in Supabase Storage with public access.');
        } else if (error.message.includes('row-level security policy')) {
          setAlertMessage('Permission denied: Please ensure storage policies allow authenticated users to upload images.');
        } else if (error.message.includes('not authenticated')) {
          setAlertMessage('Authentication required: Please log in again to upload images.');
        } else {
          setAlertMessage(`Error uploading image: ${error.message}`);
        }
      } else {
        setAlertMessage('Unknown error occurred while uploading image.');
      }
      
      setShowAlert(true);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const ensureStorageBucket = async () => {
    try {
      // Try to get bucket info
      const { error } = await supabase.storage.getBucket('Images');
      
      if (error && error instanceof Error && error.message?.includes('not found')) {
        // Create bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket('Images', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        }
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    // Ensure bucket exists before upload
    await ensureStorageBucket();
    
    const imageUrl = await uploadImageToSupabase();
    if (imageUrl) {
      setStoreInfo({...storeInfo, store_image_url: imageUrl});
      setSelectedImage(null);
      setImagePreview(null);
      setAlertMessage('Image uploaded successfully!');
      setShowAlert(true);
    }
  };

  // Item image upload functions
  const handleItemImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAlertMessage('Please select a valid image file');
        setShowAlert(true);
        // Reset the input
        event.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage('Image size must be less than 5MB');
        setShowAlert(true);
        // Reset the input
        event.target.value = '';
        return;
      }
      
      setSelectedItemImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setItemImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // File was deselected
      setSelectedItemImage(null);
      // Only clear preview if we're not editing an item with existing image
      if (!editingItem?.item_image_url) {
        setItemImagePreview(null);
      } else {
        // Restore existing image preview
        setItemImagePreview(editingItem.item_image_url);
      }
    }
  };

  const uploadItemImageToSupabase = async (): Promise<string | null> => {
    if (!selectedItemImage || !currentUser) return null;
    
    setIsItemUploading(true);
    setItemUploadProgress(0);
    
    try {
      // Verify user session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Create unique filename for item
      const fileExt = selectedItemImage.name.split('.').pop();
      const fileName = `item-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage with explicit options
      const { error } = await supabase.storage
        .from('Images')
        .upload(fileName, selectedItemImage, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting
          contentType: selectedItemImage.type
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);
      
      setItemUploadProgress(100);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading item image:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Bucket not found')) {
          setAlertMessage('Storage bucket not found. Please create an "Images" bucket in Supabase Storage with public access.');
        } else if (error.message.includes('row-level security policy')) {
          setAlertMessage('Permission denied: Please ensure storage policies allow authenticated users to upload images.');
        } else if (error.message.includes('not authenticated')) {
          setAlertMessage('Authentication required: Please log in again to upload images.');
        } else {
          setAlertMessage(`Error uploading item image: ${error.message}`);
        }
      } else {
        setAlertMessage('Unknown error occurred while uploading item image.');
      }
      
      setShowAlert(true);
      return null;
    } finally {
      setIsItemUploading(false);
    }
  };

  const handleItemImageUpload = async () => {
    if (!selectedItemImage) return;
    
    // Ensure bucket exists before upload
    await ensureStorageBucket();
    
    const imageUrl = await uploadItemImageToSupabase();
    if (imageUrl) {
      // Update both the editing item and new item states
      if (editingItem) {
        setEditingItem({...editingItem, item_image_url: imageUrl});
        setNewItem({...newItem, item_image_url: imageUrl}); // Also update newItem for saving
      } else {
        setNewItem({...newItem, item_image_url: imageUrl});
      }
      // Clear the selected file but keep the preview showing the uploaded image
      setSelectedItemImage(null);
      setItemImagePreview(imageUrl); // Show the uploaded image
      setAlertMessage('Item image uploaded successfully!');
      setShowAlert(true);
    }
  };

  const saveStockItem = async () => {
    try {
      console.log('🧪 Checking store info:', storeInfo);
      console.log('� Store info keys:', Object.keys(storeInfo));
      
      // Check for store ID using multiple possible column names
      const storeId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      console.log('� Found store ID:', storeId);
      
      if (!storeId) {
        console.log('❌ No store ID found');
        setAlertMessage('Please save store information first');
        setShowAlert(true);
        return;
      }

      const currentStoreId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      const itemData = {
        ...newItem,
        storeId: currentStoreId,
        updated_at: new Date().toISOString()
      };

      console.log('🖼️ Item data being saved:', itemData);
      console.log('📸 Image URL in data:', itemData.item_image_url);

      let result;
      if (editingItem) {
        // Update existing item
        console.log('🔄 Updating existing item with ID:', editingItem.storeItemId);
        result = await supabase
          .from('ITEMS_IN_STORE')
          .update(itemData)
          .eq('storeItemId', editingItem.storeItemId);
      } else {
        // Create new item
        console.log('➕ Creating new item');
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
      const resetStoreId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      setNewItem({
        name: '',
        description: '',
        price: 0,
        availability: 0,
        category: '',
        unit: '',
        brand: '',
        storeId: resetStoreId || 0
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
        .eq('storeItemId', itemId);

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
    // Reset item image states but show existing image if available
    setSelectedItemImage(null);
    setItemImagePreview(item.item_image_url || null); // Show existing image as preview
    setIsItemUploading(false);
    setItemUploadProgress(0);
    setIsItemModalOpen(true);
  };

  const openAddItem = () => {
    setEditingItem(null);
    const addItemStoreId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
    setNewItem({
      name: '',
      description: '',
      price: 0,
      availability: 0,
      category: '',
      unit: '',
      brand: '',
      storeId: addItemStoreId || 0
    });
    // Reset item image states
    setSelectedItemImage(null);
    setItemImagePreview(null);
    setIsItemUploading(false);
    setItemUploadProgress(0);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    // Reset item image states
    setSelectedItemImage(null);
    setItemImagePreview(null);
    setIsItemUploading(false);
    setItemUploadProgress(0);
    // Clear the file input
    const fileInput = document.getElementById('item-image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
                    <h3>{storeInfo.name || 'Not Set'}</h3>
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
              <p>{storeInfo.name || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <p>{storeInfo.store_description || 'Not set'}</p>
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
            <IonItem>
              <IonLabel position="stacked">Store Image</IonLabel>
              {storeInfo.store_image_url ? (
                <div style={{ width: '100%', padding: '10px 0' }}>
                  <img 
                    src={storeInfo.store_image_url} 
                    alt="Store" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '200px', 
                      height: '120px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }} 
                  />
                </div>
              ) : (
                <p>No image uploaded</p>
              )}
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
                <div className="item-image-preview">
                  {item.item_image_url ? (
                    <img 
                      src={item.item_image_url} 
                      alt={item.name}
                      className="stock-item-image"
                    />
                  ) : (
                    <div className="stock-item-placeholder">
                      <IonIcon icon={cube} />
                    </div>
                  )}
                </div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="item-details">
                    <span className="price">₱{item.price} / {item.unit || 'pcs'}</span>
                    <span className="quantity">Qty: {item.availability} {item.unit || 'pcs'}</span>
                    <span className="category">{item.category}</span>
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
                  value={storeInfo.name}
                  onIonInput={(e) => setStoreInfo({...storeInfo, name: e.detail.value!})}
                  placeholder="Enter store name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={storeInfo.store_description}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_description: e.detail.value!})}
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
              <IonItem>
                <IonLabel position="stacked">Store Image</IonLabel>
                <div style={{ width: '100%', padding: '10px 0' }}>
                  {/* Current Image Preview */}
                  {(storeInfo.store_image_url || imagePreview) && (
                    <div style={{ marginBottom: '10px' }}>
                      <img 
                        src={imagePreview || storeInfo.store_image_url} 
                        alt="Store preview" 
                        style={{ 
                          width: '100%', 
                          maxWidth: '200px', 
                          height: '150px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }} 
                      />
                    </div>
                  )}
                  
                  {/* File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  />
                  
                  {/* Upload Progress */}
                  {isUploading && (
                    <div style={{ marginBottom: '10px' }}>
                      <IonProgressBar value={uploadProgress / 100}></IonProgressBar>
                      <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '12px' }}>
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {selectedImage && !isUploading && (
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={handleImageUpload}
                      style={{ marginTop: '10px' }}
                    >
                      Upload Image
                    </IonButton>
                  )}
                  
                  {/* Current URL Display */}
                  {storeInfo.store_image_url && (
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginTop: '10px',
                      wordBreak: 'break-all'
                    }}>
                      Current: {storeInfo.store_image_url}
                    </p>
                  )}
                </div>
              </IonItem>
              <IonButton expand="block" onClick={saveStoreInfo} className="save-button">
                <IonIcon icon={save} slot="start" />
                Save Store Information
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Stock Item Modal */}
        <IonModal isOpen={isItemModalOpen} onDidDismiss={closeItemModal}>
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
                  value={newItem.name}
                  onIonInput={(e) => setNewItem({...newItem, name: e.detail.value!})}
                  placeholder="Enter item name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={newItem.description}
                  onIonInput={(e) => setNewItem({...newItem, description: e.detail.value!})}
                  placeholder="Enter item description"
                  rows={3}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Brand Name</IonLabel>
                <IonInput
                  value={newItem.brand}
                  onIonInput={(e) => setNewItem({...newItem, brand: e.detail.value!})}
                  placeholder="Enter brand name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Category</IonLabel>
                <IonSelect
                  value={newItem.category}
                  onIonChange={(e) => setNewItem({...newItem, category: e.detail.value})}
                  placeholder="Select category"
                  interface="popover"
                  fill="outline"
                >
                  {categories.map((category) => (
                    <IonSelectOption key={category} value={category}>
                      {category}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Price (₱)</IonLabel>
                <IonInput
                  type="number"
                  value={newItem.price}
                  onIonInput={(e) => setNewItem({...newItem, price: parseFloat(e.detail.value!) || 0})}
                  placeholder="Enter price"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonSelect
                  value={newItem.unit}
                  onIonChange={(e) => setNewItem({...newItem, unit: e.detail.value})}
                  placeholder="Select unit"
                  interface="popover"
                  fill="outline"
                >
                  <IonSelectOption value="kg">KG</IonSelectOption>
                  <IonSelectOption value="pcs">Pcs</IonSelectOption>
                  <IonSelectOption value="liter">Liter</IonSelectOption>
                  <IonSelectOption value="pack">Pack</IonSelectOption>
                  <IonSelectOption value="grams">g(grams)</IonSelectOption>
                  <IonSelectOption value="bottle">bottle</IonSelectOption>
                  <IonSelectOption value="milliliters">ml</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Quantity</IonLabel>
                <IonInput
                  type="number"
                  value={newItem.availability}
                  onIonInput={(e) => setNewItem({...newItem, availability: parseInt(e.detail.value!) || 0})}
                  placeholder="Enter quantity"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Item Image</IonLabel>
                <div style={{ width: '100%', padding: '10px 0' }}>
                  {/* File Input */}
                  <input
                    id="item-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleItemImageSelect}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  />
                  
                  {/* Image Preview - Show existing image or new selection */}
                  {itemImagePreview && (
                    <div style={{ marginBottom: '10px' }}>
                      <img 
                        src={itemImagePreview} 
                        alt="Item preview" 
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: '120px',
                          objectFit: 'cover',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          display: 'block',
                          margin: '0 auto'
                        }}
                      />
                      {/* Show if this is existing image or new selection */}
                      <p style={{ 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        color: '#666', 
                        marginTop: '5px' 
                      }}>
                        {selectedItemImage ? 'New image selected' : 'Current image'}
                      </p>
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {isItemUploading && (
                    <div style={{ marginBottom: '10px' }}>
                      <IonProgressBar value={itemUploadProgress / 100}></IonProgressBar>
                      <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '12px' }}>
                        Uploading... {itemUploadProgress}%
                      </p>
                    </div>
                  )}
                  
                  {/* Upload Button - Show when new image is selected */}
                  {selectedItemImage && !isItemUploading && (
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={handleItemImageUpload}
                      style={{ marginBottom: '10px' }}
                    >
                      Upload New Image
                    </IonButton>
                  )}
                  
                  {/* Remove Image Button - Show when editing and image exists */}
                  {editingItem && itemImagePreview && !selectedItemImage && (
                    <IonButton 
                      expand="block" 
                      fill="clear" 
                      color="danger"
                      onClick={() => {
                        setItemImagePreview(null);
                        setEditingItem({...editingItem, item_image_url: ''});
                        setNewItem({...newItem, item_image_url: ''});
                      }}
                      style={{ marginBottom: '10px' }}
                    >
                      Remove Current Image
                    </IonButton>
                  )}
                </div>
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
