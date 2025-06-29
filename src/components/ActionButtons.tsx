import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { exportClientData } from '../utils/dataExporter';
import { DocumentType, CompanyInfo, ClientInfo, DocumentInfo, BankInfo, LineItem, Totals } from '../types';

interface ActionButtonsProps {
  docType: DocumentType;
  company: CompanyInfo;
  client: ClientInfo;
  shippingDetails: { name: string; address: string };
  docDetails: DocumentInfo;
  bankDetails: BankInfo;
  items: LineItem[];
  totals: Totals;
  termsAndConditions: string;
  fixedUpiId: string;
  isSimpleMode: boolean;
  onExportClientData: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  docType,
  company,
  client,
  shippingDetails,
  docDetails,
  bankDetails,
  items,
  totals,
  termsAndConditions,
  fixedUpiId,
  isSimpleMode,
  onExportClientData
}) => {
  const handleDownloadPDF = async () => {
    try {
      await generatePDF({
        docType,
        company,
        client,
        shippingDetails,
        docDetails,
        bankDetails,
        items,
        totals,
        termsAndConditions,
        fixedUpiId,
        isSimpleMode
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleExportClientData = () => {
    exportClientData({
      client,
      docType,
      docDetails,
      totals
    });
    onExportClientData();
  };

  return (
    <div className="flex justify-center flex-wrap gap-4 pt-8">
      <button
        onClick={handleDownloadPDF}
        className="px-8 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 shadow-lg flex items-center transition-all duration-300 transform hover:scale-105"
      >
        <Download className="w-5 h-5 mr-2" />
        Download {docType} PDF
      </button>
      
      <button
        onClick={handleExportClientData}
        className="px-8 py-4 bg-gray-600 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 shadow-lg flex items-center transition-all duration-300 transform hover:scale-105"
      >
        <FileSpreadsheet className="w-5 h-5 mr-2" />
        Export Data (CSV)
      </button>
    </div>
  );
};