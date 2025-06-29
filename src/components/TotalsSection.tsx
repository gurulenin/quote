import React from 'react';
import { Calculator } from 'lucide-react';
import { Totals } from '../types';

interface TotalsSectionProps {
  totals: Totals;
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({ totals }) => {
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

  return (
    <div className="flex justify-end mb-8">
      <div className="w-full md:w-1/2 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center mb-4">
          <Calculator className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-bold text-gray-800">Summary</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Total Taxable Value:</span>
            <span className="text-gray-900 font-semibold">Rs {totals.subTotalTaxableValue.toFixed(2)}</span>
          </div>
          
          {!totals.isInterState && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">CGST:</span>
                <span className="text-gray-900 font-semibold">Rs {totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">SGST:</span>
                <span className="text-gray-900 font-semibold">Rs {totals.sgst.toFixed(2)}</span>
              </div>
            </>
          )}
          
          {totals.isInterState && (
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">IGST:</span>
              <span className="text-gray-900 font-semibold">Rs {totals.igst.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Total Tax Amount:</span>
            <span className="text-gray-900 font-semibold">Rs {totals.totalGSTAmountOverall.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-gray-300 my-4"></div>
          
          <div className="flex justify-between text-xl font-bold text-blue-700">
            <span>Grand Total:</span>
            <span>Rs {totals.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="text-gray-600 text-sm mt-2 italic">
            ({numberToWords(Math.floor(totals.grandTotal))})
          </div>
        </div>
      </div>
    </div>
  );
};