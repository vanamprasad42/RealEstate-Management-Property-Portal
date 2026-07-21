import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { MapPin, SlidersHorizontal, Home as HomeIcon } from 'lucide-react';

const CityProperties = () => {
  const { slug } = useParams();

  const [cityData, setCityData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('-createdAt');

  useEffect(() => {
    const fetchCityProperties = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/cities/${slug}/properties?pageNumber=${page}&sort=${sort}`);
        setProperties(data.properties);
        setCityData(data.city);
        setPages(data.pages);
        setTotal(data.total);
      } catch (error) {
        console.error('Error fetching city properties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCityProperties();
  }, [slug, page, sort]);

  return (
    <div className="w-full">
      {/* City Hero Banner */}
      {cityData && (
        <section className="relative h-[40vh] flex items-center justify-center bg-gray-950 text-white overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-50 scale-105" 
            style={{ backgroundImage: `url(${cityData.image || 'https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>
          
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{cityData.cityName} Properties</h1>
            <p className="text-lg text-gray-200">{cityData.stateName} State</p>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Active Listings</h2>
            <p className="text-sm text-gray-500 mt-1">Found {total} properties in {cityData?.cityName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <select 
              value={sort} 
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm h-96 animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <HomeIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No properties in {cityData?.cityName}</h3>
            <p className="text-gray-500 text-sm mt-1">Check back later or search other popular cities.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Link to={`/property/${property.slug}`} key={property._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={property.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      For {property.listingType}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-xl text-indigo-600 font-extrabold text-lg shadow-sm">
                      ${property.price.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                      <h3 className="font-extrabold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                        {property.title}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-4">{property.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-600 text-[11px] font-semibold">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 font-medium mb-0.5">Beds</span>
                        <span className="text-gray-800 text-sm font-bold">{property.bedrooms || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 font-medium mb-0.5">Baths</span>
                        <span className="text-gray-800 text-sm font-bold">{property.bathrooms || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 font-medium mb-0.5">Area</span>
                        <span className="text-gray-800 text-sm font-bold">{property.area} sqft</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Prev
                </button>
                {[...Array(pages).keys()].map((num) => (
                  <button 
                    key={num + 1}
                    onClick={() => setPage(num + 1)}
                    className={`w-10 h-10 border rounded-xl font-bold transition-all text-sm ${page === num + 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {num + 1}
                  </button>
                ))}
                <button 
                  disabled={page === pages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CityProperties;
