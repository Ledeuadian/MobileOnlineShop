import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonItem, IonLabel, IonInput, IonTextarea, IonCard, IonCardContent, IonToast
} from '@ionic/react';
import LocationPicker from '../components/LocationPicker';

const AddAddress: React.FC = () => {
  const history = useHistory();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const openPicker = () => setPickerOpen(true);
  const closePicker = () => setPickerOpen(false);

  const onLocationSelected = (lat: number, lng: number) => {
    setLatLng({ lat, lng });
  };

  const saveAddress = useCallback(async () => {
    if (!name.trim() || !contact.trim() || !address.trim()) {
      setToast({ show: true, message: 'Please fill all fields' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast({ show: true, message: 'Not authenticated' });
        return;
      }

      const { data: userData } = await supabase
        .from('USER')
        .select('userId')
        .eq('email', user.email)
        .single();

      const publicUserId = userData?.userId;
      if (!publicUserId) {
        setToast({ show: true, message: 'Unable to determine user id' });
        return;
      }

      // Database columns in DELIVERY_ADDRESS use Titlecase for these columns
      type AddressPayload = { Name: string; Contact: string; Address: string; userId: number; Longitude?: number; Latitude?: number };
      const payload: AddressPayload = {
        Name: name.trim(),
        Contact: contact.trim(),
        Address: address.trim(),
        userId: publicUserId
      };

      if (latLng) {
        payload.Longitude = latLng.lng;
        payload.Latitude = latLng.lat;
      }

      const { error } = await supabase.from('DELIVERY_ADDRESS').insert(payload);
      if (error) {
        console.error('Error inserting address', error);
        setToast({ show: true, message: 'Error saving address' });
        return;
      }

      // Show success toast then return to address selection so user sees the confirmation
      setToast({ show: true, message: 'Address saved' });
      // small delay to allow toast to be visible
      setTimeout(() => {
        history.replace('/address-selection');
      }, 1200);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Error saving address' });
    }
  }, [name, contact, address, latLng, history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>Back</IonButton>
          </IonButtons>
          <IonTitle>Add Address</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput value={name} onIonChange={(e) => setName(e.detail.value!)} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Contact #</IonLabel>
              <IonInput value={contact} onIonChange={(e) => setContact(e.detail.value!)} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Address</IonLabel>
              <IonTextarea value={address} onIonChange={(e) => setAddress(e.detail.value!)} />
            </IonItem>

            <div style={{ marginTop: 12 }}>
              <IonButton expand="block" onClick={openPicker}>Pick on map</IonButton>
              {latLng && (
                <div style={{ marginTop: 8, color: '#666' }}>Lat: {latLng.lat.toFixed(6)}, Lng: {latLng.lng.toFixed(6)}</div>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <IonButton expand="block" color="primary" onClick={saveAddress}>Save Address</IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <LocationPicker isOpen={pickerOpen} onDidDismiss={closePicker} onLocationSelected={onLocationSelected} />

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default AddAddress;
