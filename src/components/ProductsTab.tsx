import React, { useState } from 'react';
import { Package, Download, Upload, Plus, Search, Edit3, Trash2, Globe, RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet, Cloud, Tag, DollarSign, FolderSync as Sync } from 'lucide-react';
import { useProductData, ProductData } from '../hooks/useProductData';

interface ProductsTabProps {
  onMessage: (message: string) => void;
  productDataHook: ReturnType<typeof useProductData>;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ onMessage, productDataHook }) => {
  const { 
    products, 
    refreshData, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    syncWithCloud,
    isLoading: productsLoading 
  } = productDataHook;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    localStorage.getItem('product_sheet_url') || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState(
    localStorage.getItem('last_product_sync') || null
  );
  const [cloudInfo, setCloudInfo] = useState<{
    lastUpdated: string | null;
    source: string;
    count: number;
  }>({ lastUpdated: null, source: 'none', count: 0 });

  const [newProduct, setNewProduct] = useState<ProductData>({
    Description: '',
    HSN: '',
    Price: '',
    Category: ''
  });

  // Load cloud info on component mount
  React.useEffect(() => {
    loadCloudInfo();
  }, []);

  const loadCloudInfo = async () => {
    try {
      const { firebaseManager } = await import('../utils/firebaseManager');
      const info = await firebaseManager.getProductDataInfo();
      setCloudInfo(info);
    } catch (error) {
      console.error('Error loading cloud info:', error);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.HSN?.includes(searchTerm) ||
    product.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.Price?.includes(searchTerm)
  );

  // Get unique categories
  const categories = [...new Set(products.map(p => p.Category).filter(Boolean))];

  const convertGoogleSheetsUrl = (url: string): string => {
    if (!url) return '';
    
    // If it's already a CSV export URL, return as is
    if (url.includes('/export?format=csv') || url.includes('output=csv')) {
      return url;
    }
    
    // Extract spreadsheet ID from various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /key=([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/ // Just the ID itself
    ];
    
    let spreadsheetId = '';
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        spreadsheetId = match[1];
        break;
      }
    }
    
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL. Please ensure the URL contains a valid spreadsheet ID.');
    }
    
    // Extract sheet ID (gid) if present
    let sheetId = '0'; // Default to first sheet
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    if (gidMatch) {
      sheetId = gidMatch[1];
    }
    
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetId}`;
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    // Parse headers and clean them
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Parse CSV values more carefully to handle quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add the last value
      values.push(current.trim().replace(/^"|"$/g, ''));
      
      // Create row object, filling missing values with empty strings
      const row: any = {};
      let hasData = false;
      
      headers.forEach((header, index) => {
        const value = (values[index] || '').trim();
        row[header] = value;
        if (value) hasData = true; // Check if row has any non-empty data
      });
      
      // Only include rows that have at least one non-empty value
      if (hasData) {
        data.push(row);
      }
    }
    
    return data;
  };

  const loadFromGoogleSheets = async () => {
    if (!googleSheetUrl.trim()) {
      onMessage('Please enter a valid Google Sheets URL');
      return;
    }

    setIsLoading(true);
    setLoadStatus('idle');

    try {
      const csvUrl = convertGoogleSheetsUrl(googleSheetUrl);
      
      const response = await fetch(csvUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sheet not found. Please ensure the Google Sheet is published to web as CSV and the URL is correct.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please ensure the Google Sheet is publicly accessible.');
        } else {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
      }
      
      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('The sheet appears to be empty or contains no data.');
      }
      
      const productData = parseCsvData(csvText);
      
      if (productData.length === 0) {
        throw new Error('No valid data rows found in the sheet. Please ensure your sheet contains data rows with at least one non-empty cell per row.');
      }
      
      // Save to Firebase with Google Sheets source
      const { firebaseManager } = await import('../utils/firebaseManager');
      await firebaseManager.saveProductData(productData, 'google_sheets', googleSheetUrl);
      
      // Also save to localStorage as backup
      localStorage.setItem('imported_product_data', JSON.stringify(productData));
      localStorage.setItem('product_sheet_url', googleSheetUrl);
      
      const timestamp = new Date().toISOString();
      localStorage.setItem('last_product_sync', timestamp);
      setLastSync(timestamp);
      
      setLoadStatus('success');
      onMessage(`Successfully loaded ${productData.length} product records from Google Sheets and saved to cloud`);
      
      // Refresh the data and cloud info
      await refreshData();
      await loadCloudInfo();
    } catch (error) {
      console.error('Error loading product data:', error);
      setLoadStatus('error');
      onMessage(`Failed to load product data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAsCSV = () => {
    try {
      if (products.length === 0) {
        onMessage('No product data to export');
        return;
      }

      // Create CSV headers
      const headers = ['Description', 'HSN', 'Price', 'Category'];
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...products.map(product => [
          `"${(product.Description || '').replace(/"/g, '""')}"`,
          `"${(product.HSN || '').replace(/"/g, '""')}"`,
          `"${(product.Price || '').replace(/"/g, '""')}"`,
          `"${(product.Category || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onMessage(`Exported ${products.length} product records to CSV`);
    } catch (error) {
      console.error('Error exporting product data:', error);
      onMessage('Failed to export product data');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.Description.trim()) {
      onMessage('Please enter a product description');
      return;
    }

    try {
      const success = await addProduct(newProduct);
      if (success) {
        // Reset form
        setNewProduct({
          Description: '',
          HSN: '',
          Price: '',
          Category: ''
        });
        setShowAddForm(false);
        onMessage('New product added successfully and saved to cloud');
        await loadCloudInfo();
      } else {
        onMessage('Failed to add new product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      onMessage('Failed to add new product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editingProduct.Description.trim()) {
      onMessage('Please enter a product description');
      return;
    }

    try {
      const productIndex = products.findIndex(p => 
        p.Description === editingProduct.Description && 
        p.HSN === editingProduct.HSN && 
        p.Price === editingProduct.Price
      );
      
      if (productIndex === -1) {
        onMessage('Product not found');
        return;
      }

      const success = await updateProduct(productIndex, editingProduct);
      if (success) {
        setEditingProduct(null);
        onMessage('Product updated successfully and saved to cloud');
        await loadCloudInfo();
      } else {
        onMessage('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      onMessage('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productToDelete: ProductData) => {
    if (!confirm(`Are you sure you want to delete ${productToDelete.Description}?`)) {
      return;
    }

    try {
      const success = await deleteProduct(productToDelete);
      if (success) {
        onMessage('Product deleted successfully and updated in cloud');
        await loadCloudInfo();
      } else {
        onMessage('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      onMessage('Failed to delete product');
    }
  };

  const handleSyncWithCloud = async () => {
    try {
      setIsLoading(true);
      const success = await syncWithCloud();
      if (success) {
        onMessage('Product data synced successfully with cloud');
        await loadCloudInfo();
      } else {
        onMessage('Failed to sync product data');
      }
    } catch (error) {
      console.error('Error syncing product data:', error);
      onMessage('Failed to sync product data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Cloud className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Package className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
            <p className="text-gray-600">Manage your product catalog with Google Sheets integration and cloud sync</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{products.length}</div>
          <div className="text-sm text-gray-500">Total Products</div>
        </div>
      </div>

      {/* Cloud Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-purple-800">Cloud Storage Status</h3>
              <p className="text-xs text-purple-600">
                {cloudInfo.count > 0 
                  ? `${cloudInfo.count} products in cloud • Last updated: ${formatDate(cloudInfo.lastUpdated)}`
                  : 'No cloud data found'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncWithCloud}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Sync className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Google Sheets Integration */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center mb-4">
          <Globe className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-purple-800">Google Sheets Integration</h2>
          {getStatusIcon(loadStatus)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheets URL
            </label>
            <input
              type="url"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected columns: Description, HSN, Price, Category
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={loadFromGoogleSheets}
              disabled={isLoading || !googleSheetUrl.trim()}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import & Save to Cloud
                </>
              )}
            </button>
          </div>
        </div>

        {lastSync && (
          <p className="text-xs text-gray-600">
            Last sync: {formatDate(lastSync)}
          </p>
        )}

        {/* Setup Instructions */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Create a Google Sheet with columns: Description, HSN, Price, Category</li>
            <li>Go to File → Share → Publish to web</li>
            <li>Choose "Entire Document" and "Comma-separated values (.csv)"</li>
            <li>Click "Publish" and copy the generated URL</li>
            <li>Paste the URL above and click "Import & Save to Cloud"</li>
          </ol>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </button>
        
        {products.length > 0 && (
          <button
            onClick={exportAsCSV}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </button>
        )}
      </div>

      {/* Search */}
      {products.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by description, HSN, price, or category..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Categories Summary */}
      {categories.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories ({categories.length})</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                <Tag className="w-3 h-3 mr-1" />
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Product Form */}
      {(showAddForm || editingProduct) && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={editingProduct ? editingProduct.Description : newProduct.Description}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, Description: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, Description: e.target.value });
                }
              }}
              placeholder="Product Description *"
              className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editingProduct ? editingProduct.HSN : newProduct.HSN}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, HSN: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, HSN: e.target.value });
                }
              }}
              placeholder="HSN/SAC Code"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editingProduct ? editingProduct.Price : newProduct.Price}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, Price: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, Price: e.target.value });
                }
              }}
              placeholder="Price"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editingProduct ? editingProduct.Category : newProduct.Category}
              onChange={(e) => {
                if (editingProduct) {
                  setEditingProduct({ ...editingProduct, Category: e.target.value });
                } else {
                  setNewProduct({ ...newProduct, Category: e.target.value });
                }
              }}
              placeholder="Category"
              className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              disabled={editingProduct ? !editingProduct.Description.trim() : !newProduct.Description.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingProduct(null);
                setNewProduct({
                  Description: '',
                  HSN: '',
                  Price: '',
                  Category: ''
                });
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No products found</h3>
          <p className="text-gray-400 mb-6">Import from Google Sheets or add products manually to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <div className="flex items-center text-purple-600">
              <Cloud className="w-4 h-4 mr-1" />
              <span>Synced to cloud</span>
            </div>
          </div>
          
          {filteredProducts.map((product, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{product.Description}</h3>
                    {product.Category && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        <Tag className="w-3 h-3 inline mr-1" />
                        {product.Category}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">HSN/SAC:</span> {product.HSN || 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="font-medium">Price:</span> ₹{product.Price || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingProduct({ ...product })}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};