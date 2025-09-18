import React, { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonAlert,
  IonSpinner,
  IonText
} from '@ionic/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { close, locationSharp } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onLocationSelected: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number };
}

// Custom pin icon for better visibility
const customPinIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDMuNUM4LjA5NjQ0IDMuNSAyLjUgOS4wOTY0NCAyLjUgMTZDMi41IDI0LjI1IDE1IDM2LjUgMTUgMzYuNUMxNSAzNi41IDI3LjUgMjQuMjUgMjcuNSAxNkMyNy41IDkuMDk2NDQgMjEuOTAzNiAzLjUgMTUgMy41WiIgZmlsbD0iIzMzODhGRiIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNiIgcj0iNSIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }: { 
  position: { lat: number; lng: number } | null; 
  setPosition: (pos: { lat: number; lng: number }) => void; 
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={customPinIcon} />
  ) : null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onDidDismiss,
  onLocationSelected,
  initialPosition
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialPosition?.lat || 14.5995, // Default to Manila, Philippines
    initialPosition?.lng || 120.9842
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's current location when modal opens
  useEffect(() => {
    if (isOpen && !initialPosition) {
      setIsLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setMapCenter([latitude, longitude]);
            setIsLoading(false);
          },
          (error) => {
            console.log('Geolocation error:', error);
            setIsLoading(false);
            // Keep default location (Manila)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        setIsLoading(false);
      }
    }
  }, [isOpen, initialPosition]);

  const handleSaveLocation = () => {
    if (position) {
      onLocationSelected(position.lat, position.lng);
      setShowConfirmAlert(false);
      onDidDismiss();
    }
  };

  const handlePositionChange = (newPos: { lat: number; lng: number }) => {
    setPosition(newPos);
    // Automatically show confirmation when user places a pin
    setTimeout(() => setShowConfirmAlert(true), 100);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} className="location-picker-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Select Location</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={onDidDismiss}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ position: 'relative', height: '100%', minHeight: '400px' }}>
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <IonSpinner name="crescent" />
                <IonText>Getting your location...</IonText>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                doubleClickZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={handlePositionChange} />
              </MapContainer>
            )}
            
            {/* Instruction overlay */}
            <div 
              className="location-instruction"
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                textAlign: 'center'
              }}
            >
              <IonText>
                <p style={{ margin: '0', fontSize: '14px', color: '#333' }}>
                  <IonIcon icon={locationSharp} style={{ marginRight: '8px' }} />
                  Tap anywhere on the map to place your pin
                </p>
              </IonText>
            </div>

            {/* Current location button */}
            <IonButton
              fill="solid"
              size="small"
              onClick={() => {
                setIsLoading(true);
                navigator.geolocation?.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    setPosition({ lat: latitude, lng: longitude });
                    setIsLoading(false);
                    setTimeout(() => setShowConfirmAlert(true), 100);
                  },
                  () => setIsLoading(false)
                );
              }}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                '--border-radius': '50%',
                width: '50px',
                height: '50px'
              }}
            >
              <IonIcon icon={locationSharp} />
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => setShowConfirmAlert(false)}
        header={'Save Location?'}
        message={position ? 
          `Do you want to save this location?\n\nLatitude: ${position.lat.toFixed(6)}\nLongitude: ${position.lng.toFixed(6)}` : 
          'No location selected'
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowConfirmAlert(false)
          },
          {
            text: 'Save Location',
            handler: handleSaveLocation,
            cssClass: 'alert-button-confirm'
          }
        ]}
      />

      <style>{`
        .location-picker-modal {
          --height: 90vh;
          --max-height: none;
        }
        
        @media (max-width: 768px) {
          .location-picker-modal {
            --height: 100vh;
          }
          
          .location-instruction {
            font-size: 12px !important;
            padding: 8px !important;
          }
        }
        
        .alert-button-confirm {
          color: #3880ff !important;
          font-weight: bold;
        }
        
        .leaflet-container {
          height: 100% !important;
          touch-action: manipulation;
        }
        
        .leaflet-control-zoom {
          margin-top: 80px !important;
        }
        
        /* Mobile touch optimizations */
        .leaflet-marker-icon {
          cursor: pointer;
        }
        
        .leaflet-clickable {
          cursor: pointer;
        }
        
        /* Improve marker visibility on mobile */
        .leaflet-marker-shadow {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
      `}</style>
    </>
  );
};

export default LocationPicker;