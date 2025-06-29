import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  FileText,
  Settings
} from 'lucide-react';
import { backupManager } from '../utils/backupManager';

interface BackupRestoreProps {
  onBackupComplete: (message: string) => void;
  onRestoreComplete: (message: string) => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  onBackupComplete,
  onRestoreComplete
}) => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupInfo, setBackupInfo] = useState({
    totalDocuments: 0,
    lastBackup: null as string | null,
    estimatedSize: '0 MB'
  });
  const [restoreStats, setRestoreStats] = useState<any>(null);

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const info = await backupManager.getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error loading backup info:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await backupManager.downloadBackup();
      backupManager.updateLastBackupDate();
      await loadBackupInfo();
      onBackupComplete('Backup created and downloaded successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      onBackupComplete('Failed to create backup. Please try again.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreStats(null);

    try {
      const result = await backupManager.restoreFromBackup(file);
      
      if (result.success) {
        setRestoreStats(result.stats);
        onRestoreComplete(result.message);
        await loadBackupInfo();
        
        // Refresh the page after successful restore to reload all data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        onRestoreComplete(result.message);
      }
    } catch (error) {
      console.error('Restore failed:', error);
      onRestoreComplete('Failed to restore backup. Please check the file and try again.');
    } finally {
      setIsRestoring(false);
      e.target.value = ''; // Reset file input
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-purple-600 mr-3" />
        <h2 className="text-2xl font-bold text-purple-800">Backup & Restore</h2>
      </div>

      {/* Backup Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Documents</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{backupInfo.totalDocuments}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <Database className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Estimated Size</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{backupInfo.estimatedSize}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Last Backup</span>
          </div>
          <p className="text-sm font-bold text-orange-600">{formatDate(backupInfo.lastBackup)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleCreateBackup}
          disabled={isCreatingBackup || backupInfo.totalDocuments === 0}
          className="flex-1 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-5 h-5 mr-2" />
          {isCreatingBackup ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Creating Backup...
            </>
          ) : (
            'Create Full Backup'
          )}
        </button>

        <label className="flex-1 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]">
          <Upload className="w-5 h-5 mr-2" />
          {isRestoring ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Restoring...
            </>
          ) : (
            'Restore from Backup'
          )}
          <input
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            disabled={isRestoring}
            className="hidden"
          />
        </label>
      </div>

      {/* Warning Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Important Notes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Backup includes all documents, settings, and user preferences</li>
              <li>• Restoring will replace ALL current data - this cannot be undone</li>
              <li>• Create regular backups to prevent data loss</li>
              <li>• Backup files are in JSON format and can be stored safely</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Restore Stats */}
      {restoreStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-2">Restore Completed Successfully</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <span className="font-medium">Documents Restored:</span> {restoreStats.documentsRestored}
                </div>
                <div>
                  <span className="font-medium">Backup Version:</span> {restoreStats.backupVersion}
                </div>
                <div>
                  <span className="font-medium">Original Backup Date:</span> {formatDate(restoreStats.backupDate)}
                </div>
                <div>
                  <span className="font-medium">Backup Size:</span> {restoreStats.originalSize}
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 italic">
                Page will refresh automatically to load restored data...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What's Included */}
      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          What's Included in Backup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            All saved documents (invoices, quotations, purchase orders)
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Company and client information
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Bank details and payment information
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Application settings and preferences
          </div>
        </div>
      </div>
    </div>
  );
};