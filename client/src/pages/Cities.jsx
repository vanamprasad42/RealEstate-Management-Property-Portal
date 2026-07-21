import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Loader, Search } from 'lucide-react';

const Cities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await api.get('/cities');
        setCities(data);
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  const filteredCities = cities.filter(c => 
    c.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.stateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Explore Cities</h1>
          <p className="text-gray-500 text-sm mt-1">Browse premium properties across our active supported regions.</p>
        </div>
        
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search city or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {filteredCities.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-bold text-gray-800 text-lg">No cities match your search</p>
          <p className="text-sm text-gray-400 mt-1">Try another keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filteredCities.map((c) => (
            <Link to={`/city/${c.slug}`} key={c._id} className="group relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <img 
                src={c.image || 'https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} 
                alt={c.cityName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-bold text-lg">{c.cityName}</h3>
                <p className="text-xs text-gray-300">{c.stateName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cities;
