import React from 'react';
import { CreditCard } from 'lucide-react';
import { BankInfo } from '../types';

interface BankDetailsProps {
  bankDetails: BankInfo;
  onChange: (bankDetails: BankInfo) => void;
}

export const BankDetails: React.FC<BankDetailsProps> = ({ bankDetails, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...bankDetails,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm mb-8">
      <div className="flex items-center mb-4">
        <CreditCard className="w-5 h-5 text-yellow-600 mr-2" />
        <h2 className="text-xl font-bold text-yellow-800">Bank Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Bank Name</label>
          <input
            type="text"
            name="bankName"
            value={bankDetails.bankName}
            onChange={handleChange}
            placeholder="Bank Name"
            className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Account Number</label>
          <input
            type="text"
            name="accountNumber"
            value={bankDetails.accountNumber}
            onChange={handleChange}
            placeholder="Account Number"
            className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Branch Name</label>
          <input
            type="text"
            name="branchName"
            value={bankDetails.branchName}
            onChange={handleChange}
            placeholder="Branch Name"
            className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">IFSC Code</label>
          <input
            type="text"
            name="ifscCode"
            value={bankDetails.ifscCode}
            onChange={handleChange}
            placeholder="IFSC Code"
            className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};