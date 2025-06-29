import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';

interface RandomQuoteModalProps {
  quote: Quote | null;
  onClose: () => void;
  onNewRandom: () => void;
}

export const RandomQuoteModal: React.FC<RandomQuoteModalProps> = ({
  quote,
  onClose,
  onNewRandom,
}) => {
  if (!quote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Random Quote</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewRandom}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              New Quote
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <QuoteCard quote={quote} showActions={false} />
      </div>
    </div>
  );
};