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
  logOutOutline,
  navigate,
  locationOutline
} from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import { LocationService } from '../services/locationService';
import { ProductTypeMatchingService } from '../services/productTypeMatchingService';
import LocationPicker from '../components/LocationPicker';
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
  latitude?: number;
  longitude?: number;
}

interface StockItem {
  storeItemId?: number;
  name: string;
  description: string;
  price: number;
  availability: number;
  category: string;
  variant?: string;
  unit?: string;
  brand?: string;
  item_image_url?: string;
  storeId: number;
  productTypeId?: number; // Add productTypeId field
}

interface ProductTypeSuggestion {
  productTypeId: number;
  Name: string;
  Brand: string;
  Variant: string;
  Unit: string;
  Quantity: number;
  matchScore?: number;
}

interface ProductTypeSuggestion {
  productTypeId: number;
  Name: string;
  Brand: string;
  Variant: string;
  Unit: string;
  Quantity: number;
  matchScore?: number;
}

const StoreDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: '',
    store_description: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_image_url: '',
    latitude: undefined,
    longitude: undefined
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
    variant: '',
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
  
  // Map and geolocation states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [isItemUploading, setIsItemUploading] = useState(false);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; email?: string} | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Product Type Matching States
  const [suggestedProductTypes, setSuggestedProductTypes] = useState<ProductTypeSuggestion[]>([]);
  const [showProductTypeSuggestions, setShowProductTypeSuggestions] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | null>(null);
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
          store_address: data.location, // Map location to store_address
          latitude: data.latitude,
          longitude: data.longitude
        };
        setStoreInfo(mappedData);
      }
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  // Helper to check if required fields are filled before showing product type selector
  const allFieldsFilled = () => {
    return [
      newItem.name,
      newItem.description,
      newItem.price,
      newItem.category,
      newItem.unit,
      newItem.brand,
      newItem.variant,
      newItem.availability
    ].every(val => val !== '' && val !== null && typeof val !== 'undefined' && !(typeof val === 'number' && isNaN(val)));
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

  // Geocode address to get latitude and longitude
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    setIsGeocodingAddress(true);
    try {
      // Use a geocoding service (using a free service like OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        return { lat, lng };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Handle address geocoding
  const handleGeocodeAddress = async () => {
    if (!storeInfo.store_address.trim()) {
      alert('Please enter an address first');
      return;
    }

    const coordinates = await geocodeAddress(storeInfo.store_address);
    if (coordinates) {
      setStoreInfo({
        ...storeInfo,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      });
      alert(`Address geocoded successfully!\nLatitude: ${coordinates.lat}\nLongitude: ${coordinates.lng}`);
    } else {
      alert('Could not find coordinates for this address. Please try a more specific address or use the map picker.');
    }
  };

  // Open Google Maps for location picking with enhanced coordinate extraction
  // Open interactive location picker
  const openGoogleMapsPicker = () => {
    setIsMapModalOpen(true);
  };

  // Handle location selection from interactive map
  const handleLocationSelected = (lat: number, lng: number) => {
    // Update the store info with selected coordinates
    setStoreInfo(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    // Show success message
    setAlertMessage(`Location saved successfully!\nLatitude: ${lat.toFixed(6)}\nLongitude: ${lng.toFixed(6)}`);
    setShowAlert(true);
  };

  // Enhanced coordinate saving from Google Maps
  const saveCoordinatesFromGoogleMaps = () => {
    const coordinateDialog = `
🎯 SAVE COORDINATES FROM GOOGLE MAPS

From your Google Maps window, you should now have coordinates like:
"15.425259, 120.938294"

📋 Paste them here in ANY of these formats:
• "15.425259, 120.938294"
• "15.425259,120.938294" 
• "15.425259 120.938294"
• Just the numbers with comma/space

I'll automatically extract and save them for you!
    `;
    
    alert(coordinateDialog);
    
    const coordinates = prompt('📍 Paste your Google Maps coordinates here:');
    if (coordinates) {
      // Enhanced parsing to handle multiple formats
      const cleanCoords = coordinates
        .replace(/[^\d.,-\s]/g, '') // Remove everything except numbers, dots, commas, spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      // Try different splitting methods
      let coordArray: string[] = [];
      if (cleanCoords.includes(',')) {
        coordArray = cleanCoords.split(',');
      } else if (cleanCoords.includes(' ')) {
        coordArray = cleanCoords.split(' ').filter(x => x.length > 0);
      }
      
      if (coordArray.length >= 2) {
        const lat = parseFloat(coordArray[0].trim());
        const lng = parseFloat(coordArray[1].trim());
        
        if (!isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setStoreInfo({
            ...storeInfo,
            latitude: lat,
            longitude: lng
          });
          alert(`✅ COORDINATES SAVED SUCCESSFULLY!
          
📍 Location Details:
• Latitude: ${lat}
• Longitude: ${lng}
• Location: ${lat >= 0 ? 'North' : 'South'} ${Math.abs(lat)}°, ${lng >= 0 ? 'East' : 'West'} ${Math.abs(lng)}°

Your store location has been updated!`);
        } else {
          alert('❌ Invalid coordinates. Please ensure:\n• Latitude is between -90 and 90\n• Longitude is between -180 and 180\n• Format: "15.425259, 120.938294"');
        }
      } else {
        alert('❌ Could not parse coordinates. Please use format:\n"15.425259, 120.938294"');
      }
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
        latitude: storeInfo.latitude,
        longitude: storeInfo.longitude,
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
          store_address: result.data.location, // Map location back to store_address
          latitude: result.data.latitude,
          longitude: result.data.longitude
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
      console.log('📝 Store info keys:', Object.keys(storeInfo));
      
      // Check for store ID using multiple possible column names
      const storeId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      console.log('🏪 Found store ID:', storeId);
      
      if (!storeId) {
        console.log('❌ No store ID found');
        setAlertMessage('Please save store information first');
        setShowAlert(true);
        return;
      }

      // 🎯 Determine Product Type ID (manual selection takes priority)
      let productTypeId = selectedProductTypeId;

      // If user didn't manually pick and we have suggestedProductTypes, pick the best-scoring one
      if (!productTypeId && suggestedProductTypes && suggestedProductTypes.length > 0) {
        const best = suggestedProductTypes.reduce((bestSoFar, cur) => {
          return (cur.matchScore ?? 0) > (bestSoFar.matchScore ?? 0) ? cur : bestSoFar;
        }, suggestedProductTypes[0]);
        if (best && best.productTypeId) {
          productTypeId = best.productTypeId;
          console.log('🔎 Auto-assigned productTypeId from suggestions:', productTypeId);
        }
      }

      // Fallback to service-based matching if still not assigned
      if (!productTypeId) {
        console.log('🔍 No manual selection or suggestion, finding matching product type for:', newItem.name);
        productTypeId = await ProductTypeMatchingService.findBestMatch({
          name: newItem.name,
          brand: newItem.brand || '',
          category: newItem.category,
          unit: newItem.unit || '',
          description: newItem.description
        });
      }

      if (productTypeId) {
        console.log('✅ Product Type ID assigned:', productTypeId);
      } else {
        console.log('⚠️ No matching product type found - item will be saved without productTypeId');
      }

      const currentStoreId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      const itemData = {
        ...newItem,
        storeId: currentStoreId,
        productTypeId: productTypeId, // 🎯 Automatically set productTypeId
        updated_at: new Date().toISOString()
      };

      console.log('🖼️ Item data being saved:', itemData);
      console.log('📸 Image URL in data:', itemData.item_image_url);
      console.log('🎯 Product Type ID assigned:', itemData.productTypeId);

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

      const successMessage = editingItem 
        ? 'Item updated successfully!' 
        : `Item added successfully!${productTypeId ? ' (Auto-matched with standard product type)' : ' (No standard product type found)'}`;
      
      setAlertMessage(successMessage);
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
        variant: '',
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
      variant: '',
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

  // Helper function to get product type suggestions
  const getProductTypeSuggestions = async (itemName: string) => {
    if (!itemName || itemName.length < 2) {
      setSuggestedProductTypes([]);
      setShowProductTypeSuggestions(false);
      return;
    }

    const suggestions = await ProductTypeMatchingService.getSimilarProducts({
      name: itemName,
      brand: newItem.brand || '',
      category: newItem.category,
      unit: newItem.unit || '',
      description: newItem.description
    }, 5);

    setSuggestedProductTypes(suggestions);
    setShowProductTypeSuggestions(suggestions.length > 0);
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
    
    // Reset product type selection
    setSuggestedProductTypes([]);
    setShowProductTypeSuggestions(false);
    setSelectedProductTypeId(null);
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
              <IonItem className="compact-item">
                <IonLabel position="stacked">Store Name</IonLabel>
                <IonInput
                  value={storeInfo.name}
                  onIonInput={(e) => setStoreInfo({...storeInfo, name: e.detail.value!})}
                  placeholder="Enter store name"
                />
              </IonItem>
              
              <IonItem className="compact-item">
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={storeInfo.store_description}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_description: e.detail.value!})}
                  placeholder="Enter store description"
                  rows={2}
                />
              </IonItem>
              
              <IonItem className="compact-item">
                <IonLabel position="stacked">
                  Address
                  {storeInfo.latitude && storeInfo.longitude && (
                    <small style={{ color: '#28a745', fontSize: '11px', fontWeight: 'normal' }}>
                      <br />📍 Lat: {storeInfo.latitude.toFixed(4)}, Lng: {storeInfo.longitude.toFixed(4)}
                    </small>
                  )}
                </IonLabel>
                <IonTextarea
                  value={storeInfo.store_address}
                  onIonInput={(e) => setStoreInfo({...storeInfo, store_address: e.detail.value!})}
                  placeholder="Enter store address"
                  rows={2}
                />
              </IonItem>
              
              {/* Address Action Buttons */}
              <IonItem className="button-group-item">
                <IonGrid style={{ padding: '0' }}>
                  <IonRow>
                    <IonCol size="6" style={{ padding: '0 4px 0 0' }}>
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        size="small"
                        color="primary"
                        onClick={handleGeocodeAddress}
                        disabled={isGeocodingAddress || !storeInfo.store_address.trim()}
                      >
                        <IonIcon icon={locationOutline} slot="start" />
                        {isGeocodingAddress ? 'Finding...' : 'Get Coordinates'}
                      </IonButton>
                    </IonCol>
                    <IonCol size="6" style={{ padding: '0 0 0 4px' }}>
                      <IonButton 
                        expand="block" 
                        fill="solid" 
                        size="small"
                        color="tertiary"
                        onClick={() => setIsMapModalOpen(true)}
                        style={{
                          '--background': '#FF69B4',
                          '--background-activated': '#FF1493',
                          '--background-hover': '#FF1493',
                          '--color': 'white'
                        }}
                      >
                        <IonIcon icon={navigate} slot="start" />
                        Pin on Map
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>
              
              <IonGrid style={{ padding: '0', marginTop: '8px' }}>
                <IonRow>
                  <IonCol size="6" style={{ padding: '0 4px 0 0' }}>
                    <IonItem className="compact-item">
                      <IonLabel position="stacked">Phone</IonLabel>
                      <IonInput
                        value={storeInfo.store_phone}
                        onIonInput={(e) => setStoreInfo({...storeInfo, store_phone: e.detail.value!})}
                        placeholder="Enter phone number"
                        inputMode="tel"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="6" style={{ padding: '0 0 0 4px' }}>
                    <IonItem className="compact-item">
                      <IonLabel position="stacked">Email</IonLabel>
                      <IonInput
                        value={storeInfo.store_email}
                        onIonInput={(e) => setStoreInfo({...storeInfo, store_email: e.detail.value!})}
                        placeholder="Enter email address"
                        type="email"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
              
              <IonItem className="compact-item">
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
                </div>
              </IonItem>
              <IonButton expand="block" onClick={saveStoreInfo} className="save-button">
                <IonIcon icon={save} slot="start" />
                Save Store Information
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Map Location Picker Modal */}
        <IonModal isOpen={isMapModalOpen} onDidDismiss={() => setIsMapModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Location</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsMapModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <IonIcon 
                icon={navigate} 
                style={{ 
                  fontSize: '48px', 
                  color: '#FF69B4',
                  marginBottom: '10px' 
                }} 
              />
              <h2>Pin Your Location</h2>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                You can either get your current location or manually enter coordinates.
              </p>
            </div>

            <IonItem>
              <IonLabel position="stacked">Current Address</IonLabel>
              <IonTextarea
                value={storeInfo.store_address}
                readonly
                rows={2}
                style={{ opacity: 0.7 }}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Latitude</IonLabel>
              <IonInput
                type="number"
                value={storeInfo.latitude?.toString() || ''}
                placeholder="e.g., 14.5995"
                onIonInput={(e) => {
                  const lat = parseFloat(e.detail.value!);
                  if (!isNaN(lat)) {
                    setStoreInfo({...storeInfo, latitude: lat});
                  }
                }}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Longitude</IonLabel>
              <IonInput
                type="number"
                value={storeInfo.longitude?.toString() || ''}
                placeholder="e.g., 120.9842"
                onIonInput={(e) => {
                  const lng = parseFloat(e.detail.value!);
                  if (!isNaN(lng)) {
                    setStoreInfo({...storeInfo, longitude: lng});
                  }
                }}
              />
            </IonItem>

            {/* Enhanced coordinate paste helpers */}
            <div style={{ margin: '15px 0' }}>
              <IonButton 
                expand="block" 
                fill="solid"
                color="success"
                size="default"
                onClick={saveCoordinatesFromGoogleMaps}
                style={{ 
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}
              >
                📍 Save from Google Maps
              </IonButton>
              
              <IonButton 
                expand="block" 
                fill="clear"
                size="small"
                onClick={() => {
                  const coordinates = prompt('Paste coordinates from any source\n(Format: "14.5995, 120.9842" or "14.5995,120.9842")');
                  if (coordinates) {
                    // Clean and parse coordinates
                    const cleanCoords = coordinates.replace(/[^\d.,-]/g, '').replace(/\s+/g, '');
                    const coordArray = cleanCoords.split(',');
                    
                    if (coordArray.length >= 2) {
                      const lat = parseFloat(coordArray[0]);
                      const lng = parseFloat(coordArray[1]);
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setStoreInfo({
                          ...storeInfo,
                          latitude: lat,
                          longitude: lng
                        });
                        alert(`Coordinates set successfully!\nLatitude: ${lat}\nLongitude: ${lng}`);
                      } else {
                        alert('Invalid coordinate format. Please use format: "14.5995, 120.9842"');
                      }
                    } else {
                      alert('Please provide both latitude and longitude separated by a comma');
                    }
                  }
                }}
                style={{ 
                  fontSize: '0.9rem',
                  '--color': '#666'
                }}
              >
                📋 Quick Paste (Any Source)
              </IonButton>
            </div>

            <div style={{ margin: '20px 0' }}>
              <IonButton 
                expand="block" 
                fill="outline"
                onClick={async () => {
                  try {
                    const position = await LocationService.getCurrentPosition();
                    if (position) {
                      setStoreInfo({
                        ...storeInfo,
                        latitude: position.latitude,
                        longitude: position.longitude
                      });
                      alert('Current location captured successfully!');
                    } else {
                      alert('Could not get current location. Please ensure location permissions are enabled.');
                    }
                  } catch (error) {
                    console.error('Location error:', error);
                    alert('Could not get current location. Please ensure location permissions are enabled.');
                  }
                }}
              >
                <IonIcon icon={locationOutline} slot="start" />
                Use Current Location
              </IonButton>
              
              <IonButton 
                expand="block" 
                color="secondary"
                fill="outline"
                onClick={openGoogleMapsPicker}
                style={{ marginTop: '10px' }}
              >
                <IonIcon icon={navigate} slot="start" />
                Pick on Google Maps
              </IonButton>
            </div>

            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '15px', 
              borderRadius: '8px',
              marginTop: '20px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              <strong>🎯 Easy Location Setup:</strong>
              <ul style={{ margin: '8px 0 0 15px', paddingLeft: 0 }}>
                <li><strong>RECOMMENDED:</strong> Click "Pick on Google Maps" → Use "📍 Save from Google Maps" button</li>
                <li>Or click "Use Current Location" for your GPS coordinates</li>
                <li>Or manually enter coordinates if you know them</li>
                <li>Philippines coordinates: Latitude ~5-19°N, Longitude ~117-127°E</li>
              </ul>
            </div>

            <IonButton 
              expand="block" 
              color="success"
              onClick={() => {
                if (storeInfo.latitude && storeInfo.longitude) {
                  setIsMapModalOpen(false);
                  alert(`Location set successfully!\nLatitude: ${storeInfo.latitude}\nLongitude: ${storeInfo.longitude}`);
                } else {
                  alert('Please set both latitude and longitude coordinates.');
                }
              }}
              style={{ marginTop: '20px' }}
            >
              <IonIcon icon={save} slot="start" />
              Save Location
            </IonButton>
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
                  onIonInput={(e) => {
                    setNewItem({...newItem, name: e.detail.value!});
                    // Get product type suggestions as user types
                    getProductTypeSuggestions(e.detail.value!);
                  }}
                  placeholder="Enter item name"
                />
              </IonItem>
              
              {/* Product Type Suggestions (moved below Quantity) - removed from here */}
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
                <IonLabel position="stacked">Brand Name</IonLabel>
                <IonInput
                  value={newItem.brand}
                  onIonInput={(e) => setNewItem({...newItem, brand: e.detail.value!})}
                  placeholder="Enter brand name"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Variant</IonLabel>
                <IonInput
                  value={newItem.variant}
                  onIonInput={(e) => setNewItem({...newItem, variant: e.detail.value!})}
                  placeholder="Enter variant (e.g., Original, Spicy, Large)"
                />
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
                  <IonSelectOption value="kg">kg (kilogram)</IonSelectOption>
                  <IonSelectOption value="g">g (gram)</IonSelectOption>
                  <IonSelectOption value="mg">mg (milligram)</IonSelectOption>
                  <IonSelectOption value="liter">L (liter)</IonSelectOption>
                  <IonSelectOption value="ml">ml (milliliter)</IonSelectOption>
                  <IonSelectOption value="can">can</IonSelectOption>
                  <IonSelectOption value="bottle">bottle</IonSelectOption>
                  <IonSelectOption value="jar">jar</IonSelectOption>
                  <IonSelectOption value="pack">pack</IonSelectOption>
                  <IonSelectOption value="sachet">sachet</IonSelectOption>
                  <IonSelectOption value="pouch">pouch</IonSelectOption>
                  <IonSelectOption value="box">box</IonSelectOption>
                  <IonSelectOption value="bag">bag</IonSelectOption>
                  <IonSelectOption value="pc">piece (pc)</IonSelectOption>
                  <IonSelectOption value="pcs">pcs</IonSelectOption>
                  <IonSelectOption value="dozen">dozen</IonSelectOption>
                  <IonSelectOption value="bundle">bundle</IonSelectOption>
                  <IonSelectOption value="bunch">bunch</IonSelectOption>
                  <IonSelectOption value="slice">slice</IonSelectOption>
                  <IonSelectOption value="stick">stick</IonSelectOption>
                  <IonSelectOption value="cup">cup</IonSelectOption>
                  <IonSelectOption value="tub">tub</IonSelectOption>
                  <IonSelectOption value="roll">roll</IonSelectOption>
                  <IonSelectOption value="tray">tray</IonSelectOption>
                  <IonSelectOption value="bar">bar</IonSelectOption>
                  <IonSelectOption value="tablet">tablet</IonSelectOption>
                  <IonSelectOption value="strip">strip</IonSelectOption>
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
              {/* Suggested Product Types - shown only when all required fields are filled */}
              {allFieldsFilled() && suggestedProductTypes && suggestedProductTypes.length > 0 && (
                <IonItem style={{ marginTop: '10px' }}>
                  <IonLabel position="stacked">
                    🎯 Suggested Standard Product Types (for price monitoring)
                  </IonLabel>
                  <IonSelect
                    value={selectedProductTypeId ?? ''}
                    onIonChange={(e) => setSelectedProductTypeId(e.detail.value === '' ? null : e.detail.value)}
                    placeholder="None (Auto-select best match)"
                    interface="popover"
                    fill="outline"
                  >
                    <IonSelectOption value="">None (Auto-select best match)</IonSelectOption>
                    {suggestedProductTypes.map((product: ProductTypeSuggestion) => (
                      <IonSelectOption key={product.productTypeId} value={product.productTypeId}>
                        {product.Name} - {product.Brand} ({product.Unit}) {product.matchScore && `- ${Math.round(product.matchScore * 100)}% match`}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
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

        {/* Interactive Location Picker */}
        <LocationPicker 
          isOpen={isMapModalOpen}
          onDidDismiss={() => setIsMapModalOpen(false)}
          onLocationSelected={handleLocationSelected}
          initialPosition={storeInfo.latitude && storeInfo.longitude ? {
            lat: storeInfo.latitude,
            lng: storeInfo.longitude
          } : undefined}
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
