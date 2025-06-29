import React, { useState } from 'react';
import { Lock, Eye, EyeOff, FileText, Mail, UserPlus, ArrowLeft, RotateCcw } from 'lucide-react';

interface LoginFormProps {
  onEmailLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onEmailRegister: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
}

type AuthMode = 'login' | 'register' | 'reset';

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onEmailLogin, 
  onEmailRegister, 
  onPasswordReset 
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (authMode === 'reset') {
      const result = await onPasswordReset(email);
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => setAuthMode('login'), 3000);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } else if (authMode === 'register') {
      const result = await onEmailRegister(email, password);
      if (result.success) {
        setSuccess('Account created successfully! You are now logged in.');
      } else {
        setError(result.error || 'Registration failed');
      }
    } else {
      const result = await onEmailLogin(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  const getTitle = () => {
    switch (authMode) {
      case 'register': return 'Create Account';
      case 'reset': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case 'register': return 'Create your account to get started';
      case 'reset': return 'Enter your email to reset password';
      default: return 'Sign in to your account';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Invoice & Quotation
            </h1>
            <p className="text-gray-600 mt-2">Professional document management system</p>
          </div>

          {/* Auth Mode Tabs */}
          {authMode !== 'reset' && (
            <div className="flex mb-6 bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                Sign In
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                Register
              </button>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{getTitle()}</h2>
            <p className="text-gray-600 text-sm mt-1">{getSubtitle()}</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {authMode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </button>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                required
              />
            </div>

            {authMode !== 'reset' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || (authMode !== 'reset' && !password.trim())}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {authMode === 'reset' ? 'Sending...' : authMode === 'register' ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <>
                  {authMode === 'reset' && <RotateCcw className="w-5 h-5 inline mr-2" />}
                  {authMode === 'register' && <UserPlus className="w-5 h-5 inline mr-2" />}
                  {authMode === 'login' && <Mail className="w-5 h-5 inline mr-2" />}
                  {authMode === 'reset' ? 'Send Reset Email' : authMode === 'register' ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>

            {authMode === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Secure access to professional invoice and quotation system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};