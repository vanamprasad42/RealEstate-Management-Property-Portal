import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setPropertiesRequest, setPropertiesSuccess, setPropertiesFail } from '../redux/slices/propertySlice';
import { setCitiesRequest, setCitiesSuccess, setCitiesFail } from '../redux/slices/citySlice';
import api from '../services/api';
import { MapPin, Search, Home as HomeIcon, Key, Mail, Handshake, Eye, Headset, ArrowRight } from 'lucide-react';
import apartmentImg from '../assets/apartment_category.png';
import villaImg from '../assets/villa_category.png';
import houseImg from '../assets/house_category.png';
import plotImg from '../assets/plot_category.png';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('sale');

  const { properties, loading: propLoading } = useSelector((state) => state.properties);
  const { cities, loading: cityLoading } = useSelector((state) => state.cities);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const resetToken = searchParams.get('token') || searchParams.get('resetToken');
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`, { replace: true });
      return;
    }

    const fetchFeatured = async () => {

      dispatch(setPropertiesRequest());
      try {
        const { data } = await api.get('/properties?limit=6');
        dispatch(setPropertiesSuccess(data));
      } catch (error) {
        dispatch(setPropertiesFail(error.response?.data?.message || error.message));
      }
    };

    const fetchCities = async () => {
      dispatch(setCitiesRequest());
      try {
        const { data } = await api.get('/cities');
        dispatch(setCitiesSuccess(data));
      } catch (error) {
        dispatch(setCitiesFail(error.response?.data?.message || error.message));
      }
    };

    fetchFeatured();
    fetchCities();
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    let query = `?listingType=${listingType}`;
    if (keyword) query += `&keyword=${keyword}`;
    if (city) query += `&city=${city}`;
    if (propertyType) query += `&propertyType=${propertyType}`;
    navigate(`/properties${query}`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center bg-gray-950 text-white overflow-hidden">
        <motion.div 
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.8 }}
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20 uppercase"
          >
            The Easiest Way to Find Your Next Home
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-none"
          >
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Dream</span> Space
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl mb-10 text-gray-300 max-w-2xl mx-auto"
          >
            Discover verified premium houses, villas, and apartments for rent or sale in your favorite cities.
          </motion.p>
          
          {/* Advanced Search Form */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring" }}
            className="bg-white p-4 md:p-6 rounded-2xl shadow-2xl text-gray-900 max-w-4xl mx-auto border border-gray-100"
          >
            {/* Rent/Buy Toggle */}
            <div className="flex gap-2 mb-4 justify-start">
              <button 
                onClick={() => setListingType('sale')}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${listingType === 'sale' ? 'bg-primary text-white shadow-md shadow-indigo-600/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Buy Properties
              </button>
              <button 
                onClick={() => setListingType('rent')}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${listingType === 'rent' ? 'bg-primary text-white shadow-md shadow-indigo-600/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Rent Properties
              </button>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Keyword (e.g. 3BHK, Villa)" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c._id} value={c.cityName}>{c.cityName}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <HomeIcon className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <select 
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Property Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="House">House</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="bg-primary text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Search size={18} /> Search
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <span className="text-sm font-bold tracking-wider text-primary uppercase">Locations</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1 font-sans">Explore Popular Cities</h2>
          </div>
        </motion.div>

        {cityLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {cities.slice(0, 4).map((c) => (
              <motion.div key={c._id} variants={itemVariants}>
                <Link to={`/city/${c.slug}`} className="group relative block h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <img 
                    src={c.image || 'https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} 
                    alt={c.cityName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-extrabold text-lg">{c.cityName}</h3>
                    <p className="text-xs text-gray-300">{c.stateName}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-white border-t border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <span className="text-sm font-bold tracking-wider text-primary uppercase">Featured Listings</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1 font-sans">Properties Handpicked For You</h2>
            </div>
            <Link to="/properties" className="group flex items-center gap-1.5 text-primary font-semibold hover:text-indigo-800 transition-colors text-sm">
              View All Properties <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {propLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {properties.filter(p => p.approved).slice(0, 6).map((property) => (
                <motion.div key={property._id} variants={itemVariants}>
                  <Link to={`/property/${property.slug}`} className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-350 overflow-hidden flex flex-col h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={property.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-md">
                        For {property.listingType}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-xl text-primary font-black text-lg shadow-sm">
                        ${property.price.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{property.address}, {property.city}</span>
                        </div>
                        <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                          {property.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{property.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-600 text-xs font-semibold">
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Browse by Property Types (New Premium Look with Real Images) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-bold tracking-wider text-primary uppercase">Categories</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-1 font-sans">Browse by Property Types</h2>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { 
              name: 'Apartment', 
              desc: 'Sleek luxury condos & flats', 
              image: apartmentImg
            },
            { 
              name: 'Villa', 
              desc: 'Premium detached private villas', 
              image: villaImg
            },
            { 
              name: 'House', 
              desc: 'Beautiful suburban family homes', 
              image: houseImg
            },
            { 
              name: 'Plot', 
              desc: 'Invest in secure residential land', 
              image: plotImg
            },
          ].map((cat, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="h-72 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative group cursor-pointer border border-gray-100 hover:border-indigo-200"
            >
              <Link to={`/properties?propertyType=${cat.name}`} className="block w-full h-full">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5 group-hover:from-black/90 group-hover:via-black/45 group-hover:to-black/10 transition-all duration-500"></div>
                
                <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                  <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase bg-indigo-900/50 px-2.5 py-1 rounded-md mb-2 inline-block border border-indigo-500/30">
                    Category
                  </span>
                  <h3 className="font-extrabold text-2xl tracking-wide font-sans group-hover:text-indigo-200 transition-colors duration-300">{cat.name}</h3>
                  <p className="text-gray-300 text-xs mt-1.5 leading-relaxed font-medium group-hover:text-white transition-colors duration-300">{cat.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Premium Clean Process Timeline Section */}
      <section className="py-24 bg-slate-50/50 border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-sm font-bold tracking-wider text-primary uppercase font-sans">How it works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1 font-sans">Premium Clean Process Timeline</h2>
          </motion.div>

          <div className="ui-timeline-container">
            {[
              { 
                step: 'Step 01', 
                title: 'Find Property', 
                desc: 'Discover personalized local spaces matching your distinct lifestyle goals.',
                icon: Search 
              },
              { 
                step: 'Step 02', 
                title: 'Submit Enquiry', 
                desc: 'Send an instant automated brief to get connected with the correct desk.',
                icon: Mail 
              },
              { 
                step: 'Step 03', 
                title: 'Meet Expert', 
                desc: 'Schedule a quick technical consultation with our property advisors.',
                icon: Handshake 
              },
              { 
                step: 'Step 04', 
                title: 'Site Visit', 
                desc: 'Take an immersive physically guided walk through your curated shortlist.',
                icon: MapPin 
              },
              { 
                step: 'Step 05', 
                title: 'Buy Property', 
                desc: 'Finalize seamless paperwork protocols with zero friction variables.',
                icon: Key 
              },
              { 
                step: 'Step 06', 
                title: 'Support Desk', 
                desc: 'Access lifetime post-purchase customer success documentation panels.',
                icon: Headset 
              },
            ].map((item, idx) => (
              <div key={idx} className="ui-timeline-card">
                <span className="ui-timeline-step-number">{item.step}</span>
                <div className="ui-timeline-icon-box">
                  <item.icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
