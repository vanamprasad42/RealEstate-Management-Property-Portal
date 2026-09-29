import React, { useState } from 'react';
import { Heart, MapPin, Bed, Maximize2, Building, ArrowRight, PhoneCall, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatPrice = (price) => {
  if (!price) return '₹0';
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 2)} Crores`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 2)} Lakhs`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

const AiPropertyCard = ({ 
  property, 
  onContactAgent, 
  onViewDetails, 
  onAddToCompare, 
  isCompared = false 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  if (!property) return null;

  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden min-w-[280px] max-w-[320px] w-full flex-shrink-0 group">
      {/* Property Image & Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
        
        {/* For Sale / Rent Badge */}
        <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow uppercase tracking-wide">
          For {property.listingType === 'rent' ? 'Rent' : 'Sale'}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
            isFavorite 
              ? 'bg-rose-50 text-rose-500 shadow-md scale-110' 
              : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
          }`}
          title="Save to favorites"
        >
          <Heart size={16} className={isFavorite ? 'fill-rose-500' : ''} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Title & Price */}
          <div className="mb-1">
            <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h4>
            <div className="text-blue-600 font-extrabold text-lg tracking-tight">
              {formatPrice(property.price)}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{property.address || property.city}, {property.city}</span>
          </div>

          {/* Specs: BHK, Area, Floor/Facing */}
          <div className="flex items-center justify-between text-gray-600 text-xs py-2 px-2.5 bg-gray-50 rounded-xl mb-4 border border-gray-100">
            <div className="flex items-center gap-1 font-medium">
              <Bed size={14} className="text-gray-400" />
              <span>{property.bedrooms ? `${property.bedrooms} BHK` : property.propertyType}</span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              <Maximize2 size={13} className="text-gray-400" />
              <span>{property.area} sq ft</span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              <Building size={13} className="text-gray-400" />
              <span>{property.facing || 'East Facing'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onViewDetails ? onViewDetails(property) : null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              View Details
            </button>
            <button 
              onClick={() => onContactAgent ? onContactAgent(property) : null}
              className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-600/40 hover:border-blue-600 font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              Contact Agent
            </button>
          </div>

          {onAddToCompare && (
            <button
              onClick={() => onAddToCompare(property)}
              className={`w-full text-xs py-1.5 px-2 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              <Scale size={13} />
              {isCompared ? 'Added to Compare ✓' : 'Add to Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPropertyCard;
