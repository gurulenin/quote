import React, { useState } from 'react';
import { Users, Download, Upload, Plus, Search, Edit3, Trash2, Globe, RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet, HardDrive, Tag, FolderSync as Sync, Info } from 'lucide-react';
import { useClientData, ClientData } from '../hooks/useClientData';

interface ClientsTabProps {
  onMessage: (message: string) => void;
  clientDataHook: ReturnType<typeof useClientData>;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ onMessage, clientDataHook }) => {
  const { 
    clients, 
    refreshData, 
    addClient, 
    updateClient, 
    deleteClient, 
    syncWithCloud,
    isLoading: clientsLoading 
  } = clientDataHook;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    localStorage.getItem('client_sheet_url') || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState(
    localStorage.getItem('last_client_sync') || null
  );

  const [newClient, setNewClient] = useState<ClientData>({
    Name: '',
    Address: '',
    Phone: '',
    GSTIN: '',
    Email: ''
  });

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.Phone?.includes(searchTerm) ||
    client.GSTIN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.Address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      const clientData = parseCsvData(csvText);
      
      if (clientData.length === 0) {
        throw new Error('No valid data rows found in the sheet. Please ensure your sheet contains data rows with at least one non-empty cell per row.');
      }
      
      // Save to IndexedDB
      const success = await clientDataHook.saveClientData(clientData);
      if (!success) {
        throw new Error('Failed to save client data to local storage');
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('imported_client_data', JSON.stringify(clientData));
      localStorage.setItem('client_sheet_url', googleSheetUrl);
      
      const timestamp = new Date().toISOString();
      localStorage.setItem('last_client_sync', timestamp);
      setLastSync(timestamp);
      
      setLoadStatus('success');
      onMessage(`Successfully loaded ${clientData.length} client records from Google Sheets and saved locally`);
      
      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error('Error loading client data:', error);
      setLoadStatus('error');
      onMessage(`Failed to load client data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAsCSV = () => {
    try {
      if (clients.length === 0) {
        onMessage('No client data to export');
        return;
      }

      // Create CSV headers
      const headers = ['Name', 'Address', 'Phone', 'GSTIN', 'Email'];
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...clients.map(client => [
          `"${(client.Name || '').replace(/"/g, '""')}"`,
          `"${(client.Address || '').replace(/"/g, '""')}"`,
          `"${(client.Phone || '').replace(/"/g, '""')}"`,
          `"${(client.GSTIN || '').replace(/"/g, '""')}"`,
          `"${(client.Email || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onMessage(`Exported ${clients.length} client records to CSV`);
    } catch (error) {
      console.error('Error exporting client data:', error);
      onMessage('Failed to export client data');
    }
  };

  const handleAddClient = async () => {
    if (!newClient.Name.trim()) {
      onMessage('Please enter a client name');
      return;
    }

    try {
      const success = await addClient(newClient);
      if (success) {
        // Reset form
        setNewClient({
          Name: '',
          Address: '',
          Phone: '',
          GSTIN: '',
          Email: ''
        });
        setShowAddForm(false);
        onMessage('New client added successfully and saved locally');
      } else {
        onMessage('Failed to add new client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      onMessage('Failed to add new client');
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !editingClient.Name.trim()) {
      onMessage('Please enter a client name');
      return;
    }

    try {
      const clientIndex = clients.findIndex(c => 
        c.Name === editingClient.Name && 
        c.Phone === editingClient.Phone && 
        c.GSTIN === editingClient.GSTIN
      );
      
      if (clientIndex === -1) {
        onMessage('Client not found');
        return;
      }

      const success = await updateClient(clientIndex, editingClient);
      if (success) {
        setEditingClient(null);
        onMessage('Client updated successfully and saved locally');
      } else {
        onMessage('Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      onMessage('Failed to update client');
    }
  };

  const handleDeleteClient = async (clientToDelete: ClientData) => {
    if (!confirm(`Are you sure you want to delete ${clientToDelete.Name}?`)) {
      return;
    }

    try {
      const success = await deleteClient(clientToDelete);
      if (success) {
        onMessage('Client deleted successfully and updated locally');
      } else {
        onMessage('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      onMessage('Failed to delete client');
    }
  };

  const handleSyncWithLocal = async () => {
    try {
      setIsLoading(true);
      const success = await syncWithCloud();
      if (success) {
        onMessage('Client data refreshed successfully');
      } else {
        onMessage('Failed to refresh client data');
      }
    } catch (error) {
      console.error('Error refreshing client data:', error);
      onMessage('Failed to refresh client data');
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
        return <HardDrive className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Client Management</h1>
            <p className="text-gray-600">Manage your client database with Google Sheets integration and local storage</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-sm text-gray-500">Total Clients</div>
        </div>
      </div>

      {/* Local Storage Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HardDrive className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Local Storage Status</h3>
              <p className="text-xs text-green-600">
                {clients.length > 0 
                  ? `${clients.length} clients stored locally in IndexedDB`
                  : 'No local data found'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncWithLocal}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Sync className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Google Sheets Integration */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-4">
          <Globe className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-blue-800">Google Sheets Integration</h2>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected columns: Name, Address, Phone, GSTIN, Email
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={loadFromGoogleSheets}
              disabled={isLoading || !googleSheetUrl.trim()}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import & Save Locally
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
            <li>Create a Google Sheet with columns: Name, Address, Phone, GSTIN, Email</li>
            <li>Go to File → Share → Publish to web</li>
            <li>Choose "Entire Document" and "Comma-separated values (.csv)"</li>
            <li>Click "Publish" and copy the generated URL</li>
            <li>Paste the URL above and click "Import & Save Locally"</li>
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
          Add New Client
        </button>
        
        {clients.length > 0 && (
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
      {clients.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients by name, phone, GSTIN, email, or address..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Add/Edit Client Form */}
      {(showAddForm || editingClient) && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={editingClient ? editingClient.Name : newClient.Name}
              onChange={(e) => {
                if (editingClient) {
                  setEditingClient({ ...editingClient, Name: e.target.value });
                } else {
                  setNewClient({ ...newClient, Name: e.target.value });
                }
              }}
              placeholder="Client Name *"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editingClient ? editingClient.Phone : newClient.Phone}
              onChange={(e) => {
                if (editingClient) {
                  setEditingClient({ ...editingClient, Phone: e.target.value });
                } else {
                  setNewClient({ ...newClient, Phone: e.target.value });
                }
              }}
              placeholder="Phone"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editingClient ? editingClient.GSTIN : newClient.GSTIN}
              onChange={(e) => {
                if (editingClient) {
                  setEditingClient({ ...editingClient, GSTIN: e.target.value });
                } else {
                  setNewClient({ ...newClient, GSTIN: e.target.value });
                }
              }}
              placeholder="GSTIN"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              value={editingClient ? editingClient.Email : newClient.Email}
              onChange={(e) => {
                if (editingClient) {
                  setEditingClient({ ...editingClient, Email: e.target.value });
                } else {
                  setNewClient({ ...newClient, Email: e.target.value });
                }
              }}
              placeholder="Email"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={editingClient ? editingClient.Address : newClient.Address}
              onChange={(e) => {
                if (editingClient) {
                  setEditingClient({ ...editingClient, Address: e.target.value });
                } else {
                  setNewClient({ ...newClient, Address: e.target.value });
                }
              }}
              placeholder="Address"
              rows={2}
              className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingClient ? handleUpdateClient : handleAddClient}
              disabled={editingClient ? !editingClient.Name.trim() : !newClient.Name.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingClient ? 'Update Client' : 'Add Client'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingClient(null);
                setNewClient({
                  Name: '',
                  Address: '',
                  Phone: '',
                  GSTIN: '',
                  Email: ''
                });
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No clients found</h3>
          <p className="text-gray-400 mb-6">Import from Google Sheets or add clients manually to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
            <span>Showing {filteredClients.length} of {clients.length} clients</span>
            <div className="flex items-center text-green-600">
              <HardDrive className="w-4 h-4 mr-1" />
              <span>Stored locally</span>
            </div>
          </div>
          
          {filteredClients.map((client, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{client.Name}</h3>
                    {client.Email && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {client.Email}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Phone:</span> {client.Phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">GSTIN:</span> {client.GSTIN || 'N/A'}
                    </div>
                    <div className="md:col-span-1">
                      <span className="font-medium">Address:</span> {client.Address || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingClient({ ...client })}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit client"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete client"
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