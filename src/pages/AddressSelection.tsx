import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonList, IonItem, IonIcon,
  IonRadio, IonRadioGroup
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';

type Address = { addressId: number; Name: string; Contact: string; Address: string; isDefault?: boolean };

const AddressSelection: React.FC = () => {
  const history = useHistory();
  const [addresses, setAddresses] = useState<Array<Address>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('USER')
          .select('userId')
          .eq('email', user.email)
          .single();

        const publicUserId = userData?.userId;
        if (!publicUserId) return;

        // Fetch all columns and sort client-side to avoid PostgREST quoting/order issues
        const { data } = await supabase
          .from('DELIVERY_ADDRESS')
          .select('*')
          .eq('userId', publicUserId);

        const list = (data || []) as Address[];
        // Sort so default addresses come first
        list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setAddresses(list);
        const defaultAddr = list.find((a: Address) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.addressId : null);
      } catch (err) {
        console.error('Error loading addresses', err);
      }
    };

    load();
  }, []);

  // choose() removed; use the radio + Use selected address button instead

  const useSelected = () => {
    if (!selectedAddressId) return;
    const addr = addresses.find(a => a.addressId === selectedAddressId);
    if (!addr) return;
    history.push('/checkout', { selectedAddress: addr });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Address Selection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonRadioGroup value={selectedAddressId?.toString() || ''} onIonChange={e => setSelectedAddressId(Number(e.detail.value))}>
            {addresses.map((a) => (
              <IonItem key={a.addressId} button lines="full">
                <IonRadio slot="end" value={a.addressId.toString()} />
                <div style={{ width: '100%' }}>
                  <div style={{ fontWeight: 700 }}>{a.Name} <small style={{ color: '#666' }}>{a.isDefault ? '(Default)' : ''}</small></div>
                  <div style={{ fontSize: 13, color: '#666' }}>{a.Contact}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{a.Address}</div>
                </div>
              </IonItem>
            ))}
          </IonRadioGroup>
        </IonList>

        <div style={{ padding: 16, display: 'flex', gap: 8 }}>
          <IonButton expand="block" onClick={() => history.push('/add-address')}>Add a new address</IonButton>
          <IonButton expand="block" color="primary" onClick={useSelected} disabled={!selectedAddressId}>Use selected address</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddressSelection;
