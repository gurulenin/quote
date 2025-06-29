import React from 'react';
import { LogOut, FileText, Mail } from 'lucide-react';
import { User as UserType } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  onLogout: () => void;
  user: UserType;
  firebaseUser: FirebaseUser | null;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, user, firebaseUser }) => {
  const getDisplayName = () => {
    if (firebaseUser && firebaseUser.email) {
      return firebaseUser.email;
    }
    return 'User';
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Invoice & Quotation System
              </h1>
              <p className="text-gray-600 text-sm">Professional document management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">{getDisplayName()}</div>
              <div className="flex items-center justify-end mt-1">
                <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <Mail className="w-3 h-3 mr-1" />
                  Email Auth
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};