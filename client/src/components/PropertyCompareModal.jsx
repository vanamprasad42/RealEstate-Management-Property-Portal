import React from 'react';
import { X, Check, Bed, Bath, Maximize2, MapPin, Building, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatPrice = (price) => {
  if (!price) return '₹0';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakhs`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const PropertyCompareModal = ({ properties = [], isOpen, onClose, onContactAgent }) => {
  if (!isOpen || properties.length < 2) return null;

  const [p1, p2] = properties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" size={20} />
            <h3 className="font-bold text-gray-900 text-lg">Property Comparison Matrix</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Images and Titles */}
          <div className="grid grid-cols-2 gap-6">
            {[p1, p2].map((prop, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col">
                <img 
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600'} 
                  alt={prop.title}
                  className="w-full h-44 object-cover rounded-xl mb-3 shadow-sm"
                />
                <h4 className="font-extrabold text-gray-900 text-lg">{prop.title}</h4>
                <div className="text-blue-600 font-black text-xl mt-0.5">{formatPrice(prop.price)}</div>
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                  <MapPin size={12} className="text-gray-400" />
                  <span>{prop.address}, {prop.city}</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onContactAgent) onContactAgent(prop);
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Contact Agent for {prop.title}
                </button>
              </div>
            ))}
          </div>

          {/* Detailed Metric Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-3.5 border-b border-gray-200">Feature</th>
                  <th className="p-3.5 border-b border-gray-200 text-blue-700">{p1.title}</th>
                  <th className="p-3.5 border-b border-gray-200 text-blue-700">{p2.title}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Price</td>
                  <td className="p-3.5 font-bold text-gray-900">{formatPrice(p1.price)}</td>
                  <td className="p-3.5 font-bold text-gray-900">{formatPrice(p2.price)}</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Price / Sq. Ft.</td>
                  <td className="p-3.5 text-gray-800">
                    {p1.area ? `₹${Math.round(p1.price / p1.area).toLocaleString('en-IN')} / sq ft` : 'N/A'}
                  </td>
                  <td className="p-3.5 text-gray-800">
                    {p2.area ? `₹${Math.round(p2.price / p2.area).toLocaleString('en-IN')} / sq ft` : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Configuration</td>
                  <td className="p-3.5 text-gray-800">{p1.bedrooms || 3} BHK ({p1.bathrooms || 3} Baths)</td>
                  <td className="p-3.5 text-gray-800">{p2.bedrooms || 3} BHK ({p2.bathrooms || 3} Baths)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Super Built-up Area</td>
                  <td className="p-3.5 text-gray-800">{p1.area} sq ft</td>
                  <td className="p-3.5 text-gray-800">{p2.area} sq ft</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Facing</td>
                  <td className="p-3.5 text-gray-800">{p1.facing || 'East'}</td>
                  <td className="p-3.5 text-gray-800">{p2.facing || 'North-East'}</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Property Type</td>
                  <td className="p-3.5 text-gray-800">{p1.propertyType} (For {p1.listingType})</td>
                  <td className="p-3.5 text-gray-800">{p2.propertyType} (For {p2.listingType})</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-gray-600 bg-gray-50/50">Key Amenities</td>
                  <td className="p-3.5 text-gray-800 text-xs">{(p1.amenities || []).slice(0, 4).join(', ') || 'Clubhouse, Security, Backup'}</td>
                  <td className="p-3.5 text-gray-800 text-xs">{(p2.amenities || []).slice(0, 4).join(', ') || 'Infinity Pool, Gym, Automation'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCompareModal;
