import React, { useState } from 'react';
import { Mail, Copy, Sparkles } from 'lucide-react';
import { DocumentType } from '../types';

interface EmailAssistantProps {
  docType: DocumentType;
  clientName: string;
  clientEmail?: string;
  docNumber: string;
  grandTotal: number;
}

export const EmailAssistant: React.FC<EmailAssistantProps> = ({
  docType,
  clientName,
  clientEmail,
  docNumber,
  grandTotal
}) => {
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedEmail('');

    try {
      // Simulate email generation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const toField = clientEmail ? `${clientName} <${clientEmail}>` : clientName || 'Valued Client';
      
      const email = `To: ${toField}
Subject: Follow-up on ${docType} #${docNumber}

Dear ${clientName || 'Valued Client'},

I hope this email finds you well.

I wanted to follow up regarding ${docType} #${docNumber} for the amount of ₹${grandTotal.toFixed(2)} that we sent to you recently.

${docType === 'Quotation' 
  ? 'We would appreciate your feedback on our quotation and look forward to the opportunity to work with you.'
  : docType === 'Invoice'
  ? 'We kindly request you to process the payment at your earliest convenience.'
  : 'We would like to confirm the delivery schedule and ensure all requirements are met.'
}

Please feel free to reach out if you have any questions or need any clarification regarding this ${docType.toLowerCase()}.

Thank you for your business and we look forward to hearing from you soon.

Best regards,
SUN CREATIONS
Phone: 9578078500
Email: hi@printhink.in`;

      setGeneratedEmail(email);
    } catch (err) {
      setError('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(generatedEmail);
    }
  };

  return (
    <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex items-center mb-4">
        <Mail className="w-5 h-5 text-purple-600 mr-2" />
        <h2 className="text-xl font-bold text-purple-800">Email Assistant</h2>
        {clientEmail && (
          <div className="ml-auto flex items-center text-sm text-purple-600">
            <Mail className="w-4 h-4 mr-1" />
            <span>{clientEmail}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={generateEmail}
        disabled={isGenerating || !clientName}
        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-md flex items-center justify-center mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {isGenerating ? 'Generating Email...' : 'Generate Follow-up Email'}
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {generatedEmail && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Generated Email Draft:
          </label>
          <textarea
            value={generatedEmail}
            readOnly
            rows={15}
            className="w-full p-4 border border-gray-300 rounded-md bg-white resize-y text-sm font-mono"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
            {clientEmail && (
              <a
                href={`mailto:${clientEmail}?subject=${encodeURIComponent(`Follow-up on ${docType} #${docNumber}`)}&body=${encodeURIComponent(generatedEmail.split('\n').slice(2).join('\n'))}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Open in Email Client
              </a>
            )}
          </div>
        </div>
      )}
      
      {!clientName && (
        <p className="text-gray-500 text-sm">
          Please enter client name to generate personalized email.
        </p>
      )}
      
      {clientName && !clientEmail && (
        <p className="text-yellow-600 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-4">
          💡 Add client email address to enable "Open in Email Client" feature and show recipient in email header.
        </p>
      )}
    </div>
  );
};