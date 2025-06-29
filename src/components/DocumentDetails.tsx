import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { DocumentType, DocumentInfo } from '../types';
import { SmartDocumentNumber } from './SmartDocumentNumber';

interface DocumentDetailsProps {
  docType: DocumentType;
  docDetails: DocumentInfo;
  onChange: (details: DocumentInfo) => void;
}

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({
  docType,
  docDetails,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...docDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleNumberChange = (number: string) => {
    onChange({
      ...docDetails,
      number
    });
  };

  return (
    <div className="flex flex-wrap justify-between items-start mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex-1 min-w-[250px] mr-4 mb-4">
        <SmartDocumentNumber
          docType={docType}
          value={docDetails.number}
          onChange={handleNumberChange}
        />
      </div>
      
      <div className="flex-1 min-w-[200px] mr-4 mb-4">
        <label className="flex items-center text-gray-700 text-sm font-bold mb-2">
          <Calendar className="w-4 h-4 mr-1" />
          Issue Date
        </label>
        <input
          type="date"
          name="issueDate"
          value={docDetails.issueDate}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
      </div>
      
      {docType === 'Quotation' && (
        <div className="flex-1 min-w-[200px] mr-4 mb-4">
          <label className="flex items-center text-gray-700 text-sm font-bold mb-2">
            <Calendar className="w-4 h-4 mr-1" />
            Valid Until
          </label>
          <input
            type="date"
            name="validUntil"
            value={docDetails.validUntil}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      )}
      
      {docType === 'Purchase Order' && (
        <div className="flex-1 min-w-[200px] mr-4 mb-4">
          <label className="flex items-center text-gray-700 text-sm font-bold mb-2">
            <Calendar className="w-4 h-4 mr-1" />
            Delivery Date
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={docDetails.deliveryDate}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-[200px] mb-4">
        <label className="flex items-center text-gray-700 text-sm font-bold mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          Place of Supply
        </label>
        <input
          type="text"
          name="placeOfSupply"
          value={docDetails.placeOfSupply}
          onChange={handleChange}
          placeholder="Place of Supply"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
      </div>
    </div>
  );
};