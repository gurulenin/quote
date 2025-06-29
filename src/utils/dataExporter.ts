import { ClientInfo, DocumentType, DocumentInfo, Totals } from '../types';

interface ExportData {
  client: ClientInfo;
  docType: DocumentType;
  docDetails: DocumentInfo;
  totals: Totals;
}

export const exportClientData = (data: ExportData) => {
  const header = [
    "Client Name",
    "Client Address", 
    "Client Phone",
    "Client GSTIN",
    "Document Type",
    "Document Number",
    "Issue Date",
    "Valid Until",
    "Grand Total"
  ];

  const escapeCsvValue = (value: any): string => {
    if (value == null) return '';
    let str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const dataRow = [
    escapeCsvValue(data.client.name),
    escapeCsvValue(data.client.address),
    escapeCsvValue(data.client.phone),
    escapeCsvValue(data.client.gstin),
    escapeCsvValue(data.docType),
    escapeCsvValue(data.docDetails.number),
    escapeCsvValue(data.docDetails.issueDate),
    escapeCsvValue(data.docType === 'Quotation' ? data.docDetails.validUntil : 'N/A'),
    escapeCsvValue(data.totals.grandTotal.toFixed(2))
  ];

  const csvContent = `${header.join(',')}\n${dataRow.join(',')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `client_data_${data.docType.toLowerCase()}_${data.docDetails.number}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};