import React from 'react';
import { Database, Cloud, RefreshCw } from 'lucide-react';

interface FirebaseStatusProps {
  onSync?: () => void;
  isLoading?: boolean;
}

export const FirebaseStatus: React.FC<FirebaseStatusProps> = ({
  onSync,
  isLoading
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-orange-600 mr-2" />
          <div>
            <span className="text-orange-800 font-medium">Firebase Storage</span>
            <p className="text-orange-600 text-sm">
              Documents are stored securely in Firebase Firestore with real-time sync and backup capabilities.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onSync && (
            <button
              onClick={onSync}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
          <Cloud className="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </div>
  );
};