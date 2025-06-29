import { useState, useEffect } from 'react';
import { Product } from '../types';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkv3VpHn3M4llIr17GVYZPB6d6TuwE2H6IWUmhT6Qib57BN81CTEMrt_ErOMK8Hh8GD8EUkP-1LhY3/pub?output=csv';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(CSV_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const csvText = await response.text();
      const parsedData = parseCsv(csvText);
      setProducts(parsedData);
    } catch (err) {
      setError('Failed to load product data');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCsv = (csvText: string): Product[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim());
      return {
        Description: values[0] || '',
        HSN: values[1] || '',
        Price: values[values.length - 1] || '0'
      };
    });
  };

  return { products, isLoading, error };
};