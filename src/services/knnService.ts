import { supabase } from './supabaseService';

export interface UserDistance {
  userId: string;
  firstname?: string;
  lastname?: string;
  email: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
  userType?: string;
}

export interface StoreDistance {
  storeId: number;
  storeName: string;
  storeAddress?: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
}

export class KNNService {
  // Maximum acceptable accuracy threshold in meters (e.g., 500m is acceptable for nearby store finding)
  static readonly MAX_ACCEPTABLE_ACCURACY_METERS = 500;

  /**
   * Calculate distance between two points using the Haversine formula.
   * Returns distance in kilometers with high precision.
   * 
   * Formula: d = 2 * R * arcsin(sqrt(sin²((lat2-lat1)/2) + cos(lat1) * cos(lat2) * sin²((lon2-lon1)/2)))
   * Where R = Earth's radius (6371 km)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Earth's mean radius in kilometers (more accurate than using a fixed value)
    const R = 6371.0088;
    
    // Convert degrees to radians with high precision
    const toRad = (deg: number): number => (deg * Math.PI) / 180;
    
    // Calculate differences
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    // Convert both latitudes to radians once (optimization)
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    
    // Haversine formula with proper trigonometric functions for better precision
    const sinDLatHalf = Math.sin(dLat / 2);
    const sinDLonHalf = Math.sin(dLon / 2);
    
    const a = 
      sinDLatHalf * sinDLatHalf +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLonHalf * sinDLonHalf;
    
    // Use atan2 for numerical stability
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Calculate distance in kilometers
    const distanceKm = R * c;
    
    // Return with 3 decimal places precision (sub-meter accuracy)
    return Math.round(distanceKm * 1000) / 1000;
  }

  /**
   * Calculate distance with confidence based on location accuracy
   * Returns distance along with confidence level
   */
  static calculateDistanceWithConfidence(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    userAccuracyMeters?: number
  ): { distance: number; confidence: 'high' | 'medium' | 'low' } {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    
    // If we have accuracy info, calculate confidence
    if (userAccuracyMeters !== undefined && userAccuracyMeters !== null) {
      const distanceMeters = distance * 1000;
      const accuracyRatio = userAccuracyMeters / distanceMeters;
      
      if (accuracyRatio < 0.5) {
        return { distance, confidence: 'low' };
      } else if (accuracyRatio < 1.0) {
        return { distance, confidence: 'medium' };
      } else {
        return { distance, confidence: 'high' };
      }
    }
    
    // Default confidence if no accuracy info
    return { distance, confidence: 'medium' };
  }

  /**
   * Format distance for display with appropriate unit
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 0.1) {
      // Less than 100m - show in meters
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 1) {
      // Less than 1km - show in meters with decimal
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 10) {
      // Less than 10km - show with 1 decimal place
      return `${distanceKm.toFixed(1)} km`;
    } else {
      // 10km or more - show with 0 decimal places
      return `${Math.round(distanceKm)} km`;
    }
  }

  /**
   * Validate if location accuracy is acceptable for nearby store finding
   */
  static isAccuracyAcceptable(accuracyMeters: number): boolean {
    return accuracyMeters <= this.MAX_ACCEPTABLE_ACCURACY_METERS;
  }

  /**
   * Find K nearest users to a given user
   */
  static async findNearestUsers(
    userId: string, 
    k: number = 10,
    maxDistance: number = 50 // km
  ): Promise<UserDistance[]> {
    try {
      console.log(`Finding ${k} nearest users within ${maxDistance}km for user: ${userId}`);
      
      // Get current user's location
      const { data: currentUser, error: userError } = await supabase
        .from('USER')
        .select('latitude, longitude')
        .eq('userId', userId)
        .single();

      if (userError) {
        console.error('Error fetching current user:', userError);
        throw new Error('Current user not found');
      }

      if (!currentUser?.latitude || !currentUser?.longitude) {
        throw new Error('Current user location not found. Please update your location first.');
      }

      console.log('Current user location:', currentUser);

      // Get all users with locations (except current user)
      const { data: users, error: usersError } = await supabase
        .from('USER')
        .select('userId, firstname, lastname, email, latitude, longitude, userType')
        .neq('userId', userId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log(`Found ${users?.length || 0} users with locations`);

      if (!users || users.length === 0) {
        return [];
      }

      // Calculate distances and filter
      const usersWithDistance: UserDistance[] = users
        .map(user => ({
          ...user,
          distance: this.calculateDistance(
            currentUser.latitude,
            currentUser.longitude,
            user.latitude,
            user.longitude
          )
        }))
        .filter(user => user.distance <= maxDistance)
  .slice()
  .sort((a, b) => a.distance - b.distance)
        .slice(0, k);

      console.log(`Returning ${usersWithDistance.length} nearest users`);
      return usersWithDistance;
    } catch (error) {
      console.error('Error finding nearest users:', error);
      return [];
    }
  }

  /**
   * Find users within a specific radius from given coordinates
   */
  static async findUsersInRadius(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    userType?: string
  ): Promise<UserDistance[]> {
    try {
      console.log(`Finding users within ${radiusKm}km of coordinates: ${latitude}, ${longitude}`);

      let query = supabase
        .from('USER')
        .select('userId, firstname, lastname, email, latitude, longitude, userType')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Filter by user type if specified
      if (userType) {
        query = query.eq('userType', userType);
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Error fetching users for radius search:', error);
        throw error;
      }

      console.log(`Found ${users?.length || 0} users with locations`);

      if (!users || users.length === 0) {
        return [];
      }

      const usersInRadius = users
        .map(user => ({
          ...user,
          distance: this.calculateDistance(
            latitude,
            longitude,
            user.latitude,
            user.longitude
          )
        }))
        .filter(user => user.distance <= radiusKm)
  .slice()
  .sort((a, b) => a.distance - b.distance);

      console.log(`Returning ${usersInRadius.length} users within radius`);
      return usersInRadius;
    } catch (error) {
      console.error('Error finding users in radius:', error);
      return [];
    }
  }

  /**
   * Find nearest grocery stores (if you add location data to stores)
   */
  static async findNearestStores(
    latitude: number,
    longitude: number,
    k: number = 10,
    maxDistance: number = 25 // km
  ): Promise<StoreDistance[]> {
    try {
      console.log(`Finding ${k} nearest stores within ${maxDistance}km`);

      // Get all stores with locations
      const { data: stores, error } = await supabase
        .from('GROCERY_STORE')
        .select('storeId, storeName, storeAddress, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching stores:', error);
        throw error;
      }

      if (!stores || stores.length === 0) {
        console.log('No stores with location data found');
        return [];
      }

      const storesWithDistance: StoreDistance[] = stores
        .map(store => ({
          ...store,
          distance: this.calculateDistance(
            latitude,
            longitude,
            store.latitude,
            store.longitude
          )
        }))
        .filter(store => store.distance <= maxDistance)
  .slice()
  .sort((a, b) => a.distance - b.distance)
        .slice(0, k);

      console.log(`Returning ${storesWithDistance.length} nearest stores`);
      return storesWithDistance;
    } catch (error) {
      console.error('Error finding nearest stores:', error);
      return [];
    }
  }

  /**
   * Get distance between two users
   */
  static async getDistanceBetweenUsers(
    userId1: string, 
    userId2: string
  ): Promise<number | null> {
    try {
      const { data: users, error } = await supabase
        .from('USER')
        .select('userId, latitude, longitude')
        .in('userId', [userId1, userId2])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error || !users || users.length !== 2) {
        console.error('Could not fetch both users with location data');
        return null;
      }

      const user1 = users.find(u => u.userId === userId1);
      const user2 = users.find(u => u.userId === userId2);

      if (!user1 || !user2) return null;

      return this.calculateDistance(
        user1.latitude,
        user1.longitude,
        user2.latitude,
        user2.longitude
      );
    } catch (error) {
      console.error('Error calculating distance between users:', error);
      return null;
    }
  }

  /**
   * Find users by type within radius (e.g., find nearest DTI officers, store owners, etc.)
   */
  static async findUsersByTypeInRadius(
    latitude: number,
    longitude: number,
    userType: string,
    radiusKm: number = 20
  ): Promise<UserDistance[]> {
    return this.findUsersInRadius(latitude, longitude, radiusKm, userType);
  }
}