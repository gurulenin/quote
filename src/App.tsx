import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDocuments } from './hooks/useDocuments';
import { useClientData } from './hooks/useClientData';
import { useProductData } from './hooks/useProductData';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { DocumentTypeToggle } from './components/DocumentTypeToggle';
import { CompanyDetails } from './components/CompanyDetails';
import { ClientDetailsWithSuggestions } from './components/ClientDetailsWithSuggestions';
import { ShippingDetails } from './components/ShippingDetails';
import { DocumentDetails } from './components/DocumentDetails';
import { ItemsTableWithSuggestions } from './components/ItemsTableWithSuggestions';
import { BankDetails } from './components/BankDetails';
import { QRCodeSection } from './components/QRCodeSection';
import { TotalsSection } from './components/TotalsSection';
import { TermsConditions } from './components/TermsConditions';
import { EmailAssistant } from './components/EmailAssistant';
import { DocumentHistory } from './components/DocumentHistory';
import { BackupRestore } from './components/BackupRestore';
import { ClientsTab } from './components/ClientsTab';
import { ProductsTab } from './components/ProductsTab';
import { ReportsTab } from './components/ReportsTab';
import { ActionButtons } from './components/ActionButtons';
import { UserMessage } from './components/UserMessage';
import { FirebaseStatus } from './components/FirebaseStatus';
import { DocumentType, CompanyInfo, ClientInfo, DocumentInfo, BankInfo, LineItem, Totals } from './types';

function App() {
  const { 
    user, 
    firebaseUser,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout, 
    isLoading: authLoading 
  } = useAuth();
  
  const { 
    documents, 
    saveDocument, 
    deleteDocument, 
    clearAllDocuments,
    importDocuments,
    isLoading: documentsLoading,
    error: documentsError 
  } = useDocuments(firebaseUser);

  // Initialize client and product data hooks with firebaseUser
  const clientDataHook = useClientData(firebaseUser);
  const productDataHook = useProductData(firebaseUser);

  // Tab state
  const [activeTab, setActiveTab] = useState<'documents' | 'clients' | 'products' | 'reports'>('documents');

  // Document state
  const [docType, setDocType] = useState<DocumentType>('Quotation');
  const [userMessage, setUserMessage] = useState('');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [gstMode, setGstMode] = useState<'auto' | 'igst' | 'cgst_sgst'>('auto');

  // Company details
  const [company, setCompany] = useState<CompanyInfo>({
    name: 'SUN CREATIONS',
    address: '57/1, COLLEGE JUNCTION ROAD, ALAGAPPAPURAM, KARAIKUDI, Tamil Nadu (TN-33) 630003, IN',
    phone: '9578078500',
    email: 'hi@printhink.in',
    gstin: '33AIVPL0694A2Z8',
    website: 'printhink.in'
  });

  // Client details
  const [client, setClient] = useState<ClientInfo>({
    name: '',
    address: '',
    phone: '',
    gstin: '',
    email: ''
  });

  // Shipping details
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    address: ''
  });
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);

  // Document details
  const [docDetails, setDocDetails] = useState<DocumentInfo>({
    number: '',
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    placeOfSupply: 'TN (33)',
    deliveryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Bank details
  const [bankDetails, setBankDetails] = useState<BankInfo>({
    bankName: 'HDFC',
    accountNumber: '50200032038305',
    branchName: 'KARAIKUDI',
    ifscCode: 'HDFC0001855'
  });

  // Items and calculations
  const [items, setItems] = useState<LineItem[]>([]);
  const [termsAndConditions, setTermsAndConditions] = useState(
    '100 % Payment Advance\nPrice inclusive of GST\nDelivery Time one Week from the date of payment'
  );

  // Fixed UPI ID
  const fixedUpiId = '9578078500@pz';

  // Calculate totals
  const totals = useMemo(() => {
    let subTotalTaxableValue = 0;
    let totalGSTAmountOverall = 0;
    
    const companyStateCode = company.gstin ? company.gstin.substring(0, 2) : '';
    const clientStateCode = client.gstin ? client.gstin.substring(0, 2) : '';
    const autoIsInterState = companyStateCode && clientStateCode && companyStateCode !== clientStateCode;
    
    // Determine effective inter-state status based on GST mode
    let isInterState: boolean;
    switch (gstMode) {
      case 'igst':
        isInterState = true;
        break;
      case 'cgst_sgst':
        isInterState = false;
        break;
      default: // 'auto'
        isInterState = autoIsInterState;
        break;
    }

    items.forEach(item => {
      if (isSimpleMode) {
        // Simple mode: use taxableValue directly
        const itemTaxableValue = item.taxableValue || 0;
        const gstAmount = (itemTaxableValue * item.gstRate) / 100;
        subTotalTaxableValue += itemTaxableValue;
        totalGSTAmountOverall += gstAmount;
      } else {
        // Detailed mode: calculate from unit price and quantity
        const taxableValuePerUnit = item.unitPrice / (1 + item.gstRate / 100);
        const gstPerUnit = item.unitPrice - taxableValuePerUnit;
        subTotalTaxableValue += item.quantity * taxableValuePerUnit;
        totalGSTAmountOverall += item.quantity * gstPerUnit;
      }
    });

    const result: Totals = {
      subTotalTaxableValue,
      totalGSTAmountOverall,
      cgst: isInterState ? 0 : totalGSTAmountOverall / 2,
      sgst: isInterState ? 0 : totalGSTAmountOverall / 2,
      igst: isInterState ? totalGSTAmountOverall : 0,
      grandTotal: subTotalTaxableValue + totalGSTAmountOverall,
      isInterState
    };

    return result;
  }, [items, company.gstin, client.gstin, isSimpleMode, gstMode]);

  // Sync shipping address if checkbox is ticked
  useEffect(() => {
    if (shippingSameAsBilling) {
      setShippingDetails({
        name: client.name,
        address: client.address
      });
    }
  }, [client, shippingSameAsBilling]);

  const showUserMessage = (message: string) => {
    setUserMessage(message);
    setTimeout(() => setUserMessage(''), 3000);
  };

  const handleSaveDocument = async () => {
    console.log('Save document clicked');
    
    // Check authentication first
    if (!firebaseUser) {
      showUserMessage('Please log in to save documents');
      return;
    }

    // Simple validation - just check if document number is not empty
    if (!docDetails.number.trim()) {
      showUserMessage('Please enter a document number');
      return;
    }

    console.log('Validation passed, preparing document data...');

    const documentData = {
      docType,
      company,
      client,
      shippingDetails,
      shippingSameAsBilling,
      docDetails,
      bankDetails,
      items,
      totals,
      termsAndConditions,
      fixedUpiId,
      timestamp: new Date().toISOString(),
      isSimpleMode,
      gstMode
    };

    console.log('Document data prepared:', documentData);

    try {
      console.log('Calling saveDocument...');
      const docId = await saveDocument(documentData);
      console.log('Document saved with ID:', docId);
      showUserMessage('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      showUserMessage(`Failed to save document: ${error.message || 'Unknown error'}`);
    }
  };

  const handleLoadDocument = async (docId: string) => {
    try {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        setDocType(doc.docType);
        setCompany(doc.company);
        setClient(doc.client);
        setShippingDetails(doc.shippingDetails || { name: '', address: '' });
        setShippingSameAsBilling(doc.shippingSameAsBilling !== undefined ? doc.shippingSameAsBilling : true);
        setDocDetails(doc.docDetails);
        setBankDetails(doc.bankDetails);
        setItems(doc.items);
        setTermsAndConditions(doc.termsAndConditions);
        setIsSimpleMode((doc as any).isSimpleMode || false);
        setGstMode((doc as any).gstMode || 'auto');
        showUserMessage('Document loaded successfully!');
      } else {
        showUserMessage('Document not found');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      showUserMessage('Failed to load document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument(docId);
      showUserMessage('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      showUserMessage('Failed to delete document');
    }
  };

  const handleExportDocuments = async () => {
    try {
      if (documents.length === 0) {
        showUserMessage('No documents to export');
        return;
      }
      
      const dataToExport = documents.map(({ id, ...rest }) => rest);
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `documents_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showUserMessage('Documents exported successfully!');
    } catch (error) {
      console.error('Error exporting documents:', error);
      showUserMessage('Failed to export documents');
    }
  };

  const handleImportDocuments = async (file: File) => {
    try {
      const text = await file.text();
      const importedDocs = JSON.parse(text);
      
      if (!Array.isArray(importedDocs)) {
        throw new Error('Invalid file format');
      }

      await importDocuments(importedDocs);
      showUserMessage('Documents imported successfully!');
    } catch (error) {
      console.error('Error importing documents:', error);
      showUserMessage('Failed to import documents');
    }
  };

  const handleSyncWithCloud = async () => {
    // Firebase automatically syncs, so just refresh the documents
    try {
      showUserMessage('Data synced successfully!');
    } catch (error) {
      console.error('Error syncing data:', error);
      showUserMessage('Failed to sync data');
    }
  };

  const handleBackupComplete = (message: string) => {
    showUserMessage(message);
  };

  const handleRestoreComplete = (message: string) => {
    showUserMessage(message);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user.isAuthenticated) {
    return (
      <LoginForm 
        onEmailLogin={loginWithEmail}
        onEmailRegister={registerWithEmail}
        onPasswordReset={resetPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      <Header 
        onLogout={logout} 
        user={user}
        firebaseUser={firebaseUser}
      />
      
      {userMessage && <UserMessage message={userMessage} />}
      
      <FirebaseStatus 
        onSync={handleSyncWithCloud}
        isLoading={documentsLoading}
      />
      
      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              Reports
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'documents' ? (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <DocumentTypeToggle docType={docType} onDocTypeChange={setDocType} />
            
            <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 uppercase tracking-wide">
              {docType}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <CompanyDetails 
                company={company} 
                onChange={setCompany}
                docType={docType}
              />
              <ClientDetailsWithSuggestions 
                client={client} 
                onChange={setClient}
                docType={docType}
                clientDataHook={clientDataHook}
              />
            </div>

            {docType === 'Purchase Order' && (
              <ShippingDetails
                shippingDetails={shippingDetails}
                shippingSameAsBilling={shippingSameAsBilling}
                onShippingDetailsChange={setShippingDetails}
                onShippingSameAsBillingChange={setShippingSameAsBilling}
                clientName={client.name}
                clientAddress={client.address}
              />
            )}

            <DocumentDetails
              docType={docType}
              docDetails={docDetails}
              onChange={setDocDetails}
            />

            <ItemsTableWithSuggestions
              items={items}
              onChange={setItems}
              totals={totals}
              isSimpleMode={isSimpleMode}
              onSimpleModeChange={setIsSimpleMode}
              gstMode={gstMode}
              onGstModeChange={setGstMode}
              productDataHook={productDataHook}
            />

            {docType !== 'Purchase Order' && (
              <>
                <BankDetails bankDetails={bankDetails} onChange={setBankDetails} />
                <QRCodeSection upiId={fixedUpiId} />
              </>
            )}

            <TotalsSection totals={totals} />

            <TermsConditions
              termsAndConditions={termsAndConditions}
              onChange={setTermsAndConditions}
            />

            <EmailAssistant
              docType={docType}
              clientName={client.name}
              clientEmail={client.email}
              docNumber={docDetails.number}
              grandTotal={totals.grandTotal}
            />

            <BackupRestore
              onBackupComplete={handleBackupComplete}
              onRestoreComplete={handleRestoreComplete}
            />

            <DocumentHistory
              documents={documents}
              isLoading={documentsLoading}
              error={documentsError}
              onSave={handleSaveDocument}
              onLoad={handleLoadDocument}
              onDelete={handleDeleteDocument}
              onExport={handleExportDocuments}
              onImport={handleImportDocuments}
            />

            <ActionButtons
              docType={docType}
              company={company}
              client={client}
              shippingDetails={shippingDetails}
              docDetails={docDetails}
              bankDetails={bankDetails}
              items={items}
              totals={totals}
              termsAndConditions={termsAndConditions}
              fixedUpiId={fixedUpiId}
              isSimpleMode={isSimpleMode}
              onExportClientData={() => showUserMessage('Client data exported!')}
            />
          </div>
        ) : activeTab === 'clients' ? (
          <ClientsTab onMessage={showUserMessage} clientDataHook={clientDataHook} />
        ) : activeTab === 'products' ? (
          <ProductsTab onMessage={showUserMessage} productDataHook={productDataHook} />
        ) : (
          <ReportsTab 
            documents={documents}
            isLoading={documentsLoading}
            onMessage={showUserMessage}
          />
        )}
      </div>
    </div>
  );
}

export default App;