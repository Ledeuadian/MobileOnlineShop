import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonToast,
  IonAlert,
  IonModal
} from '@ionic/react';
import { checkmarkCircleOutline, closeOutline, documentTextOutline, chevronDownOutline, chevronUpOutline, imageOutline, closeCircle } from 'ionicons/icons';
import { supabase } from '../services/supabaseService';
import { useHistory } from 'react-router-dom';
import './StoreVerification.css';

interface PendingStore {
  storeId: number;
  storeName: string;
  ownerEmail: string;
  ownerName: string;
  location: string;
  storePhone: string;
  storeEmail: string;
  birPermit: string;
  dtiPermit: string;
  birPermitImage?: string;
  dtiPermitImage?: string;
  verified: boolean;
}

const StoreVerification: React.FC = () => {
  const [stores, setStores] = useState<PendingStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ storeId: number; approve: boolean; storeName: string } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const history = useHistory();

  useEffect(() => {
    fetchPendingStores();
  }, []);

  const toggleStoreDetails = (storeId: number) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedStores(newExpanded);
  };

  const handleVerifyStoreClick = (storeId: number, approve: boolean, storeName: string) => {
    setPendingAction({ storeId, approve, storeName });
    setShowConfirmAlert(true);
  };

  const handleViewImage = (imageUrl: string, title: string) => {
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const confirmVerifyStore = async () => {
    if (!pendingAction) return;

    const { storeId, approve } = pendingAction;

    try {
      const { error } = await supabase
        .from('GROCERY_STORE')
        .update({ verified: approve })
        .eq('storeId', storeId);

      if (error) throw error;

      // Show success toast
      setToastMessage(approve ? 'Store successfully verified and approved!' : 'Store verification rejected.');
      setToastColor(approve ? 'success' : 'danger');
      setShowToast(true);

      // Refresh the list
      fetchPendingStores();
    } catch (error) {
      console.error('Error verifying store:', error);
      setToastMessage('Failed to process verification. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setShowConfirmAlert(false);
      setPendingAction(null);
    }
  };

  const fetchPendingStores = async () => {
    setLoading(true);
    try {
      // Fetch all pending stores with permits
      const { data: storesData, error: storesError } = await supabase
        .from('GROCERY_STORE')
        .select('*')
        .eq('verified', false)
        .not('bir_permit', 'is', null)
        .not('dti_permit', 'is', null)
        .order('storeId', { ascending: false });

      if (storesError) throw storesError;
      if (!storesData || storesData.length === 0) {
        setStores([]);
        setLoading(false);
        return;
      }

      // Get all unique owner_ids
      const ownerIds = [...new Set(storesData.map((store: any) => store.owner_id))];
      // Fetch user info for these owner_ids
      const { data: usersData, error: usersError } = await supabase
        .from('USER')
        .select('auth_user_id, email, firstname, lastname')
        .in('auth_user_id', ownerIds);

      if (usersError) throw usersError;

      // Map user info by auth_user_id
      const userMap: any = {};
      usersData?.forEach((user: any) => {
        userMap[user.auth_user_id] = user;
      });

      // Transform store data with user info
      const transformedData: PendingStore[] = storesData.map((store: any) => {
        const user = userMap[store.owner_id] || {};
        let ownerName = 'N/A';
        if (user.firstname || user.lastname) {
          ownerName = ((user.firstname ? user.firstname : '') + ' ' + (user.lastname ? user.lastname : '')).trim();
          if (!ownerName) ownerName = 'N/A';
        }
        return {
          storeId: store.storeId,
          storeName: store.name || 'N/A',
          ownerEmail: user.email || 'N/A',
          ownerName: ownerName,
          location: store.location || 'N/A',
          storePhone: store.store_phone || 'N/A',
          storeEmail: store.store_email || 'N/A',
          birPermit: store.bir_permit || 'N/A',
          dtiPermit: store.dti_permit || 'N/A',
          birPermitImage: store.bir_permit_image,
          dtiPermitImage: store.dti_permit_image,
          verified: store.verified
        };
      });

      setStores(transformedData);
    } catch (error) {
      console.error('Error fetching pending stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin-dashboard" />
          </IonButtons>
          <IonTitle>Store Verifications</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="verification-header">
          <h2>Pending Store Verifications</h2>
          <p>Review and verify store permits (BIR & DTI)</p>
        </div>
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading pending verifications...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '64px', color: '#28a745' }} />
            <h3>All Caught Up!</h3>
            <p>No pending store verifications at this time.</p>
            <IonButton onClick={() => history.push('/admin-dashboard')}>
              Back to Dashboard
            </IonButton>
          </div>
        ) : (
          <IonList>
            {stores.map((store) => (
              <IonCard key={store.storeId} className="store-verification-card">
                <IonCardContent>
                  <div className="store-header" onClick={() => toggleStoreDetails(store.storeId)} style={{ cursor: 'pointer' }}>
                    <div className="store-title-section">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IonIcon icon={expandedStores.has(store.storeId) ? chevronUpOutline : chevronDownOutline} />
                        <h3>{store.storeName}</h3>
                      </div>
                      <IonBadge color="warning">Pending Verification</IonBadge>
                    </div>
                  </div>
                  
                  {expandedStores.has(store.storeId) && (
                    <>
                      <div className="store-details">
                        <div className="detail-section">
                          <h4>Owner Information</h4>
                          <IonList lines="none" className="info-list">
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">Owner Name</p>
                                <h3>{store.ownerName}</h3>
                              </IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">Owner Email</p>
                                <h3>{store.ownerEmail}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonList>
                        </div>
                        <div className="detail-section">
                          <h4>Store Information</h4>
                          <IonList lines="none" className="info-list">
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">Location</p>
                                <h3>{store.location}</h3>
                              </IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">Phone</p>
                                <h3>{store.storePhone}</h3>
                              </IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">Email</p>
                                <h3>{store.storeEmail}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonList>
                        </div>
                        <div className="detail-section permits-section">
                          <h4>
                            <IonIcon icon={documentTextOutline} /> Permits
                          </h4>
                          <IonList lines="none" className="info-list">
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">BIR Permit Number</p>
                                <h3 className="permit-number">{store.birPermit}</h3>
                                {store.birPermitImage && (
                                  <IonButton 
                                    size="small" 
                                    fill="outline" 
                                    color="primary"
                                    onClick={() => handleViewImage(store.birPermitImage!, 'BIR Permit')}
                                    style={{ marginTop: '8px' }}
                                  >
                                    <IonIcon icon={imageOutline} slot="start" />
                                    View Image
                                  </IonButton>
                                )}
                              </IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonLabel>
                                <p className="detail-label">DTI Permit Number</p>
                                <h3 className="permit-number">{store.dtiPermit}</h3>
                                {store.dtiPermitImage && (
                                  <IonButton 
                                    size="small" 
                                    fill="outline" 
                                    color="primary"
                                    onClick={() => handleViewImage(store.dtiPermitImage!, 'DTI Permit')}
                                    style={{ marginTop: '8px' }}
                                  >
                                    <IonIcon icon={imageOutline} slot="start" />
                                    View Image
                                  </IonButton>
                                )}
                              </IonLabel>
                            </IonItem>
                          </IonList>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <IonButton
                          expand="block"
                          color="success"
                          onClick={() => handleVerifyStoreClick(store.storeId, true, store.storeName)}
                        >
                          <IonIcon icon={checkmarkCircleOutline} slot="start" />
                          Approve & Verify
                        </IonButton>
                        <IonButton
                          expand="block"
                          color="danger"
                          fill="outline"
                          onClick={() => handleVerifyStoreClick(store.storeId, false, store.storeName)}
                        >
                          <IonIcon icon={closeOutline} slot="start" />
                          Reject
                        </IonButton>
                      </div>
                    </>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>

      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => setShowConfirmAlert(false)}
        header={pendingAction?.approve ? 'Approve Store Verification' : 'Reject Store Verification'}
        message={
          pendingAction?.approve
            ? `Are you sure you want to approve and verify "${pendingAction.storeName}"? This will grant the store access to the platform.`
            : `Are you sure you want to reject "${pendingAction?.storeName}"? The store will need to resubmit their verification.`
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: pendingAction?.approve ? 'Approve' : 'Reject',
            handler: () => {
              confirmVerifyStore();
            }
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        position="top"
      />

      {/* Image Viewing Modal */}
      <IonModal 
        isOpen={showImageModal} 
        onDidDismiss={() => setShowImageModal(false)}
        className="image-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{selectedImage?.title}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowImageModal(false)}>
                <IonIcon icon={closeCircle} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedImage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              backgroundColor: '#000'
            }}>
              <img 
                src={selectedImage.url} 
                alt={selectedImage.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default StoreVerification;
