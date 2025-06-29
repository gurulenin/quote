import { useState, useEffect } from 'react';
import { indexedDBManager } from '../utils/indexedDB';

export interface ClientData {
  Name: string;
  Address: string;
  Phone: string;
  GSTIN: string;
  Email?: string;
  [key: string]: any;
}

export const useClientData = (user: any) => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClientData = async () => {
    if (!user?.isAuthenticated) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await indexedDBManager.init();
      const clientData = await indexedDBManager.getClientData();
      setClients(clientData);
    } catch (error) {
      console.error('Error loading client data:', error);
      // Fallback to localStorage
      loadStoredClientData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredClientData = () => {
    try {
      const storedData = localStorage.getItem('imported_client_data');
      if (storedData) {
        const clientData = JSON.parse(storedData);
        setClients(clientData);
      }
    } catch (error) {
      console.error('Error loading stored client data:', error);
    }
  };

  const saveClientData = async (clientData: ClientData[]) => {
    if (!user?.isAuthenticated) {
      // Fallback to localStorage only when not authenticated
      try {
        localStorage.setItem('imported_client_data', JSON.stringify(clientData));
        setClients(clientData);
        return true;
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
        return false;
      }
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.saveClientData(clientData);
      
      // Also save to localStorage as backup
      localStorage.setItem('imported_client_data', JSON.stringify(clientData));
      
      setClients(clientData);
      return true;
    } catch (error) {
      console.error('Error saving client data:', error);
      
      // Fallback to localStorage only
      try {
        localStorage.setItem('imported_client_data', JSON.stringify(clientData));
        setClients(clientData);
        return true;
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
        return false;
      }
    }
  };

  const addClient = async (newClient: ClientData) => {
    const updatedClients = [...clients, newClient];
    return await saveClientData(updatedClients);
  };

  const updateClient = async (index: number, updatedClient: ClientData) => {
    const updatedClients = [...clients];
    updatedClients[index] = updatedClient;
    return await saveClientData(updatedClients);
  };

  const deleteClient = async (clientToDelete: ClientData) => {
    const updatedClients = clients.filter(c => 
      !(c.Name === clientToDelete.Name && 
        c.Phone === clientToDelete.Phone && 
        c.GSTIN === clientToDelete.GSTIN)
    );
    return await saveClientData(updatedClients);
  };

  const syncWithCloud = async () => {
    if (!user?.isAuthenticated) {
      return false;
    }

    try {
      await loadClientData();
      return true;
    } catch (error) {
      console.error('Error syncing client data:', error);
      return false;
    }
  };

  const searchClients = (query: string): ClientData[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return clients.filter(client => 
      client.Name?.toLowerCase().includes(searchTerm) ||
      client.Phone?.includes(query) ||
      client.GSTIN?.toLowerCase().includes(searchTerm) ||
      client.Email?.toLowerCase().includes(searchTerm)
    );
  };

  const getClientByName = (name: string): ClientData | null => {
    return clients.find(client => 
      client.Name?.toLowerCase() === name.toLowerCase()
    ) || null;
  };

  const getClientByPhone = (phone: string): ClientData | null => {
    return clients.find(client => 
      client.Phone === phone
    ) || null;
  };

  const getClientByGSTIN = (gstin: string): ClientData | null => {
    return clients.find(client => 
      client.GSTIN?.toLowerCase() === gstin.toLowerCase()
    ) || null;
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      loadClientData();
    } else {
      // Clear data when user logs out
      setClients([]);
      setIsLoading(false);
    }
  }, [user?.isAuthenticated]);

  return {
    clients,
    isLoading,
    searchClients,
    getClientByName,
    getClientByPhone,
    getClientByGSTIN,
    addClient,
    updateClient,
    deleteClient,
    saveClientData,
    syncWithCloud,
    refreshData: loadClientData
  };
};