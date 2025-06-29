import React from 'react';
import { FileText } from 'lucide-react';

interface TermsConditionsProps {
  termsAndConditions: string;
  onChange: (terms: string) => void;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({
  termsAndConditions,
  onChange
}) => {
  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 text-gray-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-800">Terms & Conditions</h2>
      </div>
      
      <textarea
        value={termsAndConditions}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Enter terms and conditions..."
        className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
      />
    </div>
  );
};