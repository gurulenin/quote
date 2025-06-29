import React from 'react';
import { CheckCircle } from 'lucide-react';

interface UserMessageProps {
  message: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative flex items-center">
        <CheckCircle className="w-5 h-5 mr-2" />
        <span>{message}</span>
      </div>
    </div>
  );
};