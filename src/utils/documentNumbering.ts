import { DocumentType } from '../types';
import { firebaseManager } from './firebaseManager';

export class DocumentNumberingManager {
  private static instance: DocumentNumberingManager;
  
  private constructor() {}
  
  static getInstance(): DocumentNumberingManager {
    if (!DocumentNumberingManager.instance) {
      DocumentNumberingManager.instance = new DocumentNumberingManager();
    }
    return DocumentNumberingManager.instance;
  }

  static async getNextDocumentNumber(docType: DocumentType): Promise<string> {
    const instance = DocumentNumberingManager.getInstance();
    return instance.getNextNumber(docType);
  }

  static async getRecentNumbers(docType: DocumentType, limitCount: number = 10): Promise<string[]> {
    const instance = DocumentNumberingManager.getInstance();
    return instance.getRecentNumbers(docType, limitCount);
  }

  static async checkDuplicateNumber(docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> {
    const instance = DocumentNumberingManager.getInstance();
    return instance.checkDuplicateNumber(docNumber, docType, excludeDocId);
  }

  static validateDocumentNumber(docNumber: string): { isValid: boolean; error?: string } {
    if (!docNumber || !docNumber.trim()) {
      return { isValid: false, error: 'Document number is required' };
    }

    // Check for basic format: should contain single # and /
    if (!docNumber.includes('#') || !docNumber.includes('/')) {
      return { isValid: false, error: 'Format should be #number/year (e.g., #123/2024)' };
    }

    // Extract number and year - looking for single # only
    const match = docNumber.match(/^#(\d+)\/(\d{4})$/);
    if (!match) {
      return { isValid: false, error: 'Invalid format. Use #number/year (e.g., #123/2024)' };
    }

    const [, numberPart, yearPart] = match;
    const number = parseInt(numberPart, 10);
    const year = parseInt(yearPart, 10);
    const currentYear = new Date().getFullYear();

    if (number < 1) {
      return { isValid: false, error: 'Document number must be greater than 0' };
    }

    if (year < 2020 || year > currentYear + 1) {
      return { isValid: false, error: `Year should be between 2020 and ${currentYear + 1}` };
    }

    return { isValid: true };
  }

  async getNextNumber(docType: DocumentType): Promise<string> {
    try {
      const documents = await firebaseManager.getDocumentsByType(docType);
      const currentYear = new Date().getFullYear();
      
      if (documents.length === 0) {
        return this.formatNumber(1, currentYear);
      }

      // Filter documents for current year and extract numbers
      const currentYearDocs = documents.filter(doc => {
        const match = doc.docDetails.number.match(/^#(\d+)\/(\d{4})$/);
        return match && parseInt(match[2], 10) === currentYear;
      });

      if (currentYearDocs.length === 0) {
        return this.formatNumber(1, currentYear);
      }

      // Extract numbers from current year documents
      const numbers = currentYearDocs
        .map(doc => this.extractNumber(doc.docDetails.number))
        .filter(num => num !== null)
        .sort((a, b) => b! - a!); // Sort descending

      const highestNumber = numbers.length > 0 ? numbers[0]! : 0;
      return this.formatNumber(highestNumber + 1, currentYear);
    } catch (error) {
      console.error('Error getting next document number:', error);
      const currentYear = new Date().getFullYear();
      return this.formatNumber(1, currentYear);
    }
  }

  async getRecentNumbers(docType: DocumentType, limitCount: number = 10): Promise<string[]> {
    try {
      const documents = await firebaseManager.getDocumentsByType(docType);
      
      // Sort by creation date (most recent first) and limit the results
      const recentDocuments = documents
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limitCount);

      return recentDocuments.map(doc => doc.docDetails.number);
    } catch (error) {
      console.error('Error getting recent document numbers:', error);
      return [];
    }
  }

  async checkDuplicateNumber(docNumber: string, docType: DocumentType, excludeDocId?: string): Promise<boolean> {
    try {
      return await firebaseManager.checkDuplicateNumber(docNumber, docType, excludeDocId);
    } catch (error) {
      console.error('Error checking duplicate number:', error);
      return false;
    }
  }

  private extractNumber(docNumber: string): number | null {
    // Extract number from formats like "#123/2024" (single # only)
    const match = docNumber.match(/^#(\d+)\/\d{4}$/);
    return match ? parseInt(match[1], 10) : null;
  }

  private formatNumber(number: number, year: number): string {
    return `#${number}/${year}`;
  }

  validateNumberFormat(docNumber: string, docType: DocumentType): boolean {
    const validation = DocumentNumberingManager.validateDocumentNumber(docNumber);
    return validation.isValid;
  }

  suggestCorrectFormat(docNumber: string, docType: DocumentType): string {
    const currentYear = new Date().getFullYear();
    
    // Try to extract any numbers from the input
    const numbers = docNumber.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const number = parseInt(numbers[0], 10);
      return this.formatNumber(number, currentYear);
    }
    
    return this.formatNumber(1, currentYear);
  }
}

export const documentNumberingManager = DocumentNumberingManager.getInstance();