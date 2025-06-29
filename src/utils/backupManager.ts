import { firebaseManager } from './firebaseManager';

interface AppBackup {
  version: string;
  timestamp: string;
  documents: any[];
  settings: any;
  userPreferences: any;
  metadata: {
    totalDocuments: number;
    backupSize: string;
    appVersion: string;
  };
}

class BackupManager {
  private readonly BACKUP_VERSION = '1.0.0';
  private readonly APP_VERSION = '1.0.0';

  async createFullBackup(): Promise<Blob> {
    try {
      // Get all documents from Firebase
      const documents = await firebaseManager.getAllDocuments();

      // Get localStorage data
      const settings = this.getLocalStorageData();

      // Get user preferences
      const userPreferences = this.getUserPreferences();

      // Calculate backup size
      const backupData: AppBackup = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        documents: documents.map(doc => ({
          ...doc,
          id: undefined // Remove ID for import compatibility
        })),
        settings,
        userPreferences,
        metadata: {
          totalDocuments: documents.length,
          backupSize: '0 MB', // Will be calculated after stringification
          appVersion: this.APP_VERSION
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const sizeInMB = (new Blob([jsonString]).size / (1024 * 1024)).toFixed(2);
      backupData.metadata.backupSize = `${sizeInMB} MB`;

      // Create final backup with correct size
      const finalJsonString = JSON.stringify(backupData, null, 2);
      return new Blob([finalJsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  async downloadBackup(): Promise<void> {
    try {
      const backupBlob = await this.createFullBackup();
      const url = URL.createObjectURL(backupBlob);
      const link = document.createElement('a');
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.href = url;
      link.download = `invoice-app-backup-${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  }

  async restoreFromBackup(file: File): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      const text = await file.text();
      const backupData: AppBackup = JSON.parse(text);

      // Validate backup format
      if (!this.validateBackupFormat(backupData)) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      const confirmRestore = window.confirm(
        `This will restore ${backupData.metadata.totalDocuments} documents and replace all current data. This action cannot be undone. Continue?`
      );

      if (!confirmRestore) {
        return {
          success: false,
          message: 'Restore cancelled by user',
          stats: null
        };
      }

      // Clear existing data
      await this.clearAllData();

      // Restore documents to Firebase
      if (backupData.documents.length > 0) {
        await firebaseManager.importDocuments(backupData.documents);
      }

      // Restore localStorage data
      this.restoreLocalStorageData(backupData.settings);

      // Restore user preferences
      this.restoreUserPreferences(backupData.userPreferences);

      const stats = {
        documentsRestored: backupData.documents.length,
        backupVersion: backupData.version,
        backupDate: backupData.timestamp,
        originalSize: backupData.metadata.backupSize
      };

      return {
        success: true,
        message: `Successfully restored ${backupData.documents.length} documents`,
        stats
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        message: `Failed to restore backup: ${error.message}`,
        stats: null
      };
    }
  }

  private validateBackupFormat(data: any): data is AppBackup {
    return (
      data &&
      typeof data === 'object' &&
      data.version &&
      data.timestamp &&
      Array.isArray(data.documents) &&
      data.metadata &&
      typeof data.metadata.totalDocuments === 'number'
    );
  }

  private getLocalStorageData(): any {
    const localStorageData: any = {};
    
    // Get all localStorage keys related to the app
    const appKeys = [
      'invoice_app_auth',
      'invoice_app_documents', // Fallback storage
      'invoice_app_settings',
      'invoice_app_preferences',
      'imported_client_data',
      'imported_product_data',
      'client_sheet_url',
      'product_sheet_url',
      'last_client_sync',
      'last_product_sync'
    ];

    appKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          localStorageData[key] = JSON.parse(value);
        } catch {
          localStorageData[key] = value;
        }
      }
    });

    return localStorageData;
  }

  private getUserPreferences(): any {
    return {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'en',
      currency: localStorage.getItem('currency') || 'INR',
      dateFormat: localStorage.getItem('dateFormat') || 'DD/MM/YYYY'
    };
  }

  private async clearAllData(): Promise<void> {
    // Clear Firebase documents
    await firebaseManager.clearAllDocuments();

    // Clear relevant localStorage items (but keep auth for current session)
    const keysToKeep = ['invoice_app_auth', 'firebase_session_token']; // Keep current session
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (key.startsWith('invoice_app_') && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  private restoreLocalStorageData(settings: any): void {
    if (!settings) return;

    Object.entries(settings).forEach(([key, value]) => {
      if (key !== 'invoice_app_auth' && key !== 'firebase_session_token') { // Don't restore auth to avoid logout
        try {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch (error) {
          console.warn(`Failed to restore localStorage item: ${key}`, error);
        }
      }
    });
  }

  private restoreUserPreferences(preferences: any): void {
    if (!preferences) return;

    Object.entries(preferences).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value as string);
      } catch (error) {
        console.warn(`Failed to restore preference: ${key}`, error);
      }
    });
  }

  async getBackupInfo(): Promise<{
    totalDocuments: number;
    lastBackup: string | null;
    estimatedSize: string;
  }> {
    try {
      const documents = await firebaseManager.getAllDocuments();
      
      // Estimate backup size
      const sampleData = {
        documents: documents.slice(0, Math.min(10, documents.length)),
        settings: this.getLocalStorageData(),
        userPreferences: this.getUserPreferences()
      };
      
      const sampleSize = new Blob([JSON.stringify(sampleData)]).size;
      const estimatedTotalSize = documents.length > 0 
        ? (sampleSize * documents.length / Math.min(10, documents.length)) / (1024 * 1024)
        : 0;

      return {
        totalDocuments: documents.length,
        lastBackup: localStorage.getItem('last_backup_date'),
        estimatedSize: `${estimatedTotalSize.toFixed(2)} MB`
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return {
        totalDocuments: 0,
        lastBackup: null,
        estimatedSize: '0 MB'
      };
    }
  }

  updateLastBackupDate(): void {
    localStorage.setItem('last_backup_date', new Date().toISOString());
  }
}

export const backupManager = new BackupManager();