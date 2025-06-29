import { useState, useEffect } from 'react';
import { SavedDocument, DocumentType } from '../types';
import { indexedDBManager } from '../utils/indexedDB';

export const useDocuments = (user: any) => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!user?.isAuthenticated) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await indexedDBManager.init();
      const docs = await indexedDBManager.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocument = async (documentData: Omit<SavedDocument, 'id'>): Promise<string> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      const docId = await indexedDBManager.saveDocument(documentData);
      await loadDocuments(); // Refresh the list
      return docId;
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    }
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.deleteDocument(docId);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  const updateDocument = async (docId: string, documentData: Partial<SavedDocument>): Promise<void> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.updateDocument(docId, documentData);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  };

  const getDocumentById = async (docId: string): Promise<SavedDocument | null> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      return await indexedDBManager.getDocumentById(docId);
    } catch (err) {
      console.error('Error getting document by ID:', err);
      throw err;
    }
  };

  const clearAllDocuments = async (): Promise<void> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.clearAllDocuments();
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error clearing documents:', err);
      throw err;
    }
  };

  const importDocuments = async (docs: Omit<SavedDocument, 'id'>[]): Promise<void> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.importDocuments(docs);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error importing documents:', err);
      throw err;
    }
  };

  const getDocumentsByType = async (docType: DocumentType): Promise<SavedDocument[]> => {
    if (!user?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await indexedDBManager.init();
      return await indexedDBManager.getDocumentsByType(docType);
    } catch (err) {
      console.error('Error getting documents by type:', err);
      throw err;
    }
  };

  const checkDuplicateNumber = async (docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> => {
    if (!user?.isAuthenticated) {
      return false;
    }

    try {
      await indexedDBManager.init();
      return await indexedDBManager.checkDuplicateNumber(docNumber, docType, excludeDocId);
    } catch (err) {
      console.error('Error checking duplicate number:', err);
      return false;
    }
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      loadDocuments();
    } else {
      // Clear data when user logs out
      setDocuments([]);
      setError(null);
      setIsLoading(false);
    }
  }, [user?.isAuthenticated]);

  return {
    documents,
    isLoading,
    error,
    loadDocuments,
    saveDocument,
    deleteDocument,
    updateDocument,
    getDocumentById,
    clearAllDocuments,
    importDocuments,
    getDocumentsByType,
    checkDuplicateNumber
  };
};