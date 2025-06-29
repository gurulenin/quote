import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SavedDocument, DocumentType } from '../types';

interface ReportData {
  totalSales: number;
  totalTaxableValue: number;
  totalGSTAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  documentCounts: {
    Invoice: number;
    Quotation: number;
    'Purchase Order': number;
  };
  monthlyData: Array<{
    month: string;
    sales: number;
    gst: number;
    count: number;
  }>;
  topClients: Array<{
    name: string;
    totalAmount: number;
    documentCount: number;
  }>;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
  };
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  documentType: DocumentType | 'All';
  reportPeriod: string;
}

export const generateReportsPDF = async (
  reportData: ReportData,
  filters: ReportFilters,
  filteredDocuments: SavedDocument[]
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yPos = 15;
  const pageMargin = 15;
  const contentWidth = 210 - (2 * pageMargin);

  // Use Rs instead of ₹ symbol for better PDF compatibility
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > 280) {
      pdf.addPage();
      yPos = 15;
    }
  };

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(67, 56, 202); // Indigo color
  pdf.text('Sales Report & Analytics', pageMargin, yPos);
  yPos += 10;

  // Report period and filters
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Report Period: ${filters.startDate} to ${filters.endDate}`, pageMargin, yPos);
  yPos += 6;
  pdf.text(`Document Type: ${filters.documentType}`, pageMargin, yPos);
  yPos += 6;
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageMargin, yPos);
  yPos += 10;

  // Horizontal line
  pdf.setDrawColor(67, 56, 202);
  pdf.line(pageMargin, yPos, 210 - pageMargin, yPos);
  yPos += 10;

  // Executive Summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(67, 56, 202);
  pdf.text('Executive Summary', pageMargin, yPos);
  yPos += 8;

  // Key metrics in a box
  pdf.setDrawColor(200, 200, 200);
  pdf.setFillColor(248, 250, 252);
  pdf.rect(pageMargin, yPos, contentWidth, 35, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);

  // First row of metrics
  pdf.text('Total Sales:', pageMargin + 5, yPos + 8);
  pdf.text(formatCurrency(reportData.totalSales), pageMargin + 50, yPos + 8);

  pdf.text('Total Documents:', pageMargin + 105, yPos + 8);
  pdf.text(filteredDocuments.length.toString(), pageMargin + 160, yPos + 8);

  // Second row of metrics
  pdf.text('Taxable Value:', pageMargin + 5, yPos + 18);
  pdf.text(formatCurrency(reportData.totalTaxableValue), pageMargin + 50, yPos + 18);

  pdf.text('Total GST:', pageMargin + 105, yPos + 18);
  pdf.text(formatCurrency(reportData.totalGSTAmount), pageMargin + 160, yPos + 18);

  // Third row - average per document
  const avgPerDoc = filteredDocuments.length > 0 ? reportData.totalSales / filteredDocuments.length : 0;
  pdf.text('Avg per Document:', pageMargin + 5, yPos + 28);
  pdf.text(formatCurrency(avgPerDoc), pageMargin + 50, yPos + 28);

  yPos += 45;

  // Document Type Breakdown
  addNewPageIfNeeded(40);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(67, 56, 202);
  pdf.text('Document Type Breakdown', pageMargin, yPos);
  yPos += 10;

  const docTypeData = Object.entries(reportData.documentCounts).map(([type, count]) => [
    type,
    count.toString(),
    `${filteredDocuments.length > 0 ? ((count / filteredDocuments.length) * 100).toFixed(1) : 0}%`
  ]);

  (pdf as any).autoTable({
    startY: yPos,
    head: [['Document Type', 'Count', 'Percentage']],
    body: docTypeData,
    theme: 'grid',
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    margin: { left: pageMargin, right: pageMargin }
  });

  yPos = (pdf as any).autoTable.previous.finalY + 15;

  // GST Breakdown
  addNewPageIfNeeded(40);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(67, 56, 202);
  pdf.text('GST Breakdown', pageMargin, yPos);
  yPos += 10;

  const gstData = [
    ['CGST', formatCurrency(reportData.gstBreakdown.cgst)],
    ['SGST', formatCurrency(reportData.gstBreakdown.sgst)],
    ['IGST', formatCurrency(reportData.gstBreakdown.igst)],
    ['Total GST', formatCurrency(reportData.totalGSTAmount)]
  ];

  (pdf as any).autoTable({
    startY: yPos,
    head: [['GST Type', 'Amount']],
    body: gstData,
    theme: 'grid',
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      1: { halign: 'right' }
    },
    margin: { left: pageMargin, right: pageMargin }
  });

  yPos = (pdf as any).autoTable.previous.finalY + 15;

  // Monthly Trend (if data available)
  if (reportData.monthlyData.length > 0) {
    addNewPageIfNeeded(60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(67, 56, 202);
    pdf.text('Monthly Trend Analysis', pageMargin, yPos);
    yPos += 10;

    const monthlyTableData = reportData.monthlyData.map(month => [
      formatMonth(month.month),
      formatCurrency(month.sales),
      formatCurrency(month.gst),
      month.count.toString(),
      formatCurrency(month.count > 0 ? month.sales / month.count : 0)
    ]);

    (pdf as any).autoTable({
      startY: yPos,
      head: [['Month', 'Sales', 'GST', 'Documents', 'Avg per Doc']],
      body: monthlyTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      },
      margin: { left: pageMargin, right: pageMargin }
    });

    yPos = (pdf as any).autoTable.previous.finalY + 15;
  }

  // Top Clients (if data available)
  if (reportData.topClients.length > 0) {
    addNewPageIfNeeded(60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(67, 56, 202);
    pdf.text('Top Clients Analysis', pageMargin, yPos);
    yPos += 10;

    const clientsTableData = reportData.topClients.slice(0, 15).map((client, index) => [
      (index + 1).toString(),
      client.name,
      formatCurrency(client.totalAmount),
      client.documentCount.toString(),
      formatCurrency(client.totalAmount / client.documentCount)
    ]);

    (pdf as any).autoTable({
      startY: yPos,
      head: [['Rank', 'Client Name', 'Total Amount', 'Documents', 'Avg per Doc']],
      body: clientsTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: pageMargin, right: pageMargin }
    });

    yPos = (pdf as any).autoTable.previous.finalY + 15;
  }

  // Detailed Document List (if not too many)
  if (filteredDocuments.length > 0 && filteredDocuments.length <= 50) {
    // Add new page for detailed list
    pdf.addPage();
    yPos = 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(67, 56, 202);
    pdf.text('Detailed Document List', pageMargin, yPos);
    yPos += 10;

    const detailedData = filteredDocuments.map(doc => [
      doc.docDetails.number || 'N/A',
      doc.docType,
      doc.client.name || 'Unknown',
      doc.docDetails.issueDate || 'N/A',
      formatCurrency(doc.totals.grandTotal || 0)
    ]);

    (pdf as any).autoTable({
      startY: yPos,
      head: [['Doc Number', 'Type', 'Client', 'Date', 'Amount']],
      body: detailedData,
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: pageMargin, right: pageMargin }
    });
  } else if (filteredDocuments.length > 50) {
    // Add summary note for large datasets
    addNewPageIfNeeded(20);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Note: Detailed document list omitted due to large dataset (${filteredDocuments.length} documents).`,
      pageMargin,
      yPos
    );
    pdf.text('Use filters to narrow down the results for detailed analysis.', pageMargin, yPos + 5);
  }

  // Footer on last page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    
    // Page number
    pdf.text(
      `Page ${i} of ${pageCount}`,
      210 - pageMargin,
      285,
      { align: 'right' }
    );
    
    // Generated timestamp
    pdf.text(
      `Generated on ${new Date().toLocaleString('en-IN')}`,
      pageMargin,
      285
    );
  }

  // Save the PDF
  const fileName = `sales_report_${filters.startDate}_to_${filters.endDate}.pdf`;
  pdf.save(fileName);
};