import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonTextarea,
  IonLabel,
  IonBadge,
  IonLoading,
  IonToast,
  useIonAlert
} from '@ionic/react';
import { arrowBackOutline, documentTextOutline, sendOutline, warningOutline } from 'ionicons/icons';
import './ClarificationDetails.css';

interface Clarification {
  clarificationId: number;
  storeId: number;
  itemId: number | null;
  dtiUserId: number;
  title: string;
  message: string;
  attachmentUrl: string | null;
  status: string;
  storeResponse: string | null;
  supplierInvoiceUrl: string | null;
  deliveryReceiptUrl: string | null;
  proofOfCostUrl: string | null;
  freightJustificationUrl: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ItemDetails {
  name: string;
  price: number;
}

const ClarificationDetails: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [presentAlert] = useIonAlert();
  
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // File upload states
  const [supplierInvoice, setSupplierInvoice] = useState<File | null>(null);
  const [deliveryReceipt, setDeliveryReceipt] = useState<File | null>(null);
  const [proofOfCost, setProofOfCost] = useState<File | null>(null);
  const [freightJustification, setFreightJustification] = useState<File | null>(null);
  
  const [supplierInvoicePreview, setSupplierInvoicePreview] = useState<string | null>(null);
  const [deliveryReceiptPreview, setDeliveryReceiptPreview] = useState<string | null>(null);
  const [proofOfCostPreview, setProofOfCostPreview] = useState<string | null>(null);
  const [freightJustificationPreview, setFreightJustificationPreview] = useState<string | null>(null);

  useEffect(() => {
    loadClarificationDetails();
  }, [id]);

  const loadClarificationDetails = async () => {
    try {
      setLoading(true);

      // Fetch clarification details
      const { data: clarificationData, error: clarificationError } = await supabase
        .from('DTI_CLARIFICATIONS')
        .select('*')
        .eq('clarificationId', parseInt(id))
        .single();

      if (clarificationError) {
        console.error('Error loading clarification:', clarificationError);
        return;
      }

      setClarification(clarificationData);
      setResponse(clarificationData.storeResponse || '');

      // Set existing file URLs if they exist
      if (clarificationData.supplierInvoiceUrl) {
        setSupplierInvoicePreview(clarificationData.supplierInvoiceUrl);
      }
      if (clarificationData.deliveryReceiptUrl) {
        setDeliveryReceiptPreview(clarificationData.deliveryReceiptUrl);
      }
      if (clarificationData.proofOfCostUrl) {
        setProofOfCostPreview(clarificationData.proofOfCostUrl);
      }
      if (clarificationData.freightJustificationUrl) {
        setFreightJustificationPreview(clarificationData.freightJustificationUrl);
      }

      // Fetch item details if itemId exists
      if (clarificationData.itemId) {
        const { data: itemData } = await supabase
          .from('ITEMS_IN_STORE')
          .select('name, price')
          .eq('storeItemId', clarificationData.itemId)
          .single();

        if (itemData) {
          setItemDetails(itemData);
        }
      }

      // Mark as read if not already
      if (!clarificationData.isRead) {
        await supabase
          .from('DTI_CLARIFICATIONS')
          .update({ isRead: true })
          .eq('clarificationId', parseInt(id));
      }
    } catch (error) {
      console.error('Error loading clarification details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'receipt' | 'cost' | 'freight') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToastMessage('File size must be less than 10MB');
      setShowToast(true);
      return;
    }

    // Set file based on type
    switch (type) {
      case 'invoice':
        setSupplierInvoice(file);
        setSupplierInvoicePreview(URL.createObjectURL(file));
        break;
      case 'receipt':
        setDeliveryReceipt(file);
        setDeliveryReceiptPreview(URL.createObjectURL(file));
        break;
      case 'cost':
        setProofOfCost(file);
        setProofOfCostPreview(URL.createObjectURL(file));
        break;
      case 'freight':
        setFreightJustification(file);
        setFreightJustificationPreview(URL.createObjectURL(file));
        break;
    }
  };

  const removeFile = (type: 'invoice' | 'receipt' | 'cost' | 'freight') => {
    switch (type) {
      case 'invoice':
        setSupplierInvoice(null);
        setSupplierInvoicePreview(null);
        break;
      case 'receipt':
        setDeliveryReceipt(null);
        setDeliveryReceiptPreview(null);
        break;
      case 'cost':
        setProofOfCost(null);
        setProofOfCostPreview(null);
        break;
      case 'freight':
        setFreightJustification(null);
        setFreightJustificationPreview(null);
        break;
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      setToastMessage('Please enter a response before submitting');
      setShowToast(true);
      return;
    }

    presentAlert({
      header: 'Submit Response',
      message: 'Are you sure you want to submit this response to DTI?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit',
          handler: async () => {
            try {
              setSubmitting(true);

              // Upload files if they exist
              let supplierInvoiceUrl = clarification?.supplierInvoiceUrl || null;
              let deliveryReceiptUrl = clarification?.deliveryReceiptUrl || null;
              let proofOfCostUrl = clarification?.proofOfCostUrl || null;
              let freightJustificationUrl = clarification?.freightJustificationUrl || null;

              if (supplierInvoice) {
                const url = await uploadFile(supplierInvoice, 'clarifications/supplier-invoices');
                if (url) supplierInvoiceUrl = url;
              }

              if (deliveryReceipt) {
                const url = await uploadFile(deliveryReceipt, 'clarifications/delivery-receipts');
                if (url) deliveryReceiptUrl = url;
              }

              if (proofOfCost) {
                const url = await uploadFile(proofOfCost, 'clarifications/proof-of-cost');
                if (url) proofOfCostUrl = url;
              }

              if (freightJustification) {
                const url = await uploadFile(freightJustification, 'clarifications/freight-justification');
                if (url) freightJustificationUrl = url;
              }

              const { error } = await supabase
                .from('DTI_CLARIFICATIONS')
                .update({
                  storeResponse: response,
                  supplierInvoiceUrl,
                  deliveryReceiptUrl,
                  proofOfCostUrl,
                  freightJustificationUrl,
                  status: 'responded',
                  updatedAt: new Date().toISOString()
                })
                .eq('clarificationId', parseInt(id));

              if (error) {
                throw error;
              }

              setToastMessage('Response submitted successfully');
              setShowToast(true);

              // Reload details
              await loadClarificationDetails();
            } catch (error) {
              console.error('Error submitting response:', error);
              setToastMessage('Failed to submit response. Please try again.');
              setShowToast(true);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'responded': return 'primary';
      case 'resolved': return 'success';
      default: return 'medium';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openAttachment = () => {
    if (clarification?.attachmentUrl) {
      window.open(clarification.attachmentUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading clarification details..." />
      </IonPage>
    );
  }

  if (!clarification) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Notice Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Clarification not found</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>DTI Notice Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="clarification-details-content">
        <div className="clarification-details-container">
          {/* Notice Header */}
          <IonCard className="notice-header-card">
            <IonCardContent>
              <div className="notice-icon-wrapper">
                <IonIcon icon={warningOutline} className="notice-warning-icon" />
              </div>
              <h2 className="notice-title">{clarification.title}</h2>
              <IonBadge color={getStatusColor(clarification.status)} className="status-badge">
                {clarification.status.toUpperCase()}
              </IonBadge>
              <p className="notice-date">{formatDate(clarification.createdAt)}</p>
            </IonCardContent>
          </IonCard>

          {/* Product Information */}
          {itemDetails && (
            <IonCard className="product-info-card">
              <IonCardHeader>
                <IonCardTitle>Product Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="product-detail-row">
                  <span className="detail-label">Product Name:</span>
                  <span className="detail-value">{itemDetails.name}</span>
                </div>
                <div className="product-detail-row">
                  <span className="detail-label">Current Price:</span>
                  <span className="detail-value price">₱{itemDetails.price.toFixed(2)}</span>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* DTI Message */}
          <IonCard className="message-card">
            <IonCardHeader>
              <IonCardTitle>DTI Message</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="message-content">
                {clarification.message.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>

              {/* Attachment */}
              {clarification.attachmentUrl && (
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={openAttachment}
                  className="attachment-button"
                >
                  <IonIcon icon={documentTextOutline} slot="start" />
                  View Attachment
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>

          {/* Store Response Section */}
          <IonCard className="response-card">
            <IonCardHeader>
              <IonCardTitle>Your Response</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {clarification.status === 'resolved' ? (
                <div className="resolved-notice">
                  <IonIcon icon={warningOutline} style={{ fontSize: '24px', color: '#10dc60' }} />
                  <p>This clarification has been resolved by DTI.</p>
                </div>
              ) : (
                <>
                  <IonLabel position="stacked" className="response-label">
                    Enter your response to DTI:
                  </IonLabel>
                  <IonTextarea
                    value={response}
                    onIonInput={(e) => setResponse(e.detail.value || '')}
                    placeholder="Explain your position, provide evidence, or corrective actions taken..."
                    rows={8}
                    className="response-textarea"
                    disabled={clarification.status === 'responded'}
                  />

                  {/* File Upload Section */}
                  {clarification.status === 'pending' && (
                    <div className="documents-upload-section">
                      <h3 className="upload-section-title">Upload Supporting Documents</h3>
                      <p className="upload-section-description">
                        Attach documents to support your response (optional but recommended)
                      </p>

                      {/* Supplier Invoice */}
                      <div className="document-upload-item">
                        <label className="document-label">Supplier invoices:</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e, 'invoice')}
                          style={{ display: 'none' }}
                          id="supplier-invoice-input"
                        />
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={() => document.getElementById('supplier-invoice-input')?.click()}
                        >
                          Add File
                        </IonButton>
                        {supplierInvoicePreview && (
                          <div className="file-preview">
                            <span className="file-name">Uploaded (1/1)</span>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => removeFile('invoice')}
                            >
                              Remove
                            </IonButton>
                          </div>
                        )}
                        <div className="upload-status">
                          Status: {supplierInvoicePreview ? 'Uploaded (1/1)' : 'Missing (0/1)'}
                        </div>
                      </div>

                      {/* Delivery Receipts */}
                      <div className="document-upload-item">
                        <label className="document-label">Delivery receipts:</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e, 'receipt')}
                          style={{ display: 'none' }}
                          id="delivery-receipt-input"
                        />
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={() => document.getElementById('delivery-receipt-input')?.click()}
                        >
                          Add File
                        </IonButton>
                        {deliveryReceiptPreview && (
                          <div className="file-preview">
                            <span className="file-name">Uploaded (1/1)</span>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => removeFile('receipt')}
                            >
                              Remove
                            </IonButton>
                          </div>
                        )}
                        <div className="upload-status">
                          Status: {deliveryReceiptPreview ? 'Uploaded (1/1)' : 'Missing (0/1)'}
                        </div>
                      </div>

                      {/* Proof of Increased Cost */}
                      <div className="document-upload-item">
                        <label className="document-label">Proof of increased cost:</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e, 'cost')}
                          style={{ display: 'none' }}
                          id="proof-cost-input"
                        />
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={() => document.getElementById('proof-cost-input')?.click()}
                        >
                          Add File
                        </IonButton>
                        {proofOfCostPreview && (
                          <div className="file-preview">
                            <span className="file-name">Uploaded (1/1)</span>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => removeFile('cost')}
                            >
                              Remove
                            </IonButton>
                          </div>
                        )}
                        <div className="upload-status">
                          Status: {proofOfCostPreview ? 'Uploaded (1/1)' : 'Missing (0/1)'}
                        </div>
                      </div>

                      {/* Freight Cost Justification */}
                      <div className="document-upload-item">
                        <label className="document-label">Freight cost justification:</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e, 'freight')}
                          style={{ display: 'none' }}
                          id="freight-justification-input"
                        />
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={() => document.getElementById('freight-justification-input')?.click()}
                        >
                          Add File
                        </IonButton>
                        {freightJustificationPreview && (
                          <div className="file-preview">
                            <span className="file-name">Uploaded (1/1)</span>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => removeFile('freight')}
                            >
                              Remove
                            </IonButton>
                          </div>
                        )}
                        <div className="upload-status">
                          Status: {freightJustificationPreview ? 'Uploaded (1/1)' : 'Missing (0/1)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {clarification.status === 'pending' && (
                    <IonButton
                      expand="block"
                      onClick={handleSubmitResponse}
                      disabled={submitting || !response.trim()}
                      className="submit-button"
                    >
                      <IonIcon icon={sendOutline} slot="start" />
                      {submitting ? 'Submitting...' : 'Submit Response'}
                    </IonButton>
                  )}

                  {clarification.status === 'responded' && (
                    <div className="responded-notice">
                      <p>Response submitted on {formatDate(clarification.updatedAt)}</p>
                      <p className="info-text">DTI will review your response and may contact you for further action.</p>
                      
                      {/* Display uploaded documents */}
                      {(clarification.supplierInvoiceUrl || clarification.deliveryReceiptUrl || 
                        clarification.proofOfCostUrl || clarification.freightJustificationUrl) && (
                        <div className="uploaded-documents-list">
                          <h4>Uploaded Documents:</h4>
                          {clarification.supplierInvoiceUrl && (
                            <div className="uploaded-doc-item">
                              <IonIcon icon={documentTextOutline} />
                              <a href={clarification.supplierInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                Supplier Invoice
                              </a>
                            </div>
                          )}
                          {clarification.deliveryReceiptUrl && (
                            <div className="uploaded-doc-item">
                              <IonIcon icon={documentTextOutline} />
                              <a href={clarification.deliveryReceiptUrl} target="_blank" rel="noopener noreferrer">
                                Delivery Receipt
                              </a>
                            </div>
                          )}
                          {clarification.proofOfCostUrl && (
                            <div className="uploaded-doc-item">
                              <IonIcon icon={documentTextOutline} />
                              <a href={clarification.proofOfCostUrl} target="_blank" rel="noopener noreferrer">
                                Proof of Increased Cost
                              </a>
                            </div>
                          )}
                          {clarification.freightJustificationUrl && (
                            <div className="uploaded-doc-item">
                              <IonIcon icon={documentTextOutline} />
                              <a href={clarification.freightJustificationUrl} target="_blank" rel="noopener noreferrer">
                                Freight Cost Justification
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </IonCardContent>
          </IonCard>

          {/* Guidelines Card */}
          <IonCard className="guidelines-card">
            <IonCardHeader>
              <IonCardTitle>Response Guidelines</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <ul className="guidelines-list">
                <li>Respond promptly to avoid penalties</li>
                <li>Provide accurate information and supporting documents</li>
                <li>If the price is incorrect, update it immediately in your store</li>
                <li>Explain any discrepancies or special circumstances</li>
                <li>Contact DTI if you need clarification about the notice</li>
              </ul>
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading isOpen={submitting} message="Submitting response..." />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ClarificationDetails;
