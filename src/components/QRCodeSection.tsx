import React from 'react';
import { QrCode } from 'lucide-react';

interface QRCodeSectionProps {
  upiId: string;
}

export const QRCodeSection: React.FC<QRCodeSectionProps> = ({ upiId }) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}`)}`;

  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm mb-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <QrCode className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold text-blue-800">Scan to Pay</h2>
      </div>
      
      <div className="flex flex-col items-center">
        <img
          src={qrCodeUrl}
          alt="UPI QR Code"
          className="rounded-lg shadow-md mb-4"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "https://placehold.co/150x150/e0e0e0/555555?text=QR+Error";
          }}
        />
        <p className="text-gray-700 font-medium">UPI ID: {upiId}</p>
        <p className="text-gray-500 text-sm mt-1">Scan with any UPI app to pay</p>
      </div>
    </div>
  );
};