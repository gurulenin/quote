import React from 'react';
import { Database, HardDrive, RefreshCw } from 'lucide-react';

interface IndexedDBStatusProps {
  onSync?: () => void;
  isLoading?: boolean;
}

export const FirebaseStatus: React.FC<IndexedDBStatusProps> = ({
  onSync,
  isLoading
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center">
          <HardDrive className="w-5 h-5 text-green-600 mr-2" />
          <div>
            <span className="text-green-800 font-medium">Local Storage (IndexedDB)</span>
            <p className="text-green-600 text-sm">
              Documents are stored locally in your browser with automatic backup capabilities.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onSync && (
            <button
              onClick={onSync}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <Database className="w-5 h-5 text-green-600" />
        </div>
      </div>
    </div>
  );
};