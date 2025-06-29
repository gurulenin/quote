import React from 'react';
import { Building2 } from 'lucide-react';
import { CompanyInfo, DocumentType } from '../types';

interface CompanyDetailsProps {
  company: CompanyInfo;
  onChange: (company: CompanyInfo) => void;
  docType: DocumentType;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  onChange,
  docType
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({
      ...company,
      [e.target.name]: e.target.value
    });
  };

  const getLabel = () => {
    switch (docType) {
      case 'Purchase Order':
        return 'Buyer Details';
      default:
        return 'From';
    }
  };

  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
      <div className="flex items-center mb-4">
        <Building2 className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold text-blue-800">{getLabel()}</h2>
      </div>
      
      <div className="space-y-4">
        <input
          type="text"
          name="name"
          value={company.name}
          onChange={handleChange}
          placeholder="Company Name"
          className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        
        <textarea
          name="address"
          value={company.address}
          onChange={handleChange}
          placeholder="Company Address"
          rows={3}
          className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="phone"
            value={company.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          
          <input
            type="email"
            name="email"
            value={company.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="gstin"
            value={company.gstin}
            onChange={handleChange}
            placeholder="GSTIN"
            className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          
          <input
            type="text"
            name="website"
            value={company.website}
            onChange={handleChange}
            placeholder="Website"
            className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};