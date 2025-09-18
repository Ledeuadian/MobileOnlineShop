import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationRequirementStatus {
  isLocationRequired: boolean;
  hasPermission: boolean;
  isGpsEnabled: boolean;
  canProceed: boolean;
  errorMessage?: string;
  actionRequired?: 'permissions' | 'gps_settings' | 'both' | 'none';
}

export class LocationRequirementService {
  private static readonly LOCATION_TIMEOUT = 15000; // 15 seconds
  private static readonly HIGH_ACCURACY_TIMEOUT = 8000; // 8 seconds for high accuracy attempt

  /**
   * Check all location requirements before allowing app to proceed
   */
  static async checkLocationRequirements(forceCheck: boolean = false): Promise<LocationRequirementStatus> {
    try {
      console.log('🗺️ Checking location requirements...');

      // Skip location check in development/web mode unless forced
      if (!forceCheck && !Capacitor.isNativePlatform()) {
        console.log('📱 Running in web mode, skipping location requirements');
        return {
          isLocationRequired: false,
          hasPermission: true,
          isGpsEnabled: true,
          canProceed: true,
          actionRequired: 'none'
        };
      }

      // Step 1: Check location permissions
      const permissionStatus = await this.checkLocationPermissions();
      
      if (!permissionStatus.hasPermission) {
        return {
          isLocationRequired: true,
          hasPermission: false,
          isGpsEnabled: false,
          canProceed: false,
          errorMessage: permissionStatus.errorMessage,
          actionRequired: 'permissions'
        };
      }

      // Step 2: Check if GPS/location services are actually working
      const gpsStatus = await this.checkGpsAvailability();
      
      if (!gpsStatus.isGpsEnabled) {
        return {
          isLocationRequired: true,
          hasPermission: true,
          isGpsEnabled: false,
          canProceed: false,
          errorMessage: gpsStatus.errorMessage,
          actionRequired: 'gps_settings'
        };
      }

      // Step 3: All checks passed
      console.log('✅ All location requirements satisfied');
      return {
        isLocationRequired: true,
        hasPermission: true,
        isGpsEnabled: true,
        canProceed: true,
        actionRequired: 'none'
      };

    } catch (error) {
      console.error('❌ Error checking location requirements:', error);
      return {
        isLocationRequired: true,
        hasPermission: false,
        isGpsEnabled: false,
        canProceed: false,
        errorMessage: 'Unable to verify location services. Please ensure GPS is enabled and try again.',
        actionRequired: 'both'
      };
    }
  }

  /**
   * Check if location permissions are granted
   */
  private static async checkLocationPermissions(): Promise<{ hasPermission: boolean; errorMessage?: string }> {
    try {
      console.log('🔐 Checking location permissions...');
      
      // First check current permission status
      const currentPermissions = await Geolocation.checkPermissions();
      console.log('📍 Current permissions:', currentPermissions);

      if (currentPermissions.location === 'granted') {
        return { hasPermission: true };
      }

      // If not granted, try to request permissions
      console.log('🔑 Requesting location permissions...');
      const requestedPermissions = await Geolocation.requestPermissions();
      console.log('📍 Requested permissions result:', requestedPermissions);

      if (requestedPermissions.location === 'granted') {
        return { hasPermission: true };
      }

      // Permission denied
      let errorMessage = 'Location permission is required for this app to work properly.';
      
      if (requestedPermissions.location === 'denied') {
        errorMessage = 'Location permission was denied. Please enable location access in your device settings.';
      }

      return { 
        hasPermission: false, 
        errorMessage 
      };

    } catch (error) {
      console.error('❌ Error checking location permissions:', error);
      return { 
        hasPermission: false, 
        errorMessage: 'Unable to check location permissions. Please ensure your device supports location services.' 
      };
    }
  }

  /**
   * Check if GPS is actually available and working
   */
  private static async checkGpsAvailability(): Promise<{ isGpsEnabled: boolean; errorMessage?: string }> {
    try {
      console.log('🛰️ Testing GPS availability...');

      // Try to get current position with high accuracy first
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: this.HIGH_ACCURACY_TIMEOUT,
          maximumAge: 0 // Force fresh reading
        });

        if (position?.coords) {
          console.log('✅ High accuracy GPS is working:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          return { isGpsEnabled: true };
        }
      } catch (highAccuracyError) {
        console.log('⚠️ High accuracy GPS failed, trying low accuracy...', highAccuracyError);
        
        // Try with lower accuracy as fallback
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: this.LOCATION_TIMEOUT,
            maximumAge: 60000 // Allow 1 minute old readings
          });

          if (position?.coords) {
            console.log('✅ Low accuracy location is working:', {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            return { isGpsEnabled: true };
          }
        } catch (lowAccuracyError) {
          console.error('❌ Both high and low accuracy location failed:', {
            highAccuracy: highAccuracyError,
            lowAccuracy: lowAccuracyError
          });
        }
      }

      // If we get here, GPS is not working
      return {
        isGpsEnabled: false,
        errorMessage: 'GPS/Location services are not working properly. Please enable location services in your device settings and ensure you have a clear view of the sky if outdoors.'
      };

    } catch (error) {
      console.error('❌ Error testing GPS availability:', error);
      return {
        isGpsEnabled: false,
        errorMessage: 'Unable to test GPS functionality. Please ensure location services are enabled in your device settings.'
      };
    }
  }

  /**
   * Request user to enable location services through device settings
   */
  static async openLocationSettings(): Promise<void> {
    try {
      console.log('⚙️ Attempting to open location settings...');
      
      if (Capacitor.isNativePlatform()) {
        // On native platforms, try to open location settings
        // This requires additional plugins, but we can instruct the user
        console.log('📱 Native platform detected');
        // Note: Opening settings directly requires additional plugins like @capacitor-community/native-settings
        // For now, we'll provide instructions to the user
      }
    } catch (error) {
      console.error('❌ Error opening location settings:', error);
    }
  }

  /**
   * Get detailed location requirement instructions for the user
   */
  static getLocationInstructions(platform: string = 'android'): {
    title: string;
    instructions: string[];
    buttonText: string;
  } {
    if (platform.toLowerCase().includes('ios')) {
      return {
        title: 'Enable Location Services',
        instructions: [
          '1. Open iPhone Settings app',
          '2. Tap "Privacy & Security"',
          '3. Tap "Location Services"',
          '4. Turn ON "Location Services"',
          '5. Find "Grocerlytics" in the app list',
          '6. Tap on it and select "While Using App" or "Always"',
          '7. Return to the app'
        ],
        buttonText: 'Open Settings'
      };
    } else {
      return {
        title: 'Enable Location Services',
        instructions: [
          '1. Open Android Settings',
          '2. Go to "Location" or "Location Services"',
          '3. Turn ON location services',
          '4. Go to "App Permissions" or "Location Permissions"',
          '5. Find "Grocerlytics" and grant location permission',
          '6. Ensure "High Accuracy" mode is enabled',
          '7. Return to the app'
        ],
        buttonText: 'Open Settings'
      };
    }
  }

  /**
   * Quick check if location requirements are already satisfied (for app startup)
   */
  static async isLocationReady(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true; // Skip in web mode
      }

      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        return false;
      }

      // Quick GPS test with short timeout
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000 // 5 minutes
        });
        return !!position?.coords;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }
}