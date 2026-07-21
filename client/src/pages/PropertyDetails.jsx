import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { MapPin, Heart, Share2, Phone, Mail, MessageSquare, ArrowLeft, Home as HomeIcon, CheckCircle } from 'lucide-react';

const PropertyDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('Hello, I am interested in this property and would like to receive more details.');
  const [similarProperties, setSimilarProperties] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties/${slug}`);
        setProperty(data);
        setActiveImage(data.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');

        // Check if user has this property in favorites
        if (userInfo && userInfo.favorites) {
          setIsFavorite(userInfo.favorites.some(favId => favId._id === data._id || favId === data._id));
        }

        // Fetch similar properties
        const res = await api.get(`/properties?city=${data.city}&propertyType=${data.propertyType}`);
        setSimilarProperties(res.data.properties.filter(p => p._id !== data._id && p.approved));
      } catch (error) {
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [slug, userInfo]);

  const handleFavoriteToggle = async () => {
    if (!userInfo) {
      toast.warning('Please login to add to favorites');
      return navigate('/login');
    }

    try {
      const { data } = await api.post(`/auth/favorites/${property._id}`);
      setIsFavorite(data.isFavorite);
      
      // Update store favorites
      const updatedUser = { ...userInfo };
      if (data.isFavorite) {
        updatedUser.favorites = [...(userInfo.favorites || []), property._id];
      } else {
        updatedUser.favorites = (userInfo.favorites || []).filter(fav => (fav._id || fav) !== property._id);
      }
      dispatch(setCredentials(updatedUser));
      
      toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      toast.warning('Please login to send inquiries');
      return navigate('/login');
    }

    try {
      await api.post('/inquiries', {
        propertyId: property._id,
        message: inquiryMessage
      });
      toast.success('Inquiry sent successfully to vendor!');
      setInquiryMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send inquiry');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <HomeIcon size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Property Not Found</h2>
        <Link to="/properties" className="text-indigo-600 font-semibold mt-4 inline-block">Back to search</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-semibold mb-6 transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Side: Images & Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                For {property.listingType}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{property.title}</h1>
              <div className="flex items-center gap-1 text-gray-500 mt-2 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </div>
            </div>
            
            <div className="flex items-center md:flex-col items-end gap-3">
              <span className="text-3xl font-black text-indigo-600">${property.price.toLocaleString()}</span>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleFavoriteToggle} 
                  className={`p-2.5 rounded-xl border transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="space-y-3">
            <div className="h-[450px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
              <img src={activeImage} alt={property.title} className="w-full h-full object-cover transition-all" />
            </div>
            {property.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {property.images.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-indigo-600 scale-95' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Specs (Dynamic based on Property Type) */}
          {property.propertyType === 'Plot' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Property Type</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.plotType || 'Plot'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Facing</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.facing || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Corner Plot</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.cornerPlot ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Plot Area</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.area} {property.areaUnit || 'Sq. Ft.'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Property Type</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.propertyType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bedrooms</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.bedrooms || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bathrooms</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.bathrooms || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Area Size</p>
                <p className="text-lg font-extrabold text-gray-800 mt-1">{property.area} sqft</p>
              </div>
            </div>
          )}

          {/* Additional Plot Specs */}
          {property.propertyType === 'Plot' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-extrabold text-xl text-gray-900 mb-4">Plot Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex flex-col p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold mb-1">Dimensions (Length × Width)</span>
                  <span className="text-gray-800 font-extrabold text-base">
                    {property.plotLength && property.plotWidth ? `${property.plotLength} × ${property.plotWidth} Ft` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold mb-1">Road Width</span>
                  <span className="text-gray-800 font-extrabold text-base">{property.roadWidth ? `${property.roadWidth} Ft` : 'N/A'}</span>
                </div>
                <div className="flex flex-col p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-semibold mb-1">Corner Plot</span>
                  <span className="text-gray-800 font-extrabold text-base">{property.cornerPlot ? 'Yes, Premium Location' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-extrabold text-xl text-gray-900 mb-4">Property Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-extrabold text-xl text-gray-900 mb-4">Amenities Offered</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700 text-sm">
                    <CheckCircle size={16} className="text-indigo-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>

        {/* Right Side: Agent Info & Contact Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-extrabold text-lg text-gray-900 mb-4">Listed By</h3>
            
            {/* Vendor card */}
            {property.vendor ? (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl uppercase">
                  {property.vendor.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{property.vendor.name}</h4>
                  <p className="text-xs text-gray-400">Agent/Vendor Partner</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">Vendor information unavailable</p>
            )}

            <div className="space-y-3.5 mb-6 text-sm text-gray-600 border-t border-b border-gray-50 py-4">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>{property.vendor?.mobile || 'No contact number listed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>{property.vendor?.email || 'No email listed'}</span>
              </div>
            </div>

            {/* Inquiry Send Form */}
            <form onSubmit={handleSendInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Inquiry message</label>
                <textarea 
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                <MessageSquare size={18} /> Send Inquiry
              </button>
            </form>
          </div>

          {/* Similar properties */}
          {similarProperties.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-lg text-gray-900">Similar Listings</h3>
              <div className="space-y-4">
                {similarProperties.slice(0, 3).map((item) => (
                  <Link to={`/property/${item.slug}`} key={item._id} className="flex gap-3 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.city}</p>
                      <p className="text-sm font-black text-indigo-600 mt-1">${item.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
