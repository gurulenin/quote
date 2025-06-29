import { useState, useEffect } from 'react';
import { indexedDBManager } from '../utils/indexedDB';

export interface ProductData {
  Description: string;
  HSN: string;
  Price: string;
  Category?: string;
  [key: string]: any;
}

export const useProductData = (user: any) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProductData = async () => {
    if (!user?.isAuthenticated) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await indexedDBManager.init();
      const productData = await indexedDBManager.getProductData();
      setProducts(productData);
    } catch (error) {
      console.error('Error loading product data:', error);
      // Fallback to localStorage
      loadStoredProductData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredProductData = () => {
    try {
      const storedData = localStorage.getItem('imported_product_data');
      if (storedData) {
        const productData = JSON.parse(storedData);
        setProducts(productData);
      }
    } catch (error) {
      console.error('Error loading stored product data:', error);
    }
  };

  const saveProductData = async (productData: ProductData[]) => {
    if (!user?.isAuthenticated) {
      // Fallback to localStorage only when not authenticated
      try {
        localStorage.setItem('imported_product_data', JSON.stringify(productData));
        setProducts(productData);
        return true;
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
        return false;
      }
    }

    try {
      await indexedDBManager.init();
      await indexedDBManager.saveProductData(productData);
      
      // Also save to localStorage as backup
      localStorage.setItem('imported_product_data', JSON.stringify(productData));
      
      setProducts(productData);
      return true;
    } catch (error) {
      console.error('Error saving product data:', error);
      
      // Fallback to localStorage only
      try {
        localStorage.setItem('imported_product_data', JSON.stringify(productData));
        setProducts(productData);
        return true;
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
        return false;
      }
    }
  };

  const addProduct = async (newProduct: ProductData) => {
    const updatedProducts = [...products, newProduct];
    return await saveProductData(updatedProducts);
  };

  const updateProduct = async (index: number, updatedProduct: ProductData) => {
    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    return await saveProductData(updatedProducts);
  };

  const deleteProduct = async (productToDelete: ProductData) => {
    const updatedProducts = products.filter(p => 
      !(p.Description === productToDelete.Description && 
        p.HSN === productToDelete.HSN && 
        p.Price === productToDelete.Price)
    );
    return await saveProductData(updatedProducts);
  };

  const syncWithCloud = async () => {
    if (!user?.isAuthenticated) {
      return false;
    }

    try {
      await loadProductData();
      return true;
    } catch (error) {
      console.error('Error syncing product data:', error);
      return false;
    }
  };

  const searchProducts = (query: string): ProductData[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.Description?.toLowerCase().includes(searchTerm) ||
      product.HSN?.includes(query) ||
      product.Category?.toLowerCase().includes(searchTerm)
    );
  };

  const getProductByDescription = (description: string): ProductData | null => {
    return products.find(product => 
      product.Description?.toLowerCase() === description.toLowerCase()
    ) || null;
  };

  const getProductByHSN = (hsn: string): ProductData | null => {
    return products.find(product => 
      product.HSN === hsn
    ) || null;
  };

  const getProductsByCategory = (category: string): ProductData[] => {
    return products.filter(product => 
      product.Category?.toLowerCase() === category.toLowerCase()
    );
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      loadProductData();
    } else {
      // Clear data when user logs out
      setProducts([]);
      setIsLoading(false);
    }
  }, [user?.isAuthenticated]);

  return {
    products,
    isLoading,
    searchProducts,
    getProductByDescription,
    getProductByHSN,
    getProductsByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    saveProductData,
    syncWithCloud,
    refreshData: loadProductData
  };
};