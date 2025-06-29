import { useState, useEffect } from 'react';
import { Quote } from '../types';

const QUOTES_STORAGE_KEY = 'quotation_app_quotes';

const defaultQuotes: Quote[] = [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'Motivation',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    text: 'Innovation distinguishes between a leader and a follower.',
    author: 'Steve Jobs',
    category: 'Innovation',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    text: 'Life is what happens to you while you\'re busy making other plans.',
    author: 'John Lennon',
    category: 'Life',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'Dreams',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    text: 'It is during our darkest moments that we must focus to see the light.',
    author: 'Aristotle',
    category: 'Inspiration',
    createdAt: new Date().toISOString(),
  },
];

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const storedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY);
    if (storedQuotes) {
      try {
        setQuotes(JSON.parse(storedQuotes));
      } catch (error) {
        setQuotes(defaultQuotes);
        localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(defaultQuotes));
      }
    } else {
      setQuotes(defaultQuotes);
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(defaultQuotes));
    }
  }, []);

  const addQuote = (text: string, author: string, category: string) => {
    const newQuote: Quote = {
      id: Date.now().toString(),
      text,
      author,
      category,
      createdAt: new Date().toISOString(),
    };

    const updatedQuotes = [newQuote, ...quotes];
    setQuotes(updatedQuotes);
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(updatedQuotes));
  };

  const deleteQuote = (id: string) => {
    const updatedQuotes = quotes.filter(quote => quote.id !== id);
    setQuotes(updatedQuotes);
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(updatedQuotes));
  };

  const getRandomQuote = (): Quote | null => {
    if (quotes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  const getQuotesByCategory = (category: string): Quote[] => {
    return quotes.filter(quote => quote.category.toLowerCase() === category.toLowerCase());
  };

  const getCategories = (): string[] => {
    const categories = quotes.map(quote => quote.category);
    return [...new Set(categories)];
  };

  return {
    quotes,
    addQuote,
    deleteQuote,
    getRandomQuote,
    getQuotesByCategory,
    getCategories,
  };
};