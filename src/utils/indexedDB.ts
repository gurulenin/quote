import { SavedDocument, DocumentType } from '../types';
import { ClientData } from '../hooks/useClientData';
import { ProductData } from '../hooks/useProductData';

interface DBSchema {
  documents: SavedDocument;
  clientData: { id: string; clients: ClientData[]; lastUpdated: string; source: string; sheetUrl?: string };
  productData: { id: string; products: ProductData[]; lastUpdated: string; source: string; sheetUrl?: string };
}

class IndexedDBManager {
  private dbName = 'InvoiceQuotationDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          documentsStore.createIndex('docType', 'docType', { unique: false });
          documentsStore.createIndex('docNumber', 'docDetails.number', { unique: false });
          documentsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create clientData store
        if (!db.objectStoreNames.contains('clientData')) {
          db.createObjectStore('clientData', { keyPath: 'id' });
        }

        // Create productData store
        if (!db.objectStoreNames.contains('productData')) {
          db.createObjectStore('productData', { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // Document operations
  async saveDocument(documentData: Omit<SavedDocument, 'id'>): Promise<string> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      
      const docWithTimestamp = {
        ...documentData,
        timestamp: new Date().toISOString()
      };
      
      const request = store.add(docWithTimestamp);

      request.onsuccess = () => {
        resolve(request.result.toString());
      };

      request.onerror = () => {
        reject(new Error('Failed to save document'));
      };
    });
  }

  async getAllDocuments(): Promise<SavedDocument[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.getAll();

      request.onsuccess = () => {
        const documents = request.result.map(doc => ({
          ...doc,
          id: doc.id.toString()
        }));
        // Sort by timestamp descending
        documents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(documents);
      };

      request.onerror = () => {
        reject(new Error('Failed to load documents'));
      };
    });
  }

  async getDocumentById(docId: string): Promise<SavedDocument | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(parseInt(docId));

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            ...request.result,
            id: request.result.id.toString()
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load document'));
      };
    });
  }

  async updateDocument(docId: string, documentData: Partial<SavedDocument>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      
      // First get the existing document
      const getRequest = store.get(parseInt(docId));
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const updatedDoc = {
            ...getRequest.result,
            ...documentData,
            id: parseInt(docId),
            timestamp: new Date().toISOString()
          };
          
          const putRequest = store.put(updatedDoc);
          
          putRequest.onsuccess = () => {
            resolve();
          };
          
          putRequest.onerror = () => {
            reject(new Error('Failed to update document'));
          };
        } else {
          reject(new Error('Document not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to find document'));
      };
    });
  }

  async deleteDocument(docId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.delete(parseInt(docId));

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete document'));
      };
    });
  }

  async clearAllDocuments(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear documents'));
      };
    });
  }

  async importDocuments(documents: Omit<SavedDocument, 'id'>[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      
      let completed = 0;
      const total = documents.length;
      
      if (total === 0) {
        resolve();
        return;
      }

      documents.forEach(doc => {
        const docWithTimestamp = {
          ...doc,
          timestamp: new Date().toISOString()
        };
        
        const request = store.add(docWithTimestamp);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(new Error('Failed to import document'));
        };
      });
    });
  }

  async getDocumentsByType(docType: DocumentType): Promise<SavedDocument[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('docType');
      const request = index.getAll(docType);

      request.onsuccess = () => {
        const documents = request.result.map(doc => ({
          ...doc,
          id: doc.id.toString()
        }));
        // Sort by timestamp descending
        documents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(documents);
      };

      request.onerror = () => {
        reject(new Error('Failed to load documents by type'));
      };
    });
  }

  async checkDuplicateNumber(docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> {
    const documents = await this.getAllDocuments();
    const duplicates = documents.filter(doc => 
      doc.docDetails?.number === docNumber && 
      doc.docType === docType &&
      (excludeDocId ? doc.id !== excludeDocId : true)
    );
    return duplicates.length > 0;
  }

  // Client data operations
  async saveClientData(clients: ClientData[], source: 'manual' | 'google_sheets' = 'manual', sheetUrl?: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['clientData'], 'readwrite');
      const store = transaction.objectStore('clientData');
      
      const clientData = {
        id: 'main',
        clients,
        lastUpdated: new Date().toISOString(),
        source,
        sheetUrl: sheetUrl || ''
      };
      
      const request = store.put(clientData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save client data'));
      };
    });
  }

  async getClientData(): Promise<ClientData[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['clientData'], 'readonly');
      const store = transaction.objectStore('clientData');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.clients || []);
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load client data'));
      };
    });
  }

  async getClientDataInfo(): Promise<{ lastUpdated: string | null; source: string; sheetUrl?: string; count: number }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['clientData'], 'readonly');
      const store = transaction.objectStore('clientData');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            lastUpdated: request.result.lastUpdated || null,
            source: request.result.source || 'unknown',
            sheetUrl: request.result.sheetUrl || undefined,
            count: request.result.clients?.length || 0
          });
        } else {
          resolve({ lastUpdated: null, source: 'none', count: 0 });
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load client data info'));
      };
    });
  }

  // Product data operations
  async saveProductData(products: ProductData[], source: 'manual' | 'google_sheets' = 'manual', sheetUrl?: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['productData'], 'readwrite');
      const store = transaction.objectStore('productData');
      
      const productData = {
        id: 'main',
        products,
        lastUpdated: new Date().toISOString(),
        source,
        sheetUrl: sheetUrl || ''
      };
      
      const request = store.put(productData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save product data'));
      };
    });
  }

  async getProductData(): Promise<ProductData[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['productData'], 'readonly');
      const store = transaction.objectStore('productData');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.products || []);
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load product data'));
      };
    });
  }

  async getProductDataInfo(): Promise<{ lastUpdated: string | null; source: string; sheetUrl?: string; count: number }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['productData'], 'readonly');
      const store = transaction.objectStore('productData');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            lastUpdated: request.result.lastUpdated || null,
            source: request.result.source || 'unknown',
            sheetUrl: request.result.sheetUrl || undefined,
            count: request.result.products?.length || 0
          });
        } else {
          resolve({ lastUpdated: null, source: 'none', count: 0 });
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load product data info'));
      };
    });
  }
}

export const indexedDBManager = new IndexedDBManager();