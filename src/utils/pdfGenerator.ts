import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DocumentType, CompanyInfo, ClientInfo, DocumentInfo, BankInfo, LineItem, Totals } from '../types';

interface PDFData {
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
}

export const generatePDF = async (data: PDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yPos = 10;
  const pageMargin = 15;
  const contentWidth = 210 - (2 * pageMargin);

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 106, 103);
  pdf.text(data.company.name, pageMargin, yPos);
  pdf.setTextColor(0, 0, 0);
  yPos += 7;

  // Company details
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const companyAddressLines = pdf.splitTextToSize(data.company.address, contentWidth / 2 - 5);
  companyAddressLines.forEach((line: string) => {
    pdf.text(line, pageMargin, yPos);
    yPos += 4;
  });
  
  pdf.text(`Phone: ${data.company.phone}`, pageMargin, yPos); yPos += 4;
  pdf.text(`Email: ${data.company.email}`, pageMargin, yPos); yPos += 4;
  pdf.text(`GSTIN: ${data.company.gstin}`, pageMargin, yPos); yPos += 4;
  pdf.text(`Website: ${data.company.website}`, pageMargin, yPos); yPos += 10;

  // Right-aligned info block
  let rightColYPos = 15;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  if (data.docType === 'Quotation') {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount Due:', 130, rightColYPos);
    pdf.setFontSize(16);
    pdf.text(`Rs ${data.totals.grandTotal.toFixed(2)}`, 210 - pageMargin, rightColYPos, { align: 'right' });
    rightColYPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('Valid Until:', 140, rightColYPos);
    pdf.text(data.docDetails.validUntil, 210 - pageMargin, rightColYPos, { align: 'right' });
    rightColYPos += 5;
  }
  
  if (data.docType === 'Purchase Order') {
    pdf.text('Delivery Date:', 140, rightColYPos);
    pdf.text(data.docDetails.deliveryDate, 210 - pageMargin, rightColYPos, { align: 'right' });
    rightColYPos += 5;
  }
  
  pdf.text('Issue Date:', 140, rightColYPos);
  pdf.text(data.docDetails.issueDate, 210 - pageMargin, rightColYPos, { align: 'right' });
  rightColYPos += 5;
  pdf.text('Place of Supply:', 140, rightColYPos);
  pdf.text(data.docDetails.placeOfSupply, 210 - pageMargin, rightColYPos, { align: 'right' });
  
  yPos = Math.max(yPos, rightColYPos) + 5;

  // Document title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 106, 103);
  pdf.text(data.docType.toUpperCase(), 105, yPos, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  yPos += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  
  // Display document number exactly as entered - no formatting
  pdf.text(data.docDetails.number, 210 - pageMargin, yPos, { align: 'right' });
  yPos += 8;
  pdf.setDrawColor(0, 49, 97);
  pdf.line(pageMargin, yPos, 210 - pageMargin, yPos);
  pdf.setDrawColor(0, 0, 0);
  yPos += 5;

  // Billing and shipping details
  const billToLabel = data.docType === 'Purchase Order' ? 'Vendor Details' : 'Bill To';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(billToLabel, pageMargin, yPos);
  pdf.text('Ship To', pageMargin + contentWidth / 2, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.client.name, pageMargin, yPos);
  pdf.text(data.shippingDetails.name, pageMargin + contentWidth / 2, yPos);
  yPos += 4;
  
  const clientAddressLines = pdf.splitTextToSize(data.client.address, contentWidth / 2 - 5);
  const shippingAddressLines = pdf.splitTextToSize(data.shippingDetails.address, contentWidth / 2 - 5);
  let tempClientYPos = yPos;
  let tempShippingYPos = yPos;
  
  clientAddressLines.forEach((line: string) => {
    pdf.text(line, pageMargin, tempClientYPos);
    tempClientYPos += 4;
  });
  
  shippingAddressLines.forEach((line: string) => {
    pdf.text(line, pageMargin + contentWidth / 2, tempShippingYPos);
    tempShippingYPos += 4;
  });
  
  yPos = Math.max(tempClientYPos, tempShippingYPos);
  pdf.text(data.client.phone, pageMargin, yPos);
  yPos += 4;
  pdf.text(`GSTIN: ${data.client.gstin}`, pageMargin, yPos);
  yPos += 10;

  // Items table
  let tableColumns, tableRows;

  if (data.isSimpleMode) {
    // Simple mode table
    tableColumns = [
      { header: 'S.No', dataKey: 'sNo' },
      { header: 'Item Description', dataKey: 'description' },
      { header: 'Taxable Value (Rs)', dataKey: 'taxableValue' },
      { header: 'GST (Rs)', dataKey: 'gstAmount' },
      { header: 'Total Amount (Rs)', dataKey: 'totalAmount' }
    ];

    tableRows = data.items.map(item => {
      const itemTaxableValue = item.taxableValue || 0;
      const itemGSTAmount = (itemTaxableValue * item.gstRate) / 100;
      const itemTotalAmount = itemTaxableValue + itemGSTAmount;
      
      return {
        sNo: item.sNo,
        description: item.description,
        taxableValue: itemTaxableValue.toFixed(2),
        gstAmount: itemGSTAmount.toFixed(2),
        totalAmount: itemTotalAmount.toFixed(2)
      };
    });
  } else {
    // Detailed mode table
    if (data.totals.isInterState) {
      // Inter-state: Show IGST
      tableColumns = [
        { header: 'S.No', dataKey: 'sNo' },
        { header: 'Item Description', dataKey: 'description' },
        { header: 'HSN/SAC', dataKey: 'hsnSac' },
        { header: 'Qty', dataKey: 'quantity' },
        { header: 'UoM', dataKey: 'uom' },
        { header: 'Rate (Rs)', dataKey: 'unitPrice' },
        { header: 'Taxable Value (Rs)', dataKey: 'taxableValue' },
        { header: 'IGST (Rs)', dataKey: 'igst' },
        { header: 'Amount (Rs)', dataKey: 'amount' }
      ];

      tableRows = data.items.map(item => {
        const taxableValuePerUnit = item.unitPrice / (1 + item.gstRate / 100);
        const gstPerUnit = item.unitPrice - taxableValuePerUnit;
        const itemTaxableValue = (item.quantity * taxableValuePerUnit).toFixed(2);
        const itemIGST = (item.quantity * gstPerUnit).toFixed(2);
        const itemAmount = (item.quantity * item.unitPrice).toFixed(2);
        
        return {
          sNo: item.sNo,
          description: item.description,
          hsnSac: item.hsnSac,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: item.unitPrice.toFixed(2),
          taxableValue: itemTaxableValue,
          igst: itemIGST,
          amount: itemAmount
        };
      });
    } else {
      // Intra-state: Show combined GST (CGST + SGST combined into one column)
      tableColumns = [
        { header: 'S.No', dataKey: 'sNo' },
        { header: 'Item Description', dataKey: 'description' },
        { header: 'HSN/SAC', dataKey: 'hsnSac' },
        { header: 'Qty', dataKey: 'quantity' },
        { header: 'UoM', dataKey: 'uom' },
        { header: 'Rate (Rs)', dataKey: 'unitPrice' },
        { header: 'Taxable Value (Rs)', dataKey: 'taxableValue' },
        { header: 'GST (Rs)', dataKey: 'gst' },
        { header: 'Amount (Rs)', dataKey: 'amount' }
      ];

      tableRows = data.items.map(item => {
        const taxableValuePerUnit = item.unitPrice / (1 + item.gstRate / 100);
        const gstPerUnit = item.unitPrice - taxableValuePerUnit;
        const itemTaxableValue = (item.quantity * taxableValuePerUnit).toFixed(2);
        const itemTotalGST = (item.quantity * gstPerUnit).toFixed(2); // Combined CGST + SGST
        const itemAmount = (item.quantity * item.unitPrice).toFixed(2);
        
        return {
          sNo: item.sNo,
          description: item.description,
          hsnSac: item.hsnSac,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: item.unitPrice.toFixed(2),
          taxableValue: itemTaxableValue,
          gst: itemTotalGST,
          amount: itemAmount
        };
      });
    }
  }

  // Column styles with proper width allocation
  let columnStyles: any = {};
  
  if (data.isSimpleMode) {
    // Simple mode: 5 columns
    columnStyles = {
      0: { cellWidth: 15, halign: 'center' },    // S.No
      1: { cellWidth: 85, halign: 'left' },      // Description (largest)
      2: { cellWidth: 30, halign: 'right' },     // Taxable Value
      3: { cellWidth: 25, halign: 'right' },     // GST
      4: { cellWidth: 25, halign: 'right' }      // Total Amount
    };
  } else if (data.totals.isInterState) {
    // IGST layout: 9 columns
    columnStyles = {
      0: { cellWidth: 12, halign: 'center' },    // S.No
      1: { cellWidth: 45, halign: 'left' },      // Description
      2: { cellWidth: 18, halign: 'center' },    // HSN/SAC
      3: { cellWidth: 12, halign: 'right' },     // Qty
      4: { cellWidth: 12, halign: 'center' },    // UoM
      5: { cellWidth: 18, halign: 'right' },     // Rate
      6: { cellWidth: 23, halign: 'right' },     // Taxable Value
      7: { cellWidth: 18, halign: 'right' },     // IGST
      8: { cellWidth: 22, halign: 'right' }      // Amount
    };
  } else {
    // CGST + SGST combined into single GST column: 9 columns
    columnStyles = {
      0: { cellWidth: 12, halign: 'center' },    // S.No
      1: { cellWidth: 45, halign: 'left' },      // Description
      2: { cellWidth: 18, halign: 'center' },    // HSN/SAC
      3: { cellWidth: 12, halign: 'right' },     // Qty
      4: { cellWidth: 12, halign: 'center' },    // UoM
      5: { cellWidth: 18, halign: 'right' },     // Rate
      6: { cellWidth: 23, halign: 'right' },     // Taxable Value
      7: { cellWidth: 18, halign: 'right' },     // GST (Combined)
      8: { cellWidth: 22, halign: 'right' }      // Amount
    };
  }

  (pdf as any).autoTable({
    startY: yPos,
    head: [tableColumns.map(c => c.header)],
    body: tableRows.map(r => Object.values(r)),
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [100, 100, 100],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: 'linebreak',
      halign: 'center'
    },
    columnStyles: columnStyles,
    margin: { left: pageMargin, right: pageMargin }
  });

  yPos = (pdf as any).autoTable.previous.finalY + 10;

  // Totals section with detailed GST breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Total Taxable Value', 135, yPos);
  pdf.text(`Rs ${data.totals.subTotalTaxableValue.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
  yPos += 7;

  // Show GST breakdown with percentages based on transaction type
  if (data.totals.isInterState) {
    // Calculate average IGST rate for display
    const totalTaxableValue = data.totals.subTotalTaxableValue;
    const avgIGSTRate = totalTaxableValue > 0 ? (data.totals.igst / totalTaxableValue * 100) : 0;
    
    pdf.text(`IGST (${avgIGSTRate.toFixed(1)}%)`, 135, yPos);
    pdf.text(`Rs ${data.totals.igst.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
    yPos += 7;
  } else {
    // Calculate average CGST/SGST rates for display
    const totalTaxableValue = data.totals.subTotalTaxableValue;
    const avgCGSTRate = totalTaxableValue > 0 ? (data.totals.cgst / totalTaxableValue * 100) : 0;
    const avgSGSTRate = totalTaxableValue > 0 ? (data.totals.sgst / totalTaxableValue * 100) : 0;
    
    pdf.text(`CGST (${avgCGSTRate.toFixed(1)}%)`, 135, yPos);
    pdf.text(`Rs ${data.totals.cgst.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
    yPos += 7;
    pdf.text(`SGST (${avgSGSTRate.toFixed(1)}%)`, 135, yPos);
    pdf.text(`Rs ${data.totals.sgst.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
    yPos += 7;
  }

  pdf.text('Total Tax Amount', 135, yPos);
  pdf.text(`Rs ${data.totals.totalGSTAmountOverall.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
  yPos += 7;
  pdf.text('Total Value (in figure)', 135, yPos);
  pdf.text(`Rs ${data.totals.grandTotal.toFixed(2)}`, 210 - pageMargin, yPos, { align: 'right' });
  yPos += 7;

  // Number to words
  const numberToWords = (num: number): string => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Only';
  };

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const wordsLines = pdf.splitTextToSize(`(${numberToWords(Math.floor(data.totals.grandTotal))})`, contentWidth);
  wordsLines.forEach((line: string) => {
    pdf.text(line, pageMargin, yPos, { align: 'left' });
    yPos += 4;
  });
  yPos += 6;

  // Bank details and QR code (not for Purchase Orders)
  if (data.docType !== 'Purchase Order') {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Bank Name: ${data.bankDetails.bankName}`, pageMargin, yPos); yPos += 4;
    pdf.text(`Account Number: ${data.bankDetails.accountNumber}`, pageMargin, yPos); yPos += 4;
    pdf.text(`Branch Name: ${data.bankDetails.branchName}`, pageMargin, yPos); yPos += 4;
    pdf.text(`IFSC Code: ${data.bankDetails.ifscCode}`, pageMargin, yPos); yPos += 10;

    // Generate QR Code and add to PDF
    try {
      const qrCodeData = `upi://pay?pa=${data.fixedUpiId}&pn=${encodeURIComponent(data.company.name)}&am=${data.totals.grandTotal.toFixed(2)}&cu=INR`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(qrCodeData)}`;
      
      // Create a promise to handle the image loading
      const loadQRCode = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            try {
              // Create canvas to convert image to base64
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                
                // Add QR code to PDF
                const qrCodeSize = 30;
                const qrCodeX = (pdf.internal.pageSize.width - qrCodeSize) / 2;
                pdf.addImage(dataURL, 'PNG', qrCodeX, yPos, qrCodeSize, qrCodeSize);
                
                resolve();
              } else {
                reject(new Error('Canvas context not available'));
              }
            } catch (error) {
              console.error('Error processing QR code:', error);
              // Add placeholder text instead
              pdf.rect((pdf.internal.pageSize.width - 30) / 2, yPos, 30, 30);
              pdf.text('QR Code', pdf.internal.pageSize.width / 2, yPos + 15, { align: 'center' });
              resolve();
            }
          };
          
          img.onerror = () => {
            console.error('Failed to load QR code image');
            // Add placeholder text instead
            pdf.rect((pdf.internal.pageSize.width - 30) / 2, yPos, 30, 30);
            pdf.text('QR Code', pdf.internal.pageSize.width / 2, yPos + 15, { align: 'center' });
            resolve();
          };
          
          img.src = qrCodeUrl;
        });
      };

      await loadQRCode();
      yPos += 35;
      pdf.setFontSize(9);
      pdf.text(`Scan to Pay (UPI: ${data.fixedUpiId})`, pdf.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 10;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      // Add fallback text
      pdf.text(`UPI Payment: ${data.fixedUpiId}`, pdf.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 10;
    }
  }

  // Terms & Conditions
  if (yPos > 250) {
    pdf.addPage();
    yPos = 15;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Terms & Conditions', pageMargin, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const termsLines = pdf.splitTextToSize(data.termsAndConditions, contentWidth - 10);
  termsLines.forEach((term: string) => {
    pdf.text(term, pageMargin, yPos);
    yPos += 4;
  });
  yPos += 10;

  // Signature
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  const signatureLabel = data.docType === 'Purchase Order' ? 'Authorized Signature' : 'Provider Signature';
  pdf.text(signatureLabel, 210 - pageMargin - 20, yPos + 10, { align: 'center' });

  // Save the PDF with clean filename (remove special characters for filename)
  const cleanNumber = data.docDetails.number.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`${data.docType.toLowerCase().replace(' ', '_')}_${cleanNumber}.pdf`);
};