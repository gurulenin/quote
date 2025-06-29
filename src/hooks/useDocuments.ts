import { useState, useEffect } from 'react';
import { SavedDocument, DocumentType } from '../types';
import { firebaseManager } from '../utils/firebaseManager';
import { User } from 'firebase/auth';

export const useDocuments = (firebaseUser: User | null) => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!firebaseUser) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const docs = await firebaseManager.getAllDocuments();
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
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docId = await firebaseManager.saveDocument(documentData);
      await loadDocuments(); // Refresh the list
      return docId;
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    }
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      await firebaseManager.deleteDocument(docId);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  const updateDocument = async (docId: string, documentData: Partial<SavedDocument>): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      await firebaseManager.updateDocument(docId, documentData);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  };

  const getDocumentById = async (docId: string): Promise<SavedDocument | null> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      return await firebaseManager.getDocumentById(docId);
    } catch (err) {
      console.error('Error getting document by ID:', err);
      throw err;
    }
  };

  const clearAllDocuments = async (): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      await firebaseManager.clearAllDocuments();
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error clearing documents:', err);
      throw err;
    }
  };

  const importDocuments = async (docs: Omit<SavedDocument, 'id'>[]): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      await firebaseManager.importDocuments(docs);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error importing documents:', err);
      throw err;
    }
  };

  const getDocumentsByType = async (docType: DocumentType): Promise<SavedDocument[]> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      return await firebaseManager.getDocumentsByType(docType);
    } catch (err) {
      console.error('Error getting documents by type:', err);
      throw err;
    }
  };

  const checkDuplicateNumber = async (docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> => {
    if (!firebaseUser) {
      return false;
    }

    try {
      return await firebaseManager.checkDuplicateNumber(docNumber, docType, excludeDocId);
    } catch (err) {
      console.error('Error checking duplicate number:', err);
      return false;
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      loadDocuments();
    } else {
      // Clear data when user logs out
      setDocuments([]);
      setError(null);
      setIsLoading(false);
    }
  }, [firebaseUser]);

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