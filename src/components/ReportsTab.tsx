import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  PieChart, 
  Download,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  FileDown
} from 'lucide-react';
import { SavedDocument, DocumentType } from '../types';
import { generateReportsPDF } from '../utils/reportsPdfGenerator';

interface ReportsTabProps {
  documents: SavedDocument[];
  isLoading: boolean;
  onMessage: (message: string) => void;
}

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

export const ReportsTab: React.FC<ReportsTabProps> = ({
  documents,
  isLoading,
  onMessage
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'All'>('All');
  const [reportPeriod, setReportPeriod] = useState<'custom' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'>('thisYear');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Set date range based on selected period
  const handlePeriodChange = (period: typeof reportPeriod) => {
    setReportPeriod(period);
    const now = new Date();
    
    switch (period) {
      case 'thisMonth':
        setDateRange({
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateRange({
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: lastMonthEnd.toISOString().split('T')[0]
        });
        break;
      case 'thisYear':
        setDateRange({
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        });
        break;
      case 'lastYear':
        setDateRange({
          startDate: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        });
        break;
      default:
        // Keep current custom dates
        break;
    }
  };

  // Filter documents based on date range and document type
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const docDate = new Date(doc.docDetails.issueDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const isInDateRange = docDate >= startDate && docDate <= endDate;
      const isCorrectType = selectedDocType === 'All' || doc.docType === selectedDocType;
      
      return isInDateRange && isCorrectType;
    });
  }, [documents, dateRange, selectedDocType]);

  // Calculate report data
  const reportData: ReportData = useMemo(() => {
    let totalSales = 0;
    let totalTaxableValue = 0;
    let totalGSTAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const documentCounts = {
      Invoice: 0,
      Quotation: 0,
      'Purchase Order': 0
    };

    const monthlyDataMap = new Map<string, { sales: number; gst: number; count: number }>();
    const clientDataMap = new Map<string, { totalAmount: number; documentCount: number }>();

    filteredDocuments.forEach(doc => {
      const totals = doc.totals;
      const grandTotal = totals.grandTotal || 0;
      const taxableValue = totals.subTotalTaxableValue || 0;
      const gstAmount = totals.totalGSTAmountOverall || 0;

      // Accumulate totals
      totalSales += grandTotal;
      totalTaxableValue += taxableValue;
      totalGSTAmount += gstAmount;
      totalCGST += totals.cgst || 0;
      totalSGST += totals.sgst || 0;
      totalIGST += totals.igst || 0;

      // Count documents by type
      documentCounts[doc.docType]++;

      // Monthly data
      const docDate = new Date(doc.docDetails.issueDate);
      const monthKey = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyDataMap.get(monthKey) || { sales: 0, gst: 0, count: 0 };
      monthlyDataMap.set(monthKey, {
        sales: existing.sales + grandTotal,
        gst: existing.gst + gstAmount,
        count: existing.count + 1
      });

      // Client data
      const clientName = doc.client.name || 'Unknown Client';
      const existingClient = clientDataMap.get(clientName) || { totalAmount: 0, documentCount: 0 };
      clientDataMap.set(clientName, {
        totalAmount: existingClient.totalAmount + grandTotal,
        documentCount: existingClient.documentCount + 1
      });
    });

    // Convert monthly data to array and sort
    const monthlyData = Array.from(monthlyDataMap.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Convert client data to array and sort by total amount
    const topClients = Array.from(clientDataMap.entries())
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10); // Top 10 clients

    return {
      totalSales,
      totalTaxableValue,
      totalGSTAmount,
      totalCGST,
      totalSGST,
      totalIGST,
      documentCounts,
      monthlyData,
      topClients,
      gstBreakdown: {
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST
      }
    };
  }, [filteredDocuments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  const exportReport = () => {
    try {
      const reportContent = {
        period: `${dateRange.startDate} to ${dateRange.endDate}`,
        documentType: selectedDocType,
        summary: {
          totalDocuments: filteredDocuments.length,
          totalSales: reportData.totalSales,
          totalTaxableValue: reportData.totalTaxableValue,
          totalGSTAmount: reportData.totalGSTAmount,
          documentCounts: reportData.documentCounts
        },
        monthlyBreakdown: reportData.monthlyData,
        topClients: reportData.topClients,
        gstBreakdown: reportData.gstBreakdown,
        generatedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(reportContent, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onMessage('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      onMessage('Failed to export report');
    }
  };

  const exportReportAsPDF = async () => {
    if (filteredDocuments.length === 0) {
      onMessage('No data to export');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        documentType: selectedDocType,
        reportPeriod: reportPeriod
      };

      await generateReportsPDF(reportData, filters, filteredDocuments);
      onMessage('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      onMessage('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getPreviousPeriodComparison = () => {
    // Calculate the same period from previous year for comparison
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000));

    const prevPeriodDocs = documents.filter(doc => {
      const docDate = new Date(doc.docDetails.issueDate);
      const isInDateRange = docDate >= prevStartDate && docDate <= prevEndDate;
      const isCorrectType = selectedDocType === 'All' || doc.docType === selectedDocType;
      return isInDateRange && isCorrectType;
    });

    const prevTotalSales = prevPeriodDocs.reduce((sum, doc) => sum + (doc.totals.grandTotal || 0), 0);
    const salesChange = reportData.totalSales - prevTotalSales;
    const salesChangePercent = prevTotalSales > 0 ? (salesChange / prevTotalSales) * 100 : 0;

    return {
      prevTotalSales,
      salesChange,
      salesChangePercent
    };
  };

  const comparison = getPreviousPeriodComparison();

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <BarChart3 className="w-8 h-8 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive business insights and financial summaries</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{filteredDocuments.length}</div>
          <div className="text-sm text-gray-500">Documents in Period</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-indigo-800">Report Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={reportPeriod}
              onChange={(e) => handlePeriodChange(e.target.value as typeof reportPeriod)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                setReportPeriod('custom');
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                setReportPeriod('custom');
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocumentType | 'All')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Invoice">Invoices</option>
              <option value="Quotation">Quotations</option>
              <option value="Purchase Order">Purchase Orders</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-3">
          <button
            onClick={exportReportAsPDF}
            disabled={filteredDocuments.length === 0 || isGeneratingPDF}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
          
          <button
            onClick={exportReport}
            disabled={filteredDocuments.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.totalSales)}</p>
                  {comparison.salesChangePercent !== 0 && (
                    <div className="flex items-center mt-2">
                      {comparison.salesChangePercent > 0 ? (
                        <ArrowUp className="w-4 h-4 mr-1" />
                      ) : comparison.salesChangePercent < 0 ? (
                        <ArrowDown className="w-4 h-4 mr-1" />
                      ) : (
                        <Minus className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm">
                        {Math.abs(comparison.salesChangePercent).toFixed(1)}% vs prev period
                      </span>
                    </div>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Taxable Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.totalTaxableValue)}</p>
                  <p className="text-blue-200 text-sm mt-2">
                    {((reportData.totalTaxableValue / reportData.totalSales) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total GST</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.totalGSTAmount)}</p>
                  <p className="text-purple-200 text-sm mt-2">
                    {((reportData.totalGSTAmount / reportData.totalSales) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Documents</p>
                  <p className="text-2xl font-bold">{filteredDocuments.length}</p>
                  <p className="text-orange-200 text-sm mt-2">
                    Avg: {filteredDocuments.length > 0 ? formatCurrency(reportData.totalSales / filteredDocuments.length) : '₹0'}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Document Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Document Type Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(reportData.documentCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${filteredDocuments.length > 0 ? (count / filteredDocuments.length) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                GST Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">CGST</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(reportData.gstBreakdown.cgst)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">SGST</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(reportData.gstBreakdown.sgst)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">IGST</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(reportData.gstBreakdown.igst)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-800">Total GST</span>
                    <span className="text-gray-900">{formatCurrency(reportData.totalGSTAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          {reportData.monthlyData.length > 0 && (
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Monthly Trend
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Month</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Sales</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">GST</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Documents</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Avg per Doc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyData.map((month, index) => (
                      <tr key={month.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 text-gray-800">{formatMonth(month.month)}</td>
                        <td className="py-2 px-4 text-right text-gray-900 font-semibold">
                          {formatCurrency(month.sales)}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-700">
                          {formatCurrency(month.gst)}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-700">{month.count}</td>
                        <td className="py-2 px-4 text-right text-gray-700">
                          {formatCurrency(month.count > 0 ? month.sales / month.count : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Clients */}
          {reportData.topClients.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Top Clients
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Client Name</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Total Amount</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Documents</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Avg per Doc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topClients.map((client, index) => (
                      <tr key={client.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 text-gray-800 font-medium">{client.name}</td>
                        <td className="py-2 px-4 text-right text-gray-900 font-semibold">
                          {formatCurrency(client.totalAmount)}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-700">{client.documentCount}</td>
                        <td className="py-2 px-4 text-right text-gray-700">
                          {formatCurrency(client.totalAmount / client.documentCount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No data found</h3>
              <p className="text-gray-400 mb-6">
                No documents found for the selected period and filters.
              </p>
              <p className="text-gray-400 text-sm">
                Try adjusting your date range or document type filter.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};