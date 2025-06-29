import React from 'react';
import { Quote as QuoteIcon, Trash2, Calendar } from 'lucide-react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDelete, showActions = true }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
            <QuoteIcon className="w-5 h-5 text-white" />
          </div>
          <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {quote.category}
          </span>
        </div>
        {showActions && onDelete && (
          <button
            onClick={() => onDelete(quote.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
            title="Delete quote"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <blockquote className="text-gray-800 text-lg leading-relaxed mb-4 font-medium">
        "{quote.text}"
      </blockquote>

      <div className="flex items-center justify-between">
        <cite className="text-indigo-600 font-semibold not-italic">
          — {quote.author}
        </cite>
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(quote.createdAt)}
        </div>
      </div>
    </div>
  );
};