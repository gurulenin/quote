import React, { useState } from 'react';
import { Users, Search, Mail } from 'lucide-react';
import { ClientInfo, DocumentType } from '../types';
import { useClientData, ClientData } from '../hooks/useClientData';
import { User } from 'firebase/auth';

interface ClientDetailsWithSuggestionsProps {
  client: ClientInfo;
  onChange: (client: ClientInfo) => void;
  docType: DocumentType;
  clientDataHook: ReturnType<typeof useClientData>;
}

export const ClientDetailsWithSuggestions: React.FC<ClientDetailsWithSuggestionsProps> = ({
  client,
  onChange,
  docType,
  clientDataHook
}) => {
  const { clients, searchClients } = clientDataHook;
  const [suggestions, setSuggestions] = useState<ClientData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({
      ...client,
      name: value
    });

    if (value.length > 1 && clients.length > 0) {
      const filteredSuggestions = searchClients(value);
      setSuggestions(filteredSuggestions.slice(0, 5));
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: ClientData) => {
    onChange({
      name: suggestion.Name || '',
      address: suggestion.Address || '',
      phone: suggestion.Phone || '',
      gstin: suggestion.GSTIN || '',
      email: suggestion.Email || ''
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeSuggestionIndex !== -1) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'name') {
      handleNameChange(e as React.ChangeEvent<HTMLInputElement>);
    } else {
      onChange({
        ...client,
        [e.target.name]: e.target.value
      });
    }
  };

  const getLabel = () => {
    switch (docType) {
      case 'Purchase Order':
        return 'Vendor Details';
      default:
        return 'To';
    }
  };

  return (
    <div className="p-6 bg-green-50 rounded-lg border border-green-200 shadow-sm">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 text-green-600 mr-2" />
        <h2 className="text-xl font-bold text-green-800">{getLabel()}</h2>
        {clients.length > 0 && (
          <div className="ml-auto flex items-center text-sm text-green-600">
            <Search className="w-4 h-4 mr-1" />
            <span>{clients.length} clients loaded</span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            name="name"
            value={client.name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (client.name.length > 1 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking
              setTimeout(() => setShowSuggestions(false), 100);
            }}
            placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} Name`}
            className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-48 overflow-y-auto rounded-md shadow-lg mt-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className={`p-3 cursor-pointer hover:bg-green-100 border-b border-gray-100 last:border-b-0 ${
                    index === activeSuggestionIndex ? 'bg-green-200' : ''
                  }`}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  <div className="font-medium text-gray-800">{suggestion.Name}</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-3">{suggestion.Phone}</span>
                    {suggestion.Email && (
                      <span className="flex items-center text-blue-600">
                        <Mail className="w-3 h-3 mr-1" />
                        {suggestion.Email}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{suggestion.GSTIN}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <textarea
          name="address"
          value={client.address}
          onChange={handleChange}
          placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} Address`}
          rows={3}
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="phone"
            value={client.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
            <input
              type="email"
              name="email"
              value={client.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full pl-10 p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        </div>
        
        <input
          type="text"
          name="gstin"
          value={client.gstin}
          onChange={handleChange}
          placeholder={`${docType === 'Purchase Order' ? 'Vendor' : 'Client'} GSTIN`}
          className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>
    </div>
  );
};