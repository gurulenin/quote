export type DocumentType = 'Invoice' | 'Quotation' | 'Purchase Order';

export interface User {
  isAuthenticated: boolean;
  loginTime?: string;
  email?: string;
  uid?: string;
  authMethod?: 'firebase';
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  website: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  email: string;
}

export interface DocumentInfo {
  number: string;
  issueDate: string;
  validUntil: string;
  placeOfSupply: string;
  deliveryDate: string;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  branchName: string;
  ifscCode: string;
}

export interface LineItem {
  sNo: number;
  description: string;
  hsnSac: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  gstRate: number;
  // For simple mode
  taxableValue?: number;
}

export interface Totals {
  subTotalTaxableValue: number;
  totalGSTAmountOverall: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  isInterState: boolean;
}

export interface Product {
  Description: string;
  HSN: string;
  Price: string;
}

export interface SavedDocument {
  id: string;
  docType: DocumentType;
  company: CompanyInfo;
  client: ClientInfo;
  shippingDetails: { name: string; address: string };
  shippingSameAsBilling: boolean;
  docDetails: DocumentInfo;
  bankDetails: BankInfo;
  items: LineItem[];
  totals: Totals;
  termsAndConditions: string;
  fixedUpiId: string;
  timestamp: string;
  isSimpleMode?: boolean;
  gstMode?: 'auto' | 'igst' | 'cgst_sgst';
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  createdAt: string;
}