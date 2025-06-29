import React, { useState, useEffect } from 'react';
import { Hash, RefreshCw, Clock, Lightbulb } from 'lucide-react';
import { DocumentType } from '../types';
import { DocumentNumberingManager } from '../utils/documentNumbering';

interface SmartDocumentNumberProps {
  docType: DocumentType;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SmartDocumentNumber: React.FC<SmartDocumentNumberProps> = ({
  docType,
  value,
  onChange,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadRecentNumbers();
  }, [docType]);

  const loadRecentNumbers = async () => {
    try {
      const recent = await DocumentNumberingManager.getRecentNumbers(docType, 5);
      setRecentNumbers(recent);
    } catch (error) {
      console.error('Error loading recent numbers:', error);
    }
  };

  const generateNextNumber = async () => {
    setIsGenerating(true);
    try {
      const nextNumber = await DocumentNumberingManager.getNextDocumentNumber(docType);
      onChange(nextNumber);
    } catch (error) {
      console.error('Error generating next number:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // No formatting - just pass the value directly
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <label className="flex items-center text-gray-700 text-sm font-bold mb-2">
        <Hash className="w-4 h-4 mr-1" />
        {docType} Number
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
          title="Show suggestions"
        >
          <Lightbulb className="w-3 h-3" />
        </button>
      </label>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="Enter any format you want"
            className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent ${className}`}
          />
        </div>
        
        <button
          type="button"
          onClick={generateNextNumber}
          disabled={isGenerating}
          className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          title="Generate suggested number"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        Enter any format you want - no restrictions
      </div>
      
      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Options</h4>
          
          {/* Auto-generate button */}
          <button
            onClick={generateNextNumber}
            disabled={isGenerating}
            className="w-full mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-left flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-blue-600 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="text-blue-700 font-medium">Generate suggested number</span>
          </button>
          
          {/* Recent numbers */}
          {recentNumbers.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Recent {docType} Numbers
              </h5>
              <div className="space-y-1">
                {recentNumbers.map((num, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onChange(num);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Format examples */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">Example Formats</h5>
            <div className="space-y-1 text-xs text-gray-500">
              <div>#001/2024 - Standard format</div>
              <div>INV-2024-001 - Custom prefix</div>
              <div>QUO001 - Simple format</div>
              <div>2024/Q/001 - Year/type/number</div>
              <div>Any format you prefer!</div>
            </div>
          </div>
          
          <button
            onClick={() => setShowSuggestions(false)}
            className="mt-3 w-full p-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};