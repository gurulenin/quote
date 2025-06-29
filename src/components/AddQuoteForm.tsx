import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddQuoteFormProps {
  onAddQuote: (text: string, author: string, category: string) => void;
  categories: string[];
}

export const AddQuoteForm: React.FC<AddQuoteFormProps> = ({ onAddQuote, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && author.trim() && category.trim()) {
      onAddQuote(text.trim(), author.trim(), category.trim());
      setText('');
      setAuthor('');
      setCategory('');
      setIsCustomCategory(false);
      setIsOpen(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomCategory(true);
      setCategory('');
    } else {
      setIsCustomCategory(false);
      setCategory(value);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 z-10"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Quote</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quote Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the quote..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            {!isCustomCategory ? (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Add new category</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter new category..."
                  className="flex-1 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCategory('');
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium"
            >
              Add Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};