import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AiPreferencesModal = ({ isOpen, onClose, preferences, onPreferencesUpdated }) => {
  const [budget, setBudget] = useState(preferences.budget || 'Up to ₹80 Lakhs');
  const [propertyType, setPropertyType] = useState(preferences.propertyType || '3 BHK');
  const [preferredLocation, setPreferredLocation] = useState(preferences.preferredLocation || 'Hyderabad');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const budgetOptions = [
    'Up to ₹50 Lakhs',
    'Up to ₹80 Lakhs',
    'Up to ₹1.2 Crores',
    'Up to ₹2 Crores',
    'Above ₹2 Crores'
  ];

  const typeOptions = [
    '1 BHK',
    '2 BHK',
    '3 BHK',
    '4+ BHK',
    'Villa',
    'Residential Plot'
  ];

  const locationOptions = [
    'Hyderabad',
    'Mumbai',
    'Pune',
    'Bangalore',
    'Delhi'
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/ai/preferences', {
        budget,
        propertyType,
        preferredLocation
      });
      toast.success('AI preferences updated!');
      if (onPreferencesUpdated) {
        onPreferencesUpdated(data.preferences);
      }
      onClose();
    } catch (err) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <Sliders className="text-blue-600" size={20} />
            <span>Customize AI Preferences</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Budget Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {budgetOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBudget(opt)}
                  className={`text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                    budget === opt
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt}</span>
                  {budget === opt && <Check size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Property Type / Bedrooms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPropertyType(opt)}
                  className={`text-xs font-semibold py-2.5 px-2 rounded-xl border transition-all text-center ${
                    propertyType === opt
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Preferred Location
            </label>
            <div className="grid grid-cols-3 gap-2">
              {locationOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPreferredLocation(opt)}
                  className={`text-xs font-semibold py-2 px-2 rounded-xl border transition-all text-center ${
                    preferredLocation === opt
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Refresh Recommendations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPreferencesModal;
