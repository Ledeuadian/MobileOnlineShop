import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  useIonToast,
  useIonAlert
} from '@ionic/react';
import {
  locationOutline,
  settingsOutline,
  checkmarkCircleOutline,
  warningOutline,
  refreshOutline
} from 'ionicons/icons';
import { LocationRequirementService, LocationRequirementStatus } from '../services/locationRequirementService';
import './LocationRequirement.css';

interface LocationRequirementProps {
  onLocationReady: () => void;
  showSkipOption?: boolean;
  forceCheck?: boolean;
}

const LocationRequirement: React.FC<LocationRequirementProps> = ({
  onLocationReady,
  showSkipOption = false,
  forceCheck = false
}) => {
  const [locationStatus, setLocationStatus] = useState<LocationRequirementStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const checkLocationRequirements = useCallback(async () => {
    setIsChecking(true);
    try {
      console.log('📍 Checking location requirements...');
      const status = await LocationRequirementService.checkLocationRequirements(forceCheck);
      console.log('📍 Location status:', status);
      
      setLocationStatus(status);
      
      if (status.canProceed) {
        // Small delay to show success before proceeding
        setTimeout(() => {
          onLocationReady();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error checking location requirements:', error);
      presentToast({
        message: 'Error checking location services. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsChecking(false);
    }
  }, [forceCheck, onLocationReady, presentToast]);

  useEffect(() => {
    checkLocationRequirements();
  }, [checkLocationRequirements]);

  const handleRetryCheck = () => {
    checkLocationRequirements();
  };

  const handleOpenSettings = () => {
    const instructions = LocationRequirementService.getLocationInstructions();
    const instructionText = instructions.instructions.join('\n');
    
    presentAlert({
      header: instructions.title,
      message: instructionText,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'I\'ve Done This',
          handler: () => {
            setTimeout(() => {
              checkLocationRequirements();
            }, 1000);
          }
        }
      ]
    });
  };

  const handleSkip = () => {
    presentAlert({
      header: 'Skip Location Setup?',
      message: 'Some features of the app may not work properly without location services. Are you sure you want to continue?',
      buttons: [
        {
          text: 'Go Back',
          role: 'cancel'
        },
        {
          text: 'Skip Anyway',
          handler: () => {
            onLocationReady();
          }
        }
      ]
    });
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <IonSpinner color="primary" />;
    }
    
    if (!locationStatus) {
      return <IonIcon icon={locationOutline} color="medium" />;
    }
    
    if (locationStatus.canProceed) {
      return <IonIcon icon={checkmarkCircleOutline} color="success" size="large" />;
    }
    
    return <IonIcon icon={warningOutline} color="warning" size="large" />;
  };

  const getStatusTitle = () => {
    if (isChecking) {
      return 'Checking Location Services...';
    }
    
    if (!locationStatus) {
      return 'Location Services Required';
    }
    
    if (locationStatus.canProceed) {
      return 'Location Services Ready!';
    }
    
    return 'Location Services Required';
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return 'Please wait while we check your location settings...';
    }
    
    if (!locationStatus) {
      return 'This app requires access to your location to provide the best experience.';
    }
    
    if (locationStatus.canProceed) {
      return 'All location requirements are satisfied. You\'ll be redirected automatically.';
    }
    
    return locationStatus.errorMessage || 'Location services need to be enabled to continue.';
  };

  const getActionButtons = () => {
    if (isChecking) {
      return null;
    }
    
    if (locationStatus?.canProceed) {
      return (
        <IonButton 
          expand="block" 
          color="success"
          onClick={onLocationReady}
        >
          <IonIcon icon={checkmarkCircleOutline} slot="start" />
          Continue to App
        </IonButton>
      );
    }
    
    return (
      <div className="location-action-buttons">
        {locationStatus?.actionRequired === 'permissions' && (
          <IonButton 
            expand="block" 
            color="primary"
            onClick={handleRetryCheck}
            style={{ marginBottom: '12px' }}
          >
            <IonIcon icon={refreshOutline} slot="start" />
            Grant Location Permission
          </IonButton>
        )}
        
        {(locationStatus?.actionRequired === 'gps_settings' || locationStatus?.actionRequired === 'both') && (
          <IonButton 
            expand="block" 
            fill="outline"
            color="primary"
            onClick={handleOpenSettings}
            style={{ marginBottom: '12px' }}
          >
            <IonIcon icon={settingsOutline} slot="start" />
            Open Settings Guide
          </IonButton>
        )}
        
        <IonButton 
          expand="block" 
          fill="clear"
          color="primary"
          onClick={handleRetryCheck}
          style={{ marginBottom: '12px' }}
        >
          <IonIcon icon={refreshOutline} slot="start" />
          Check Again
        </IonButton>
        
        {showSkipOption && (
          <IonButton 
            expand="block" 
            fill="clear"
            color="medium"
            onClick={handleSkip}
          >
            Skip for Now
          </IonButton>
        )}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Location Setup</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="location-requirement-content">
        <div className="location-requirement-container">
          
          {/* Main Status Card */}
          <IonCard className="location-status-card">
            <IonCardHeader className="location-status-header">
              <div className="location-status-icon">
                {getStatusIcon()}
              </div>
              <IonCardTitle className="location-status-title">
                {getStatusTitle()}
              </IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <IonText className="location-status-message">
                <p>{getStatusMessage()}</p>
              </IonText>
              
              {getActionButtons()}
            </IonCardContent>
          </IonCard>
          
          {/* Location Requirements Info */}
          {!locationStatus?.canProceed && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
                  Why Location is Required
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>🏪 Find Nearby Stores</h3>
                      <p>Discover grocery stores and markets in your area</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>📍 Store Locations</h3>
                      <p>Get directions and distance to selected stores</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>🎯 Local Pricing</h3>
                      <p>Compare prices from stores near your location</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>🚚 Delivery Services</h3>
                      <p>Check delivery availability in your area</p>
                    </IonLabel>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LocationRequirement;