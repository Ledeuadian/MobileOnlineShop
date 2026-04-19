import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  IonIcon,
  IonBadge
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
  locationOutline,
  alertCircle,
  checkmarkCircle,
  notificationsOutline,
  cashOutline,
  timeOutline,
  checkmarkCircleOutline
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
  gcash_number?: string;
  store_image_url: string;
  latitude?: number;
  longitude?: number;
  bir_permit?: string;
  dti_permit?: string;
  bir_permit_image?: string;
  dti_permit_image?: string;
  verified?: boolean;
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

const StoreDashboard: React.FC = () => {
  const history = useHistory();
  const [selectedSegment, setSelectedSegment] = useState<string>('dashboard');
  const [dateRange, setDateRange] = useState<string>('week'); // 'week', 'month', 'year', 'range'
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: '',
    store_description: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    gcash_number: '',
    store_image_url: '',
    latitude: undefined,
    longitude: undefined,
    bir_permit: '',
    dti_permit: '',
    verified: false
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
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isStoreDataLoaded, setIsStoreDataLoaded] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Permit image upload states
  const [selectedBirPermitImage, setSelectedBirPermitImage] = useState<File | null>(null);
  const [selectedDtiPermitImage, setSelectedDtiPermitImage] = useState<File | null>(null);
  const [birPermitImagePreview, setBirPermitImagePreview] = useState<string | null>(null);
  const [dtiPermitImagePreview, setDtiPermitImagePreview] = useState<string | null>(null);
  const [isBirPermitUploading, setIsBirPermitUploading] = useState(false);
  const [isDtiPermitUploading, setIsDtiPermitUploading] = useState(false);
  
  // Product Type Matching States
  const [suggestedProductTypes, setSuggestedProductTypes] = useState<ProductTypeSuggestion[]>([]);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | null>(null);

  // Earnings states
  interface EarningRecord {
    earningId: number;
    orderId: number;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState({ totalGross: 0, totalFees: 0, totalNet: 0, pendingNet: 0, disbursedNet: 0 });
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

  const loadUnreadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get public userId
      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      if (!userData) return;

      // Count unread notifications
      const { count, error } = await supabase
        .from('NOTIFICATIONS')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userData.userId)
        .eq('isRead', false);

      if (error) {
        console.error('Error loading notifications count:', error);
        return;
      }

      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          await loadStoreInfo(user.id);
          await loadStockItems(user.id);
          await loadUnreadNotifications();
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
          store_address: data.location ?? '', // Map location to store_address
          latitude: data.latitude,
          longitude: data.longitude
        };
        console.log('Store info loaded:', mappedData);
        console.log('Verified status:', mappedData.verified);
        setStoreInfo(mappedData);
        setIsStoreDataLoaded(true);
      } else {
        setIsStoreDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading store info:', error);
      setIsStoreDataLoaded(true);
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
    if (!storeInfo.store_address?.trim()) {
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
    // Persist coordinates to GROCERY_STORE immediately for this owner
    persistCoordinatesToStore(lat, lng).catch(err => {
      console.error('Error persisting coordinates after map pin:', err);
    });
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
      // parse using helper
      const parsed = parseCoordsFromString(coordinates);
      if (parsed) {
        setStoreInfo({
          ...storeInfo,
          latitude: parsed.lat,
          longitude: parsed.lng
        });
        alert(`✅ COORDINATES SAVED SUCCESSFULLY!\n\n📍 Location Details:\n• Latitude: ${parsed.lat}\n• Longitude: ${parsed.lng}\n\nYour store location has been updated!`);
        // Persist coordinates to store immediately
        persistCoordinatesToStore(parsed.lat, parsed.lng).catch(err => console.error('Error persisting pasted coordinates:', err));
      } else {
        alert('❌ Could not parse coordinates. Please use format:\n"15.425259, 120.938294"');
      }
    }
  };

  // Helper: parse coordinate string into lat/lng or null
  const parseCoordsFromString = (input: string): { lat: number; lng: number } | null => {
    if (!input) return null;
    const clean = input.replace(/[^0-9.,\-\s]/g, '').replace(/\s+/g, ' ').trim();
    let parts: string[] = [];
    if (clean.includes(',')) parts = clean.split(',').map(s => s.trim()).filter(Boolean);
    else if (clean.includes(' ')) parts = clean.split(' ').map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  };

  // Persist latitude/longitude to GROCERY_STORE for the current user's store
  const persistCoordinatesToStore = async (lat: number, lng: number) => {
    try {
      if (!currentUser) {
        console.warn('No authenticated user - cannot persist store coordinates');
        return;
      }

      // Try to find existing store for this owner
      const { data: existingStore, error: selectError } = await supabase
        .from('GROCERY_STORE')
        .select('*')
        .eq('owner_id', currentUser.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error finding existing store for owner:', selectError);
      }

      const payload: Partial<StoreInfo> & { owner_id: string; updated_at: string } = {
        latitude: lat,
        longitude: lng,
        owner_id: currentUser.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingStore) {
        // Update the existing store row
        result = await supabase
          .from('GROCERY_STORE')
          .update({ latitude: lat, longitude: lng, updated_at: payload.updated_at })
          .eq('owner_id', currentUser.id)
          .select()
          .single();
      } else {
        // Insert a minimal new store row with coordinates and owner_id
        result = await supabase
          .from('GROCERY_STORE')
          .insert([payload])
          .select()
          .single();
      }

      if (result?.error) {
        throw result.error;
      }

      if (result?.data) {
        // Map db fields back to frontend storeInfo
        const mapped = {
          ...result.data,
          store_address: result.data.location || storeInfo.store_address,
          latitude: result.data.latitude ?? lat,
          longitude: result.data.longitude ?? lng
        };
        setStoreInfo(mapped);
      }
    } catch (err) {
      console.error('Error persisting coordinates to GROCERY_STORE:', err);
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
        gcash_number: storeInfo.gcash_number,
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
          store_address: result.data.location ?? '', // Map location back to store_address
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

  // BIR Permit Image Upload Functions
  const handleBirPermitImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setSelectedBirPermitImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBirPermitImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBirPermitImageToSupabase = async (): Promise<string | null> => {
    if (!selectedBirPermitImage || !currentUser) return null;
    
    setIsBirPermitUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const fileExt = selectedBirPermitImage.name.split('.').pop();
      const fileName = `bir-permit-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('Images')
        .upload(fileName, selectedBirPermitImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedBirPermitImage.type
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading BIR permit image:', error);
      setAlertMessage('Error uploading BIR permit image. Please try again.');
      setShowAlert(true);
      return null;
    } finally {
      setIsBirPermitUploading(false);
    }
  };

  const handleBirPermitImageUpload = async () => {
    if (!selectedBirPermitImage) return;
    
    await ensureStorageBucket();
    
    const imageUrl = await uploadBirPermitImageToSupabase();
    if (imageUrl) {
      setStoreInfo({...storeInfo, bir_permit_image: imageUrl});
      setSelectedBirPermitImage(null);
      setBirPermitImagePreview(imageUrl);
      setAlertMessage('BIR permit image uploaded successfully!');
      setShowAlert(true);
    }
  };

  // DTI Permit Image Upload Functions
  const handleDtiPermitImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setSelectedDtiPermitImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setDtiPermitImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadDtiPermitImageToSupabase = async (): Promise<string | null> => {
    if (!selectedDtiPermitImage || !currentUser) return null;
    
    setIsDtiPermitUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const fileExt = selectedDtiPermitImage.name.split('.').pop();
      const fileName = `dti-permit-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('Images')
        .upload(fileName, selectedDtiPermitImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedDtiPermitImage.type
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading DTI permit image:', error);
      setAlertMessage('Error uploading DTI permit image. Please try again.');
      setShowAlert(true);
      return null;
    } finally {
      setIsDtiPermitUploading(false);
    }
  };

  const handleDtiPermitImageUpload = async () => {
    if (!selectedDtiPermitImage) return;
    
    await ensureStorageBucket();
    
    const imageUrl = await uploadDtiPermitImageToSupabase();
    if (imageUrl) {
      setStoreInfo({...storeInfo, dti_permit_image: imageUrl});
      setSelectedDtiPermitImage(null);
      setDtiPermitImagePreview(imageUrl);
      setAlertMessage('DTI permit image uploaded successfully!');
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
        if (best?.productTypeId) {
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

      const messageSuffix = productTypeId ? ' (Auto-matched with standard product type)' : ' (No standard product type found)';
      const successMessage = editingItem ? 'Item updated successfully!' : `Item added successfully!${messageSuffix}`;
      
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

  // Submit verification request with permits
  const handleSubmitVerification = async () => {
    try {
      if (!storeInfo.bir_permit || !storeInfo.dti_permit) {
        setAlertMessage('Please fill in both BIR and DTI permit numbers');
        setShowAlert(true);
        return;
      }

      if (!storeInfo.bir_permit_image || !storeInfo.dti_permit_image) {
        setAlertMessage('Please upload both BIR and DTI permit images');
        setShowAlert(true);
        return;
      }

      const storeId = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
      
      if (!storeId) {
        setAlertMessage('Store information not found. Please contact support.');
        setShowAlert(true);
        return;
      }

      const { error } = await supabase
        .from('GROCERY_STORE')
        .update({
          bir_permit: storeInfo.bir_permit,
          dti_permit: storeInfo.dti_permit,
          bir_permit_image: storeInfo.bir_permit_image,
          dti_permit_image: storeInfo.dti_permit_image,
          verified: false
        })
        .eq('storeId', storeId);

      if (error) {
        console.error('Error submitting verification:', error);
        setAlertMessage('Failed to submit verification request. Please try again.');
        setShowAlert(true);
      } else {
        setAlertMessage('Verification request submitted! Please wait for admin approval.');
        setShowAlert(true);
        setIsVerificationModalOpen(false);
        // Refresh store info to get updated verification status
        if (currentUser) {
          await loadStoreInfo(currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setAlertMessage('An error occurred. Please try again.');
      setShowAlert(true);
    }
  };

  // Mock data for sales report
  const loadEarnings = async (storeId: number) => {
    setEarningsLoading(true);
    try {
      const { data, error } = await supabase
        .from('STORE_EARNINGS')
        .select('earningId, orderId, grossAmount, platformFee, netAmount, paymentMethod, status, createdAt')
        .eq('storeId', storeId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      setEarnings(rows);
      const summary = rows.reduce((acc, r) => ({
        totalGross: acc.totalGross + Number(r.grossAmount),
        totalFees: acc.totalFees + Number(r.platformFee),
        totalNet: acc.totalNet + Number(r.netAmount),
        pendingNet: acc.pendingNet + (r.status === 'pending' ? Number(r.netAmount) : 0),
        disbursedNet: acc.disbursedNet + (r.status === 'disbursed' ? Number(r.netAmount) : 0),
      }), { totalGross: 0, totalFees: 0, totalNet: 0, pendingNet: 0, disbursedNet: 0 });
      setEarningsSummary(summary);
    } catch (err) {
      console.error('Error loading earnings:', err);
    } finally {
      setEarningsLoading(false);
    }
  };

  const renderEarnings = () => (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>My Earnings</h2>

      {/* Summary Cards */}
      <IonGrid style={{ padding: 0, marginBottom: '16px' }}>
        <IonRow>
          <IonCol size="6" style={{ padding: '4px' }}>
            <div style={{ background: '#e8f5e9', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>Pending Payout</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
                ₱{earningsSummary.pendingNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </IonCol>
          <IonCol size="6" style={{ padding: '4px' }}>
            <div style={{ background: '#e3f2fd', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>Total Disbursed</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>
                ₱{earningsSummary.disbursedNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="12" style={{ padding: '4px' }}>
            <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', marginBottom: '4px' }}>Total Sales</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>₱{earningsSummary.totalGross.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ width: '1px', background: '#ddd' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', marginBottom: '4px' }}>Platform Fees (5%)</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e53935' }}>-₱{earningsSummary.totalFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Transactions List */}
      <IonCard style={{ margin: 0, borderRadius: '12px', border: '1px solid #e0e0e0' }}>
        <IonCardContent style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f9f9f9', display: 'flex' }}>
            <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#555' }}>Order / Date</div>
            <div style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#555', textAlign: 'right' }}>Net Earned</div>
            <div style={{ width: '80px', fontSize: '13px', fontWeight: '600', color: '#555', textAlign: 'right' }}>Status</div>
          </div>

          {earningsLoading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>Loading...</div>
          )}
          {!earningsLoading && earnings.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
              <IonIcon icon={cashOutline} style={{ fontSize: '40px', display: 'block', margin: '0 auto 8px' }} />
              No earnings yet. Earnings appear after a GCash or Maya payment is completed.
            </div>
          )}
          {!earningsLoading && earnings.map((e, idx) => (
            <div key={e.earningId} style={{
              display: 'flex', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: idx < earnings.length - 1 ? '1px solid #f0f0f0' : 'none',
              background: idx % 2 === 0 ? '#fff' : '#fafafa'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Order #{e.orderId}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {new Date(e.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  &nbsp;· {e.paymentMethod}
                </div>
              </div>
              <div style={{ width: '90px', textAlign: 'right', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                ₱{Number(e.netAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ width: '80px', textAlign: 'right' }}>
                <IonBadge color={e.status === 'disbursed' ? 'success' : 'warning'} style={{ fontSize: '11px' }}>
                  {e.status === 'disbursed' ? 'Paid Out' : 'Pending'}
                </IonBadge>
              </div>
            </div>
          ))}
        </IonCardContent>
      </IonCard>

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        Payouts are processed by the Admin. Contact support if your payout is overdue.
      </p>
    </div>
  );

  const getMockSalesData = () => {
    const data = {
      week: {
        dateText: '5 - 11 OCT 2025',
        totalSales: 12345.00,
        totalCustomers: 76,
        totalOrders: 103,
        averageOrderValue: 123.00
      },
      month: {
        dateText: 'OCTOBER 2025',
        totalSales: 45678.00,
        totalCustomers: 234,
        totalOrders: 389,
        averageOrderValue: 117.50
      },
      year: {
        dateText: '2025',
        totalSales: 456789.00,
        totalCustomers: 2156,
        totalOrders: 3567,
        averageOrderValue: 128.10
      },
      range: {
        dateText: 'CUSTOM RANGE',
        totalSales: 23456.00,
        totalCustomers: 145,
        totalOrders: 256,
        averageOrderValue: 91.63
      }
    };
    return data[dateRange as keyof typeof data];
  };

  // Mock data for popular items
  const mockPopularItems = [
    { name: 'Vinegar', size: '700ml', brand: 'Datu Puti', unitsSold: 150 },
    { name: 'Toothpaste', size: '40g', brand: 'Colgate', unitsSold: 130 },
    { name: 'Soy Sauce', size: '1L', brand: 'Silver Swan', unitsSold: 125 },
    { name: 'Shampoo', size: '200ml', brand: 'Palmolive', unitsSold: 118 },
    { name: 'Detergent', size: '500g', brand: 'Tide', unitsSold: 105 }
  ];

  const renderDashboard = () => {
    const salesData = getMockSalesData();
    
    return (
      <div className="dashboard-content">
        {/* Date Range Selector */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <IonSegment 
            value={dateRange} 
            onIonChange={(e) => setDateRange(e.detail.value as string)}
            style={{ 
              '--background': '#f5f5f5',
              borderRadius: '25px',
              padding: '2px',
              display: 'flex',
              overflow: 'hidden'
            }}
          >
            <IonSegmentButton value="week" style={{ borderRadius: '20px', minHeight: '32px', flex: '1 1 0', padding: '0 2px' }}>
              <IonLabel style={{ fontSize: '11px', minWidth: '0', margin: '0' }}>Week</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="month" style={{ borderRadius: '20px', minHeight: '32px', flex: '1 1 0', padding: '0 2px' }}>
              <IonLabel style={{ fontSize: '11px', minWidth: '0', margin: '0' }}>Month</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="year" style={{ borderRadius: '20px', minHeight: '32px', flex: '1 1 0', padding: '0 2px' }}>
              <IonLabel style={{ fontSize: '11px', minWidth: '0', margin: '0' }}>Year</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="range" style={{ borderRadius: '20px', minHeight: '32px', flex: '1 1 0', padding: '0 2px' }}>
              <IonLabel style={{ fontSize: '10px', minWidth: '0', margin: '0' }}>Range</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Sales Statistics Card */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <IonCard style={{ margin: 0, borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontStyle: 'italic', 
                marginBottom: '12px',
                marginTop: 0 
              }}>
                Showing data for: {salesData.dateText}
              </p>
              
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="6" style={{ padding: '4px' }}>
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        ₱ {salesData.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                        TOTAL SALES
                      </div>
                    </div>
                  </IonCol>
                  
                  <IonCol size="6" style={{ padding: '4px' }}>
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {salesData.totalCustomers}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                        TOTAL CUSTOMERS
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="6" style={{ padding: '4px' }}>
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {salesData.totalOrders}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                        TOTAL ORDERS
                      </div>
                    </div>
                  </IonCol>
                  
                  <IonCol size="6" style={{ padding: '4px' }}>
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        ₱ {salesData.averageOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                        AVERAGE ORDER VALUE
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Popular Items Section */}
        <div style={{ padding: '0 16px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            marginTop: '8px',
            color: '#333'
          }}>
            Popular Items
          </h2>
          
          <IonCard style={{ margin: 0, borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <IonCardContent style={{ padding: '0' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'flex', 
                padding: '12px 16px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Item
                </div>
                <div style={{ width: '100px', fontSize: '14px', fontWeight: '600', color: '#333', textAlign: 'right' }}>
                  Units Sold
                </div>
              </div>
              
              {/* Table Rows */}
              {mockPopularItems.map((item, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    padding: '12px 16px',
                    borderBottom: index < mockPopularItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '2px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {item.size} &nbsp;&nbsp; {item.brand}
                    </div>
                  </div>
                  <div style={{ 
                    width: '100px', 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#333',
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}>
                    {item.unitsSold}
                  </div>
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        </div>
      </div>
    );
  };

  const renderStoreInfo = () => (
    <div className="store-info-content">
      {/* Permits Section */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Permits</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="store-details">
            <IonItem>
              <IonLabel position="stacked">BIR Permit</IonLabel>
              <p>{storeInfo.bir_permit || 'Not set'}</p>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">DTI Permit</IonLabel>
              <p>{storeInfo.dti_permit || 'Not set'}</p>
            </IonItem>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Store Information Section */}
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
              <IonLabel position="stacked">GCash Number (for payouts)</IonLabel>
              <p>{storeInfo.gcash_number || 'Not set'}</p>
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
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
              {unreadNotifications > 0 && (
                <IonBadge color="danger" style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.7rem' }}>
                  {unreadNotifications}
                </IonBadge>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonSegment 
          value={selectedSegment} 
          onIonChange={e => {
            const val = e.detail.value as string;
            setSelectedSegment(val);
            if (val === 'earnings') {
              const sid = storeInfo.store_id || storeInfo.storeId || storeInfo.id;
              if (sid) loadEarnings(sid);
            }
          }}
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
          <IonSegmentButton value="earnings">
            <IonLabel>Earnings</IonLabel>
            <IonIcon icon={cashOutline} />
          </IonSegmentButton>
        </IonSegment>

        {selectedSegment === 'dashboard' && renderDashboard()}
        {selectedSegment === 'store' && renderStoreInfo()}
        {selectedSegment === 'stock' && renderStock()}
        {selectedSegment === 'earnings' && renderEarnings()}

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
              {/* Permits Section */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  Permits
                </h3>
                
                <IonItem className="compact-item" style={{ marginBottom: '8px' }}>
                  <IonLabel position="stacked">BIR Permit</IonLabel>
                  <IonInput
                    value={storeInfo.bir_permit || ''}
                    onIonInput={(e) => setStoreInfo({...storeInfo, bir_permit: e.detail.value!})}
                    placeholder="Enter BIR Permit number"
                  />
                </IonItem>
                
                <IonItem className="compact-item">
                  <IonLabel position="stacked">DTI Permit</IonLabel>
                  <IonInput
                    value={storeInfo.dti_permit || ''}
                    onIonInput={(e) => setStoreInfo({...storeInfo, dti_permit: e.detail.value!})}
                    placeholder="Enter DTI Permit number"
                  />
                </IonItem>
              </div>

              {/* Profile Section */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  Profile
                </h3>
                
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
                          disabled={isGeocodingAddress || !storeInfo.store_address?.trim()}
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
                  <IonRow>
                    <IonCol size="12" style={{ padding: '4px 0 0 0' }}>
                      <IonItem className="compact-item">
                        <IonLabel position="stacked">GCash Number (for payouts)</IonLabel>
                        <IonInput
                          value={storeInfo.gcash_number}
                          onIonInput={(e) => setStoreInfo({...storeInfo, gcash_number: e.detail.value!})}
                          placeholder="e.g. 09171234567"
                          inputMode="tel"
                          maxlength={11}
                        />
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              
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

        {/* Verification Blocker Modal */}
        <IonModal 
          isOpen={isStoreDataLoaded && !!storeInfo.storeId && storeInfo.verified === false} 
          backdropDismiss={false}
          className="verification-modal-centered"
        >
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '90vh',
            margin: '5vh auto',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '32px 24px',
              textAlign: 'center'
            }}>
            {/* Alert Icon */}
            <div style={{
              fontSize: '80px',
              color: '#dc3545',
              marginBottom: '20px',
              animation: 'pulse 2s infinite'
            }}>
              <IonIcon 
                icon={alertCircle} 
                style={{ 
                  fontSize: '80px',
                  color: '#dc3545'
                }} 
              />
            </div>

            {/* Warning Message */}
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
              Your store is not yet verified and will not be visible to shoppers
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px'
            }}>
              Please proceed to your profile to upload the necessary documents to complete registration.
            </p>

            {/* Permit Input Fields */}
            <div style={{ width: '100%', marginBottom: '20px' }}>
              {/* BIR Permit Section */}
              <IonItem style={{ marginBottom: '12px', '--background': 'transparent' }}>
                <IonLabel position="stacked">BIR Permit Number</IonLabel>
                <IonInput
                  value={storeInfo.bir_permit || ''}
                  onIonInput={(e) => setStoreInfo({...storeInfo, bir_permit: e.detail.value!})}
                  placeholder="Enter BIR Permit number"
                />
              </IonItem>

              {/* BIR Permit Image Upload */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px',
                  color: '#495057'
                }}>
                  BIR Permit Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBirPermitImageSelect}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    marginBottom: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                />
                {birPermitImagePreview && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={birPermitImagePreview} 
                      alt="BIR Permit Preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}
                    />
                  </div>
                )}
                {selectedBirPermitImage && !isBirPermitUploading && (
                  <IonButton 
                    size="small"
                    expand="block" 
                    onClick={handleBirPermitImageUpload}
                    style={{ marginTop: '8px' }}
                  >
                    Upload BIR Permit Image
                  </IonButton>
                )}
                {isBirPermitUploading && (
                  <div style={{ marginTop: '8px' }}>
                    <IonProgressBar type="indeterminate"></IonProgressBar>
                    <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>Uploading...</p>
                  </div>
                )}
              </div>

              {/* DTI Permit Section */}
              <IonItem style={{ marginBottom: '12px', '--background': 'transparent' }}>
                <IonLabel position="stacked">DTI Permit Number</IonLabel>
                <IonInput
                  value={storeInfo.dti_permit || ''}
                  onIonInput={(e) => setStoreInfo({...storeInfo, dti_permit: e.detail.value!})}
                  placeholder="Enter DTI Permit number"
                />
              </IonItem>

              {/* DTI Permit Image Upload */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px',
                  color: '#495057'
                }}>
                  DTI Permit Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDtiPermitImageSelect}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    marginBottom: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                />
                {dtiPermitImagePreview && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={dtiPermitImagePreview} 
                      alt="DTI Permit Preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}
                    />
                  </div>
                )}
                {selectedDtiPermitImage && !isDtiPermitUploading && (
                  <IonButton 
                    size="small"
                    expand="block" 
                    onClick={handleDtiPermitImageUpload}
                    style={{ marginTop: '8px' }}
                  >
                    Upload DTI Permit Image
                  </IonButton>
                )}
                {isDtiPermitUploading && (
                  <div style={{ marginTop: '8px' }}>
                    <IonProgressBar type="indeterminate"></IonProgressBar>
                    <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>Uploading...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Get Verified Button */}
            <IonButton
              expand="block"
              onClick={handleSubmitVerification}
              style={{
                '--background': '#17a2b8',
                '--background-hover': '#138496',
                '--background-activated': '#117a8b',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Get verified
            </IonButton>
            </div>
          </div>
        </IonModal>

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
