import React from 'react';
import { Truck } from 'lucide-react';

interface ShippingDetailsProps {
  shippingDetails: { name: string; address: string };
  shippingSameAsBilling: boolean;
  onShippingDetailsChange: (details: { name: string; address: string }) => void;
  onShippingSameAsBillingChange: (same: boolean) => void;
  clientName: string;
  clientAddress: string;
}

export const ShippingDetails: React.FC<ShippingDetailsProps> = ({
  shippingDetails,
  shippingSameAsBilling,
  onShippingDetailsChange,
  onShippingSameAsBillingChange,
  clientName,
  clientAddress
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onShippingDetailsChange({
      ...shippingDetails,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Truck className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold text-indigo-800">Shipping Details</h2>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sameAsBilling"
            checked={shippingSameAsBilling}
            onChange={(e) => onShippingSameAsBillingChange(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-gray-900">
            Same as Vendor Details
          </label>
        </div>
      </div>
      
      {!shippingSameAsBilling && (
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            value={shippingDetails.name}
            onChange={handleChange}
            placeholder="Shipping Name"
            className="w-full p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          
          <textarea
            name="address"
            value={shippingDetails.address}
            onChange={handleChange}
            placeholder="Shipping Address"
            rows={3}
            className="w-full p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
          />
        </div>
      )}
      
      {shippingSameAsBilling && (
        <div className="text-gray-600 bg-white p-4 rounded-md border border-indigo-200">
          <p className="font-medium">{clientName || 'Vendor Name'}</p>
          <p className="text-sm mt-1">{clientAddress || 'Vendor Address'}</p>
        </div>
      )}
    </div>
  );
};