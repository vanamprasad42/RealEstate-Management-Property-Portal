import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Home, Upload, Image as ImageIcon, CheckCircle, Plus, Loader, ArrowLeft } from 'lucide-react';

const AddProperty = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'Apartment',
    listingType: 'sale',
    price: '',
    city: '',
    state: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    amenities: '',
    areaUnit: 'Sq. Ft.',
    plotLength: '',
    plotWidth: '',
    facing: 'East',
    cornerPlot: 'No',
    roadWidth: '',
    plotType: 'Residential Plot'
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [serverFiles, setServerFiles] = useState([]);
  const [selectedServerFiles, setSelectedServerFiles] = useState([]);
  const [loadingServerFiles, setLoadingServerFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState('upload'); // 'upload' | 'server'

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchServerFiles();
  }, [userInfo, navigate]);

  const fetchServerFiles = async () => {
    setLoadingServerFiles(true);
    try {
      const res = await api.get('/upload/files');
      setServerFiles(res.data.files || []);
    } catch (error) {
      console.error('Failed to load server files', error);
    } finally {
      setLoadingServerFiles(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const toggleServerFileSelection = (url) => {
    if (selectedServerFiles.includes(url)) {
      setSelectedServerFiles(selectedServerFiles.filter(item => item !== url));
    } else {
      setSelectedServerFiles([...selectedServerFiles, url]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrls = [...selectedServerFiles];

      // Upload local images if selected
      if (selectedImages.length > 0) {
        const uploadData = new FormData();
        for (const file of selectedImages) {
          uploadData.append('images', file);
        }
        const uploadRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.imageUrls) {
          imageUrls = [...imageUrls, ...uploadRes.data.imageUrls];
        }
      }

      // Default fallback placeholder if no image selected
      if (imageUrls.length === 0) {
        imageUrls.push('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80');
      }

      const postData = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
        images: imageUrls
      };

      if (formData.propertyType === 'Plot') {
        postData.bedrooms = undefined;
        postData.bathrooms = undefined;
        postData.areaUnit = formData.areaUnit;
        postData.plotLength = formData.plotLength ? Number(formData.plotLength) : undefined;
        postData.plotWidth = formData.plotWidth ? Number(formData.plotWidth) : undefined;
        postData.facing = formData.facing;
        postData.cornerPlot = formData.cornerPlot === 'Yes';
        postData.roadWidth = formData.roadWidth ? Number(formData.roadWidth) : undefined;
        postData.plotType = formData.plotType;
      } else {
        postData.bedrooms = formData.bedrooms ? Number(formData.bedrooms) : undefined;
        postData.bathrooms = formData.bathrooms ? Number(formData.bathrooms) : undefined;
      }

      await api.post('/properties', postData);
      toast.success('Property submitted successfully! It will be published on the webpage once verified by an admin.');
      navigate('/vendor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/vendor/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-3 pb-6 mb-8 border-b">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Home size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Post New Property Listing</h1>
            <p className="text-gray-500 text-sm">Fill in property details and add images to showcase your real estate.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="e.g. Modern 3BHK Luxury Apartment with Ocean View"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description *</label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Detailed highlights, neighborhood details, proximity to amenities..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property Type *</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Plot">Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Listing Intent *</label>
              <select
                name="listingType"
                value={formData.listingType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Price ($) *</label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Total selling price or monthly rent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {formData.propertyType === 'Plot' ? 'Plot Area *' : 'Area Size (sqft) *'}
              </label>
              <input
                type="number"
                name="area"
                required
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder={formData.propertyType === 'Plot' ? "e.g. 300" : "e.g. 1850"}
              />
            </div>

            {formData.propertyType === 'Plot' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Plot Type</label>
                  <select name="plotType" value={formData.plotType} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none">
                    <option value="Residential Plot">Residential Plot</option>
                    <option value="Commercial Plot">Commercial Plot</option>
                    <option value="Farm Land">Farm Land</option>
                    <option value="Industrial Plot">Industrial Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Area Unit</label>
                  <select name="areaUnit" value={formData.areaUnit} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none">
                    <option value="Sq. Yards">Sq. Yards</option>
                    <option value="Sq. Ft.">Sq. Ft.</option>
                    <option value="Acres">Acres</option>
                    <option value="Cents">Cents</option>
                    <option value="Gunta">Gunta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Plot Length (ft/yards)</label>
                  <input type="number" name="plotLength" value={formData.plotLength} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. 50" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Plot Width (ft/yards)</label>
                  <input type="number" name="plotWidth" value={formData.plotWidth} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. 30" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Facing</label>
                  <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Corner Plot</label>
                  <select name="cornerPlot" value={formData.cornerPlot} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. 3" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. 2" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">City *</label>
              <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. Mumbai" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">State *</label>
              <input type="text" name="state" required value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="e.g. Maharashtra" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Street Address *</label>
              <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="Street address or locality details" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Amenities (Comma Separated)</label>
              <input type="text" name="amenities" value={formData.amenities} onChange={handleInputChange} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl" placeholder="Swimming Pool, Gymnasium, 24/7 Power Backup, Parking" />
            </div>
          </div>

          {/* Image Selection Section */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Property Images</h3>

            <div className="flex gap-4 mb-4 border-b pb-2">
              <button
                type="button"
                onClick={() => setActiveImageTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${activeImageTab === 'upload' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Upload size={16} /> Upload New Files
              </button>
              <button
                type="button"
                onClick={() => setActiveImageTab('server')}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${activeImageTab === 'server' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <ImageIcon size={16} /> Select From Server Files ({serverFiles.length})
              </button>
            </div>

            {activeImageTab === 'upload' && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 text-center">
                <Upload className="text-indigo-500 mb-2" size={32} />
                <p className="text-sm font-bold text-gray-700">Click to choose image files</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Upload up to 5 PNG, JPG, or WEBP photos</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
                {selectedImages.length > 0 && (
                  <p className="text-xs text-emerald-600 font-bold mt-3">
                    {selectedImages.length} image(s) ready to upload
                  </p>
                )}
              </div>
            )}

            {activeImageTab === 'server' && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                {loadingServerFiles ? (
                  <div className="flex justify-center py-6">
                    <Loader className="animate-spin text-indigo-600" size={24} />
                  </div>
                ) : serverFiles.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No uploaded files currently stored on the server.</p>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-3">Select any existing server file images to attach:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
                      {serverFiles.map((url, idx) => {
                        const isSelected = selectedServerFiles.includes(url);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleServerFileSelection(url)}
                            className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-all h-24 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/30' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <img src={url} alt={`Server file ${idx}`} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                                <CheckCircle className="text-white fill-indigo-600" size={24} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedServerFiles.length > 0 && (
                      <p className="text-xs text-indigo-600 font-bold mt-3">
                        {selectedServerFiles.length} server image(s) selected
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/vendor/dashboard')}
              className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 text-sm shadow-md shadow-indigo-600/20"
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={18} /> Submitting...
                </>
              ) : (
                <>
                  <Plus size={18} /> Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
