import React from 'react';
import { Users } from 'lucide-react';
import { ClientInfo, DocumentType } from '../types';

interface ClientDetailsProps {
  client: ClientInfo;
  onChange: (client: ClientInfo) => void;
  docType: DocumentType;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  onChange,
  docType
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({
      ...client,
      [e.target.name]: e.target.value
    });
  };

  const getLabel = () => {
    switch (docType) {
      case 'Purchase Order':
        return 'Vendor Details';
      default:
        return 'To';
    }
  };

  return (
    <div className="p-6 bg-green-50 rounded-lg border border-green-200 shadow-sm">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 text-green-600 mr-2" />
        <h2 className="text-xl font-bold text-green-800">{getLabel()}</h2>
      </div>
      
      <div className="space-y-4">
        <input
          type="text"
          name="name"
          value={client.name}
          onChange={handleChange}
          placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} Name`}
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
        
        <textarea
          name="address"
          value={client.address}
          onChange={handleChange}
          placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} Address`}
          rows={3}
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
        />
        
        <input
          type="text"
          name="phone"
          value={client.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
        
        <input
          type="text"
          name="gstin"
          value={client.gstin}
          onChange={handleChange}
          placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} GSTIN`}
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>
    </div>
  );
};