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
  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * 
      Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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