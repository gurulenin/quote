import React from 'react';
import { History, Save, Download, Upload, Trash2, Eye, Cloud } from 'lucide-react';
import { SavedDocument } from '../types';

interface DocumentHistoryProps {
  documents: SavedDocument[];
  isLoading: boolean;
  error: string | null;
  onSave: () => void;
  onLoad: (docId: string) => void;
  onDelete: (docId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documents,
  isLoading,
  error,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onImport
}) => {
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <History className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Document History</h2>
        </div>
        
        <div className="flex items-center text-sm">
          <div className="flex items-center text-orange-600">
            <Cloud className="w-4 h-4 mr-1" />
            <span>Firebase Storage</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Current Document
        </button>
        
        <button
          onClick={onExport}
          disabled={documents.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export All (JSON)
        </button>
        
        <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Import (JSON)
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </label>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-blue-600 mt-2">Loading...</p>
        </div>
      )}
      
      {!isLoading && documents.length === 0 && (
        <p className="text-center text-gray-500 py-8">No documents saved yet.</p>
      )}
      
      {!isLoading && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex-1 mb-3 sm:mb-0">
                <div className="font-medium text-gray-800">
                  {doc.docType} #{doc.docDetails?.number || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  Client: {doc.client?.name || 'N/A'} • 
                  Total: ₹{doc.totals?.grandTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span>Saved: {new Date(doc.timestamp).toLocaleString()}</span>
                  <Cloud className="w-3 h-3 ml-2 text-orange-500" title="Stored in Firebase" />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onLoad(doc.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Load
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};