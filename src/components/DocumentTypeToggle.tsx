import React from 'react';
import { DocumentType } from '../types';

interface DocumentTypeToggleProps {
  docType: DocumentType;
  onDocTypeChange: (type: DocumentType) => void;
}

export const DocumentTypeToggle: React.FC<DocumentTypeToggleProps> = ({
  docType,
  onDocTypeChange
}) => {
  const types: DocumentType[] = ['Invoice', 'Quotation', 'Purchase Order'];

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gray-100 rounded-lg p-1">
        {types.map(type => (
          <button
            key={type}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-md ${
              docType === type 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => onDocTypeChange(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};