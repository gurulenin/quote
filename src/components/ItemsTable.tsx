import React, { useState } from 'react';
import { Plus, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { LineItem, Product, Totals } from '../types';

interface ItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  products: Product[];
  productsLoading: boolean;
  totals: Totals;
  isSimpleMode: boolean;
  onSimpleModeChange: (isSimple: boolean) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onChange,
  products,
  productsLoading,
  totals,
  isSimpleMode,
  onSimpleModeChange
}) => {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    
    if (field === 'description' && typeof value === 'string') {
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (value.length > 1 && products.length > 0) {
        const filteredSuggestions = products.filter(p => 
          p.Description && p.Description.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setActiveSuggestionIndex(-1);
      } else {
        setSuggestions([]);
      }
    } else if (field === 'cgstPercent') {
      const newCGSTPercent = parseFloat(value as string);
      newItems[index] = { 
        ...newItems[index], 
        gstRate: !isNaN(newCGSTPercent) ? newCGSTPercent * 2 : 0 
      };
    } else {
      newItems[index] = { 
        ...newItems[index], 
        [field]: typeof value === 'string' ? (parseFloat(value) || value) : value 
      };
    }
    
    onChange(newItems);
  };

  const handleSuggestionClick = (index: number, product: Product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: product.Description || '',
      hsnSac: product.HSN || '',
      unitPrice: parseFloat(product.Price) || 0
    };
    onChange(newItems);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setFocusedItemIndex(null);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (focusedItemIndex !== index) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeSuggestionIndex !== -1 && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(index, suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      setFocusedItemIndex(null);
    }
  };

  const addItem = () => {
    const newItem: LineItem = {
      sNo: items.length + 1,
      description: '',
      hsnSac: isSimpleMode ? '' : '',
      quantity: isSimpleMode ? 1 : 1,
      uom: isSimpleMode ? '' : 'NOS',
      unitPrice: isSimpleMode ? 0 : 0,
      gstRate: 18,
      taxableValue: isSimpleMode ? 0 : undefined
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sNo: i + 1 }));
    onChange(newItems);
  };

  const handleModeToggle = () => {
    const newMode = !isSimpleMode;
    onSimpleModeChange(newMode);
    
    // Convert existing items to new mode
    const convertedItems = items.map(item => {
      if (newMode) {
        // Converting to simple mode
        const taxableValuePerUnit = item.unitPrice / (1 + item.gstRate / 100);
        return {
          ...item,
          taxableValue: item.quantity * taxableValuePerUnit,
          hsnSac: '',
          quantity: 1,
          uom: '',
          unitPrice: 0
        };
      } else {
        // Converting to detailed mode
        return {
          ...item,
          quantity: 1,
          uom: 'NOS',
          unitPrice: (item.taxableValue || 0) * (1 + item.gstRate / 100),
          taxableValue: undefined
        };
      }
    });
    
    onChange(convertedItems);
  };

  return (
    <div className="mb-8">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Items Entry Mode</h3>
          <p className="text-sm text-gray-600">
            {isSimpleMode 
              ? 'Simple mode: Enter description, taxable value, and GST only'
              : 'Detailed mode: Full item details with HSN, quantity, and unit price'
            }
          </p>
        </div>
        <button
          onClick={handleModeToggle}
          className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            {isSimpleMode ? 'Simple' : 'Detailed'}
          </span>
          {isSimpleMode ? (
            <ToggleLeft className="w-6 h-6 text-blue-500" />
          ) : (
            <ToggleRight className="w-6 h-6 text-blue-500" />
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-12">S.No</th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Description</th>
              {!isSimpleMode && (
                <>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">HSN/SAC</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-20">Qty</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-16">UoM</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">Unit Price</th>
                </>
              )}
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-28">Taxable Value</th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-20">GST (%)</th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">GST Amount</th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">Total Amount</th>
              <th className="py-3 px-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              let itemTaxableValue, itemGSTAmount, itemTotalAmount;
              
              if (isSimpleMode) {
                itemTaxableValue = item.taxableValue || 0;
                itemGSTAmount = (itemTaxableValue * item.gstRate) / 100;
                itemTotalAmount = itemTaxableValue + itemGSTAmount;
              } else {
                const taxableValuePerUnit = item.unitPrice / (1 + item.gstRate / 100);
                const gstPerUnit = item.unitPrice - taxableValuePerUnit;
                itemTaxableValue = item.quantity * taxableValuePerUnit;
                itemGSTAmount = item.quantity * gstPerUnit;
                itemTotalAmount = item.quantity * item.unitPrice;
              }

              return (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-2 text-center text-sm">{item.sNo}</td>
                  <td className="py-3 px-2 relative">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      onFocus={() => setFocusedItemIndex(index)}
                      onBlur={() => setTimeout(() => setFocusedItemIndex(null), 100)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      placeholder="Enter description"
                      className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                    />
                    {focusedItemIndex === index && suggestions.length > 0 && !isSimpleMode && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-48 overflow-y-auto rounded-md shadow-lg mt-1">
                        {suggestions.map((suggestion, sIndex) => (
                          <li
                            key={sIndex}
                            className={`p-2 cursor-pointer hover:bg-blue-100 text-sm ${
                              sIndex === activeSuggestionIndex ? 'bg-blue-200' : ''
                            }`}
                            onMouseDown={() => handleSuggestionClick(index, suggestion)}
                          >
                            <div className="font-medium">{suggestion.Description}</div>
                            <div className="text-xs text-gray-500">
                              HSN: {suggestion.HSN} - Price: ₹{suggestion.Price}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  
                  {!isSimpleMode && (
                    <>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                          placeholder="HSN/SAC"
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                          placeholder="UoM"
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Unit Price"
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                        />
                      </td>
                    </>
                  )}
                  
                  <td className="py-3 px-2">
                    {isSimpleMode ? (
                      <input
                        type="number"
                        value={item.taxableValue || 0}
                        onChange={(e) => handleItemChange(index, 'taxableValue', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="Taxable Value"
                        className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-sm"
                      />
                    ) : (
                      <span className="font-medium text-gray-800 text-sm">
                        ₹{itemTaxableValue.toFixed(2)}
                      </span>
                    )}
                  </td>
                  
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      value={item.gstRate}
                      onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 text-center text-sm"
                    />
                  </td>
                  
                  <td className="py-3 px-2 font-medium text-gray-800 text-sm">
                    ₹{itemGSTAmount.toFixed(2)}
                  </td>
                  
                  <td className="py-3 px-2 font-medium text-gray-800 text-sm">
                    ₹{itemTotalAmount.toFixed(2)}
                  </td>
                  
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <button
        onClick={addItem}
        className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-md flex items-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Item
      </button>
      
      {productsLoading && !isSimpleMode && (
        <div className="mt-4 flex items-center text-blue-600">
          <Search className="w-4 h-4 mr-2 animate-spin" />
          Loading product database...
        </div>
      )}
    </div>
  );
};