import { Geolocation } from '@capacitor/geolocation';
import { supabase } from './supabaseService';

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export class LocationService {
  /**
   * Get current position using Capacitor Geolocation
   */
  static async getCurrentPosition(): Promise<UserLocation | null> {
    try {
      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        console.error('Location permission not granted');
        return null;
      }

      // Get current position
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      return {
        userId: '', // Will be set when saving
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Update user location in Supabase database
   */
  static async updateUserLocation(userId: string): Promise<boolean> {
    try {
      const location = await this.getCurrentPosition();
      if (!location) {
        console.error('Could not get current location');
        return false;
      }

      console.log('Updating location for user:', userId, location);

      const { error } = await supabase
        .from('USER')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_updated_at: new Date().toISOString()
        })
        .eq('userId', userId);

      if (error) {
        console.error('Error updating user location:', error);
        return false;
      }

      console.log('User location updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  }

  /**
   * Watch position changes (for continuous location tracking)
   */
  static async watchPosition(
    callback: (location: UserLocation | null) => void
  ): Promise<string | null> {
    try {
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        console.error('Location permission not granted');
        return null;
      }

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3600000 // 1 hour
        },
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            callback(null);
            return;
          }

          if (position) {
            callback({
              userId: '',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            });
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error setting up position watch:', error);
      return null;
    }
  }

  /**
   * Clear position watch
   */
  static async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing position watch:', error);
    }
  }

  /**
   * Check if location services are available and permissions granted
   */
  static async checkLocationPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }
}