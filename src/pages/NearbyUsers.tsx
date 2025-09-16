import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  useIonToast,
  useIonAlert
} from '@ionic/react';
import { 
  peopleOutline, 
  locationOutline, 
  refreshOutline,
  personOutline,
  businessOutline,
  shieldCheckmarkOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { KNNService, UserDistance } from '../services/knnService';
import { LocationService } from '../services/locationService';
import { useHistory } from 'react-router-dom';

interface NearbyUsersProps {
  currentUserId?: string;
}

const NearbyUsers: React.FC<NearbyUsersProps> = ({ currentUserId }) => {
  const [nearbyUsers, setNearbyUsers] = useState<UserDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  const checkLocationPermission = async () => {
    const hasPermission = await LocationService.checkLocationPermissions();
    setLocationPermission(hasPermission);
    
    if (!hasPermission) {
      presentAlert({
        header: 'Location Permission Required',
        message: 'This feature requires location access to find nearby users. Please grant location permission.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Request Permission',
            handler: async () => {
              const location = await LocationService.getCurrentPosition();
              setLocationPermission(!!location);
            }
          }
        ]
      });
    }
  };

  useEffect(() => {
    checkLocationPermission();
  }, [presentAlert, checkLocationPermission]);

  const findNearbyUsers = async (refresh: boolean = false) => {
    if (!currentUserId) {
      presentToast({
        message: 'Please login to find nearby users',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      // Update current user's location first
      const locationUpdated = await LocationService.updateUserLocation(currentUserId);
      
      if (!locationUpdated) {
        presentToast({
          message: 'Could not update your location. Please check GPS and permissions.',
          duration: 3000,
          color: 'warning'
        });
        return;
      }

      // Find nearby users
      const nearby = await KNNService.findNearestUsers(currentUserId, 20, 50); // 20 users within 50km
      setNearbyUsers(nearby);

      if (!refresh) {
        presentToast({
          message: `Found ${nearby.length} nearby users`,
          duration: 2000,
          color: 'success'
        });
      }
    } catch (error) {
      console.error('Error finding nearby users:', error);
      presentToast({
        message: 'Error finding nearby users. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await findNearbyUsers(true);
    event.detail.complete();
  };

  const getFilteredUsers = () => {
    if (selectedSegment === 'all') return nearbyUsers;
    return nearbyUsers.filter(user => user.userType === selectedSegment);
  };

  const getUserTypeIcon = (userType?: string) => {
    switch (userType) {
      case 'store':
        return businessOutline;
      case 'dti':
        return shieldCheckmarkOutline;
      default:
        return personOutline;
    }
  };

  const getUserTypeBadgeColor = (userType?: string) => {
    switch (userType) {
      case 'store':
        return 'success';
      case 'dti':
        return 'warning';
      case 'admin':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getDistanceText = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Nearby Users</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => findNearbyUsers()} disabled={loading}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Location Permission Warning */}
        {!locationPermission && (
          <IonCard color="warning">
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IonIcon icon={locationOutline} />
                <div>
                  <strong>Location Access Required</strong>
                  <p>Please grant location permission to find nearby users.</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Action Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
              Find Users Near You
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Discover other users within 50km of your location using our KNN algorithm.</p>
            <IonButton 
              expand="block" 
              onClick={() => findNearbyUsers()}
              disabled={loading || !locationPermission || !currentUserId}
            >
              {loading ? (
                <>
                  <IonSpinner style={{ marginRight: '8px' }} />
                  Finding Nearby Users...
                </>
              ) : (
                <>
                  <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
                  Find Nearby Users
                </>
              )}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Filter Segments */}
        {nearbyUsers.length > 0 && (
          <IonCard>
            <IonCardContent>
              <IonSegment 
                value={selectedSegment} 
                onIonChange={e => setSelectedSegment(e.detail.value as string)}
              >
                <IonSegmentButton value="all">
                  <IonLabel>All ({nearbyUsers.length})</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="customer">
                  <IonLabel>Customers</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="store">
                  <IonLabel>Stores</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="dti">
                  <IonLabel>DTI</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCardContent>
          </IonCard>
        )}

        {/* Results List */}
        {filteredUsers.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''} Found
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {filteredUsers.map((user) => (
                  <IonItem key={user.userId} button>
                    <IonIcon 
                      icon={getUserTypeIcon(user.userType)} 
                      slot="start" 
                      color="primary"
                    />
                    <IonLabel>
                      <h2>
                        {user.firstname} {user.lastname}
                        {user.userType && (
                          <IonBadge 
                            color={getUserTypeBadgeColor(user.userType)}
                            style={{ marginLeft: '8px', fontSize: '0.7em' }}
                          >
                            {user.userType.toUpperCase()}
                          </IonBadge>
                        )}
                      </h2>
                      <p>{user.email}</p>
                      <p>
                        <IonIcon icon={locationOutline} style={{ marginRight: '4px' }} />
                        {getDistanceText(user.distance)}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Empty State */}
        {nearbyUsers.length === 0 && !loading && (
          <IonCard>
            <IonCardContent style={{ textAlign: 'center', padding: '2rem' }}>
              <IonIcon 
                icon={peopleOutline} 
                style={{ fontSize: '4rem', color: '#ccc', marginBottom: '1rem' }} 
              />
              <h2>No Nearby Users Found</h2>
              <p>
                Try searching again or check if your location services are enabled.
                We search within 50km of your location.
              </p>
              {!currentUserId && (
                <p style={{ color: '#f04141' }}>
                  Please login to use this feature.
                </p>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NearbyUsers;