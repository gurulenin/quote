import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SavedDocument, DocumentType } from '../types';
import { ClientData } from '../hooks/useClientData';
import { ProductData } from '../hooks/useProductData';

interface FirebaseDocument {
  id?: string;
  userId: string;
  docType: string;
  docNumber: string;
  companyData: any;
  clientData: any;
  shippingDetails: any;
  shippingSameAsBilling: boolean;
  docDetails: any;
  bankDetails: any;
  items: any[];
  totals: any;
  termsConditions: string;
  upiId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirebaseClientData {
  id?: string;
  userId: string;
  clients: ClientData[];
  lastUpdated: Timestamp;
  source: 'manual' | 'google_sheets';
  sheetUrl: string;
}

interface FirebaseProductData {
  id?: string;
  userId: string;
  products: ProductData[];
  lastUpdated: Timestamp;
  source: 'manual' | 'google_sheets';
  sheetUrl: string;
}

class FirebaseManager {
  private readonly COLLECTION_NAME = 'documents';
  private readonly SESSIONS_COLLECTION = 'user_sessions';
  private readonly CLIENTS_COLLECTION = 'client_data';
  private readonly PRODUCTS_COLLECTION = 'product_data';

  private getCurrentUserId(): string {
    // Check if user is authenticated with Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('Current user found:', currentUser.uid);
      return currentUser.uid;
    }

    console.error('No authenticated user found');
    throw new Error('No authentication found - user must be logged in');
  }

  private async waitForAuth(): Promise<string> {
    console.log('Waiting for auth state...');
    
    // First check if user is already authenticated
    if (auth.currentUser) {
      console.log('User already authenticated:', auth.currentUser.uid);
      return auth.currentUser.uid;
    }

    // Wait for auth state to be ready
    return new Promise((resolve, reject) => {
      console.log('Setting up auth state listener...');
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.uid : 'no user');
        unsubscribe();
        
        if (user) {
          resolve(user.uid);
        } else {
          reject(new Error('User not authenticated'));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Authentication timeout'));
      }, 10000);
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Converts undefined values to null or empty strings for Firestore compatibility
   */
  private sanitizeForFirestore(obj: any): any {
    if (obj === undefined) {
      return null;
    }
    
    if (obj === null) {
      return null;
    }
    
    if (typeof obj === 'string') {
      return obj; // Keep strings as-is, even empty ones
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj; // Keep primitives as-is
    }
    
    if (obj instanceof Date || obj instanceof Timestamp) {
      return obj; // Keep dates/timestamps as-is
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeForFirestore(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Ensures string fields are never undefined - converts to empty string
   */
  private ensureString(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  }

  /**
   * Ensures boolean fields are never undefined - converts to false
   */
  private ensureBoolean(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }
    return Boolean(value);
  }

  /**
   * Ensures object fields are never undefined - converts to empty object
   */
  private ensureObject(value: any): any {
    if (value === undefined || value === null) {
      return {};
    }
    return this.sanitizeForFirestore(value);
  }

  /**
   * Ensures array fields are never undefined - converts to empty array
   */
  private ensureArray(value: any): any[] {
    if (value === undefined || value === null || !Array.isArray(value)) {
      return [];
    }
    return value.map(item => this.sanitizeForFirestore(item));
  }

  // ==================== DOCUMENT METHODS ====================

  async saveDocument(documentData: Omit<SavedDocument, 'id'>): Promise<string> {
    try {
      console.log('Starting saveDocument...');
      
      // Wait for authentication to be ready
      const userId = await this.waitForAuth();
      console.log('Authentication confirmed, userId:', userId);

      // Ensure all required fields are defined with safe defaults and convert undefined to null/empty string
      const firebaseDoc: Omit<FirebaseDocument, 'id'> = {
        userId: this.ensureString(userId),
        docType: this.ensureString(documentData.docType || 'Invoice'),
        docNumber: this.ensureString(documentData.docDetails?.number || '1'),
        companyData: this.ensureObject(documentData.company),
        clientData: this.ensureObject(documentData.client),
        shippingDetails: this.ensureObject(documentData.shippingDetails || { name: '', address: '' }),
        shippingSameAsBilling: this.ensureBoolean(documentData.shippingSameAsBilling),
        docDetails: this.ensureObject(documentData.docDetails),
        bankDetails: this.ensureObject(documentData.bankDetails),
        items: this.ensureArray(documentData.items),
        totals: this.ensureObject(documentData.totals),
        termsConditions: this.ensureString(documentData.termsAndConditions),
        upiId: this.ensureString(documentData.fixedUpiId),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Final sanitization to ensure no undefined values
      const sanitizedDoc = this.sanitizeForFirestore(firebaseDoc);
      
      console.log('Saving document with userId:', userId);
      console.log('Document data:', sanitizedDoc);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), sanitizedDoc);
      console.log('Document saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving document to Firebase:', error);
      throw error;
    }
  }

  async getAllDocuments(): Promise<SavedDocument[]> {
    try {
      const userId = await this.waitForAuth();

      // Simple query without orderBy to avoid index requirements initially
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseDocument;
        return this.convertToSavedDocument(doc.id, data);
      });

      // Sort in memory to avoid index requirement
      return documents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error loading documents from Firebase:', error);
      
      // Fallback: try without any complex queries
      try {
        const userId = await this.waitForAuth();
        const simpleQuery = query(collection(db, this.COLLECTION_NAME));
        const querySnapshot = await getDocs(simpleQuery);
        
        const userDocuments = querySnapshot.docs
          .filter(doc => {
            const data = doc.data() as FirebaseDocument;
            return data.userId === userId;
          })
          .map(doc => {
            const data = doc.data() as FirebaseDocument;
            return this.convertToSavedDocument(doc.id, data);
          });

        return userDocuments.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }

  async getDocumentById(docId: string): Promise<SavedDocument | null> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as FirebaseDocument;
      
      // Verify the document belongs to the current user
      if (data.userId !== userId) {
        throw new Error('Access denied: Document does not belong to current user');
      }

      return this.convertToSavedDocument(docSnap.id, data);
    } catch (error) {
      console.error('Error loading document from Firebase:', error);
      throw error;
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      
      // First verify the document belongs to the current user
      const docRef = doc(db, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      const data = docSnap.data() as FirebaseDocument;
      if (data.userId !== userId) {
        throw new Error('Access denied: Document does not belong to current user');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document from Firebase:', error);
      throw error;
    }
  }

  async updateDocument(docId: string, documentData: Partial<SavedDocument>): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.COLLECTION_NAME, docId);
      
      // First verify the document belongs to the current user
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      const existingData = docSnap.data() as FirebaseDocument;
      if (existingData.userId !== userId) {
        throw new Error('Access denied: Document does not belong to current user');
      }

      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      // Safely handle all update fields with defaults and convert undefined to null/empty string
      if (documentData.docType !== undefined) updateData.docType = this.ensureString(documentData.docType);
      if (documentData.docDetails?.number !== undefined) updateData.docNumber = this.ensureString(documentData.docDetails.number);
      if (documentData.company !== undefined) updateData.companyData = this.ensureObject(documentData.company);
      if (documentData.client !== undefined) updateData.clientData = this.ensureObject(documentData.client);
      if (documentData.shippingDetails !== undefined) updateData.shippingDetails = this.ensureObject(documentData.shippingDetails);
      if (documentData.shippingSameAsBilling !== undefined) updateData.shippingSameAsBilling = this.ensureBoolean(documentData.shippingSameAsBilling);
      if (documentData.docDetails !== undefined) updateData.docDetails = this.ensureObject(documentData.docDetails);
      if (documentData.bankDetails !== undefined) updateData.bankDetails = this.ensureObject(documentData.bankDetails);
      if (documentData.items !== undefined) updateData.items = this.ensureArray(documentData.items);
      if (documentData.totals !== undefined) updateData.totals = this.ensureObject(documentData.totals);
      if (documentData.termsAndConditions !== undefined) updateData.termsConditions = this.ensureString(documentData.termsAndConditions);
      if (documentData.fixedUpiId !== undefined) updateData.upiId = this.ensureString(documentData.fixedUpiId);

      // Final sanitization to ensure no undefined values
      const sanitizedUpdateData = this.sanitizeForFirestore(updateData);

      await updateDoc(docRef, sanitizedUpdateData);
    } catch (error) {
      console.error('Error updating document in Firebase:', error);
      throw error;
    }
  }

  async clearAllDocuments(): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      
      // Use simple query to avoid index requirements
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing documents from Firebase:', error);
      throw error;
    }
  }

  async importDocuments(documents: Omit<SavedDocument, 'id'>[]): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      const batch = writeBatch(db);

      documents.forEach(doc => {
        const docRef = doc(collection(db, this.COLLECTION_NAME));
        
        // Ensure all fields are defined with safe defaults and convert undefined to null/empty string
        const firebaseDoc: Omit<FirebaseDocument, 'id'> = {
          userId: this.ensureString(userId),
          docType: this.ensureString(doc.docType || 'Invoice'),
          docNumber: this.ensureString(doc.docDetails?.number || '1'),
          companyData: this.ensureObject(doc.company),
          clientData: this.ensureObject(doc.client),
          shippingDetails: this.ensureObject(doc.shippingDetails || { name: '', address: '' }),
          shippingSameAsBilling: this.ensureBoolean(doc.shippingSameAsBilling),
          docDetails: this.ensureObject(doc.docDetails),
          bankDetails: this.ensureObject(doc.bankDetails),
          items: this.ensureArray(doc.items),
          totals: this.ensureObject(doc.totals),
          termsConditions: this.ensureString(doc.termsAndConditions),
          upiId: this.ensureString(doc.fixedUpiId),
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        };

        // Final sanitization to ensure no undefined values
        const sanitizedDoc = this.sanitizeForFirestore(firebaseDoc);
        batch.set(docRef, sanitizedDoc);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error importing documents to Firebase:', error);
      throw error;
    }
  }

  async getDocumentsByType(docType: DocumentType): Promise<SavedDocument[]> {
    try {
      const userId = await this.waitForAuth();

      // Simple query to avoid index requirements
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('docType', '==', docType)
      );

      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseDocument;
        return this.convertToSavedDocument(doc.id, data);
      });

      // Sort in memory
      return documents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error loading documents by type from Firebase:', error);
      
      // Fallback: get all user documents and filter in memory
      try {
        const allDocs = await this.getAllDocuments();
        return allDocs.filter(doc => doc.docType === docType);
      } catch (fallbackError) {
        console.error('Fallback query for type also failed:', fallbackError);
        throw error;
      }
    }
  }

  async checkDuplicateNumber(docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> {
    try {
      const userId = await this.waitForAuth();

      // Ensure docNumber and docType are defined
      if (!docNumber || !docType) {
        return false;
      }

      // Simple query to avoid index requirements
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('docNumber', '==', docNumber),
        where('docType', '==', docType)
      );

      const querySnapshot = await getDocs(q);
      
      if (excludeDocId) {
        // Filter out the excluded document
        const filteredDocs = querySnapshot.docs.filter(doc => doc.id !== excludeDocId);
        return filteredDocs.length > 0;
      }

      return querySnapshot.docs.length > 0;
    } catch (error) {
      console.error('Error checking duplicate number in Firebase:', error);
      
      // Fallback: get all documents and check in memory
      try {
        const allDocs = await this.getAllDocuments();
        const duplicates = allDocs.filter(doc => 
          doc.docDetails?.number === docNumber && 
          doc.docType === docType &&
          (excludeDocId ? doc.id !== excludeDocId : true)
        );
        return duplicates.length > 0;
      } catch (fallbackError) {
        console.error('Fallback duplicate check also failed:', fallbackError);
        return false;
      }
    }
  }

  // ==================== CLIENT DATA METHODS ====================

  async saveClientData(clients: ClientData[], source: 'manual' | 'google_sheets' = 'manual', sheetUrl?: string): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.CLIENTS_COLLECTION, userId);

      // Ensure all required fields are defined with safe defaults and convert undefined to null/empty string
      const clientData: Omit<FirebaseClientData, 'id'> = {
        userId: this.ensureString(userId),
        clients: this.ensureArray(clients),
        lastUpdated: serverTimestamp() as Timestamp,
        source: source || 'manual',
        sheetUrl: this.ensureString(sheetUrl) // Convert undefined to empty string
      };

      // Final sanitization to ensure no undefined values
      const sanitizedData = this.sanitizeForFirestore(clientData);

      await setDoc(docRef, sanitizedData, { merge: true });
    } catch (error) {
      console.error('Error saving client data to Firebase:', error);
      throw error;
    }
  }

  async getClientData(): Promise<ClientData[]> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.CLIENTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return [];
      }

      const data = docSnap.data() as FirebaseClientData;
      return data.clients || [];
    } catch (error) {
      console.error('Error loading client data from Firebase:', error);
      throw error;
    }
  }

  async getClientDataInfo(): Promise<{ lastUpdated: string | null; source: string; sheetUrl?: string; count: number }> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.CLIENTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { lastUpdated: null, source: 'none', count: 0 };
      }

      const data = docSnap.data() as FirebaseClientData;
      return {
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || null,
        source: data.source || 'unknown',
        sheetUrl: data.sheetUrl || undefined, // Convert empty string back to undefined for display
        count: data.clients?.length || 0
      };
    } catch (error) {
      console.error('Error loading client data info from Firebase:', error);
      return { lastUpdated: null, source: 'error', count: 0 };
    }
  }

  // ==================== PRODUCT DATA METHODS ====================

  async saveProductData(products: ProductData[], source: 'manual' | 'google_sheets' = 'manual', sheetUrl?: string): Promise<void> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.PRODUCTS_COLLECTION, userId);

      // Ensure all required fields are defined with safe defaults and convert undefined to null/empty string
      const productData: Omit<FirebaseProductData, 'id'> = {
        userId: this.ensureString(userId),
        products: this.ensureArray(products),
        lastUpdated: serverTimestamp() as Timestamp,
        source: source || 'manual',
        sheetUrl: this.ensureString(sheetUrl) // Convert undefined to empty string
      };

      // Final sanitization to ensure no undefined values
      const sanitizedData = this.sanitizeForFirestore(productData);

      await setDoc(docRef, sanitizedData, { merge: true });
    } catch (error) {
      console.error('Error saving product data to Firebase:', error);
      throw error;
    }
  }

  async getProductData(): Promise<ProductData[]> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.PRODUCTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return [];
      }

      const data = docSnap.data() as FirebaseProductData;
      return data.products || [];
    } catch (error) {
      console.error('Error loading product data from Firebase:', error);
      throw error;
    }
  }

  async getProductDataInfo(): Promise<{ lastUpdated: string | null; source: string; sheetUrl?: string; count: number }> {
    try {
      const userId = await this.waitForAuth();
      const docRef = doc(db, this.PRODUCTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { lastUpdated: null, source: 'none', count: 0 };
      }

      const data = docSnap.data() as FirebaseProductData;
      return {
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || null,
        source: data.source || 'unknown',
        sheetUrl: data.sheetUrl || undefined, // Convert empty string back to undefined for display
        count: data.products?.length || 0
      };
    } catch (error) {
      console.error('Error loading product data info from Firebase:', error);
      return { lastUpdated: null, source: 'error', count: 0 };
    }
  }

  // ==================== UTILITY METHODS ====================

  private convertToSavedDocument(id: string, firebaseDoc: FirebaseDocument): SavedDocument {
    return {
      id,
      docType: firebaseDoc.docType as DocumentType,
      company: firebaseDoc.companyData || {},
      client: firebaseDoc.clientData || {},
      shippingDetails: firebaseDoc.shippingDetails || { name: '', address: '' },
      shippingSameAsBilling: firebaseDoc.shippingSameAsBilling ?? true,
      docDetails: firebaseDoc.docDetails || {},
      bankDetails: firebaseDoc.bankDetails || {},
      items: firebaseDoc.items || [],
      totals: firebaseDoc.totals || {},
      termsAndConditions: firebaseDoc.termsConditions || '',
      fixedUpiId: firebaseDoc.upiId || '',
      timestamp: firebaseDoc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  }
}

export const firebaseManager = new FirebaseManager();