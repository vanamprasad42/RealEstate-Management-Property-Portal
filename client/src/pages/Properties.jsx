import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setPropertiesRequest, setPropertiesSuccess, setPropertiesFail } from '../redux/slices/propertySlice';
import { setCitiesRequest, setCitiesSuccess, setCitiesFail } from '../redux/slices/citySlice';
import api from '../services/api';
import { MapPin, SlidersHorizontal, Search, Home as HomeIcon, Eye } from 'lucide-react';

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { properties, page, pages, total, loading } = useSelector((state) => state.properties);
  const { cities } = useSelector((state) => state.cities);

  // Filter local states
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || '');
  
  // Plot-specific filter states
  const [areaUnit, setAreaUnit] = useState(searchParams.get('areaUnit') || '');
  const [facing, setFacing] = useState(searchParams.get('facing') || '');
  const [cornerPlot, setCornerPlot] = useState(searchParams.get('cornerPlot') || '');
  const [plotType, setPlotType] = useState(searchParams.get('plotType') || '');
  const [roadWidth, setRoadWidth] = useState(searchParams.get('roadWidth') || '');
  
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('pageNumber')) || 1);

  // Fetch cities for select dropdown
  useEffect(() => {
    const fetchCities = async () => {
      dispatch(setCitiesRequest());
      try {
        const { data } = await api.get('/cities');
        dispatch(setCitiesSuccess(data));
      } catch (error) {
        dispatch(setCitiesFail(error.message));
      }
    };
    if (cities.length === 0) {
      fetchCities();
    }
  }, [dispatch, cities.length]);

  // Fetch properties on param change
  useEffect(() => {
    const fetchProperties = async () => {
      dispatch(setPropertiesRequest());
      try {
        // Build query string
        const params = {};
        if (searchParams.get('keyword')) params.keyword = searchParams.get('keyword');
        if (searchParams.get('city')) params.city = searchParams.get('city');
        if (searchParams.get('propertyType')) params.propertyType = searchParams.get('propertyType');
        if (searchParams.get('listingType')) params.listingType = searchParams.get('listingType');
        if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice');
        if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice');
        
        if (searchParams.get('propertyType') !== 'Plot') {
          if (searchParams.get('bedrooms')) params.bedrooms = searchParams.get('bedrooms');
          if (searchParams.get('bathrooms')) params.bathrooms = searchParams.get('bathrooms');
        } else {
          if (searchParams.get('areaUnit')) params.areaUnit = searchParams.get('areaUnit');
          if (searchParams.get('facing')) params.facing = searchParams.get('facing');
          if (searchParams.get('cornerPlot')) params.cornerPlot = searchParams.get('cornerPlot');
          if (searchParams.get('plotType')) params.plotType = searchParams.get('plotType');
          if (searchParams.get('roadWidth')) params.roadWidth = searchParams.get('roadWidth');
        }
        
        params.pageNumber = searchParams.get('pageNumber') || 1;

        const { data } = await api.get('/properties', { params });
        dispatch(setPropertiesSuccess(data));
      } catch (error) {
        dispatch(setPropertiesFail(error.response?.data?.message || error.message));
      }
    };

    fetchProperties();
  }, [dispatch, searchParams]);

  const applyFilters = (e) => {
    e?.preventDefault();
    const params = {};
    if (keyword) params.keyword = keyword;
    if (city) params.city = city;
    if (propertyType) params.propertyType = propertyType;
    if (listingType) params.listingType = listingType;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    
    if (propertyType !== 'Plot') {
      if (bedrooms) params.bedrooms = bedrooms;
      if (bathrooms) params.bathrooms = bathrooms;
    } else {
      if (areaUnit) params.areaUnit = areaUnit;
      if (facing) params.facing = facing;
      if (cornerPlot) params.cornerPlot = cornerPlot;
      if (plotType) params.plotType = plotType;
      if (roadWidth) params.roadWidth = roadWidth;
    }
    
    params.pageNumber = 1; // reset page on filter change
    setSearchParams(params);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    const newParams = Object.fromEntries(searchParams.entries());
    newParams.pageNumber = pageNum;
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setKeyword('');
    setCity('');
    setPropertyType('');
    setListingType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBathrooms('');
    setAreaUnit('');
    setFacing('');
    setCornerPlot('');
    setPlotType('');
    setRoadWidth('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 text-gray-900 font-extrabold text-lg">
            <SlidersHorizontal size={20} className="text-indigo-600" />
            <span>Search Filters</span>
          </div>

          <form onSubmit={applyFilters} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="e.g. 3BHK Apartment"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
              >
                <option value="">Any City</option>
                {cities.map((c) => (
                  <option key={c._id} value={c.cityName}>{c.cityName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Type</label>
              <select 
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Any Type</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Plot">Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Listing Type</label>
              <select 
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Any Status</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Price</label>
                <input 
                  type="number" 
                  placeholder="$ Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Price</label>
                <input 
                  type="number" 
                  placeholder="$ Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {propertyType === 'Plot' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Type</label>
                  <select 
                    value={plotType}
                    onChange={(e) => setPlotType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Any Plot Type</option>
                    <option value="Residential Plot">Residential Plot</option>
                    <option value="Commercial Plot">Commercial Plot</option>
                    <option value="Farm Land">Farm Land</option>
                    <option value="Industrial Plot">Industrial Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Area Unit</label>
                  <select 
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Any Unit</option>
                    <option value="Sq. Yards">Sq. Yards</option>
                    <option value="Sq. Ft.">Sq. Ft.</option>
                    <option value="Acres">Acres</option>
                    <option value="Cents">Cents</option>
                    <option value="Gunta">Gunta</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Facing</label>
                    <select 
                      value={facing}
                      onChange={(e) => setFacing(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Any Facing</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Corner Plot</label>
                    <select 
                      value={cornerPlot}
                      onChange={(e) => setCornerPlot(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Road Width (ft)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 30" 
                    value={roadWidth}
                    onChange={(e) => setRoadWidth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Beds</label>
                  <select 
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Baths</label>
                  <select 
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              Apply Filters
            </button>
            <button type="button" onClick={clearFilters} className="w-full bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
              Reset Filters
            </button>
          </form>
        </div>

        {/* Listings Result Panel */}
        <div className="w-full lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600 text-sm font-medium">
              Found <span className="font-extrabold text-indigo-600">{total}</span> properties
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm h-96 animate-pulse">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl shadow-sm">
              <HomeIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No properties found</h3>
              <p className="text-gray-500 text-sm mt-1">Try widening your search terms or clearing some filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.filter(p => p.approved).map((property) => (
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

                      {property.propertyType === 'Plot' ? (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-600 text-[11px] font-semibold">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-400 font-medium mb-0.5">Type</span>
                            <span className="text-gray-800 text-sm font-bold">{property.plotType || 'Plot'}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-gray-400 font-medium mb-0.5">Facing</span>
                            <span className="text-gray-800 text-sm font-bold">{property.facing || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-gray-400 font-medium mb-0.5">Area</span>
                            <span className="text-gray-800 text-sm font-bold">{property.area} {property.areaUnit || 'Sq. Ft.'}</span>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination controls */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-4 py-2 border rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  {[...Array(pages).keys()].map((num) => (
                    <button 
                      key={num + 1}
                      onClick={() => handlePageChange(num + 1)}
                      className={`w-10 h-10 border rounded-xl font-bold transition-all text-sm ${currentPage === num + 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      {num + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === pages}
                    onClick={() => handlePageChange(currentPage + 1)}
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
    </div>
  );
};

export default Properties;
