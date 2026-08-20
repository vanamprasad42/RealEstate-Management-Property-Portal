import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { LayoutDashboard, Home as HomeIcon, MessageSquare, Plus, Edit2, Trash2, X, Upload, Loader } from 'lucide-react';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form local state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', propertyType: 'Apartment', listingType: 'sale',
    price: '', city: '', state: '', address: '',
    bedrooms: '', bathrooms: '', area: '', amenities: '', status: 'available',
    areaUnit: 'Sq. Ft.', plotLength: '', plotWidth: '', facing: 'East',
    cornerPlot: 'No', roadWidth: '', plotType: 'Residential Plot'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all properties
      const propsRes = await api.get(`/properties?vendorId=${userInfo._id}`);
      // Filter vendor's properties
      const myProps = propsRes.data.properties;
      setProperties(myProps);

      // Fetch vendor's inquiries
      const inqRes = await api.get('/inquiries/vendor');
      setInquiries(inqRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [userInfo, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrls = [];
      // Upload images if selected
      if (selectedImages.length > 0) {
        const uploadData = new FormData();
        for (const file of selectedImages) {
          uploadData.append('images', file);
        }
        const uploadRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrls = uploadRes.data.imageUrls;
      }

      const postData = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        images: imageUrls.length > 0 ? imageUrls : undefined
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
        postData.areaUnit = undefined;
        postData.plotLength = undefined;
        postData.plotWidth = undefined;
        postData.facing = undefined;
        postData.cornerPlot = undefined;
        postData.roadWidth = undefined;
        postData.plotType = undefined;
      }

      if (editMode) {
        await api.put(`/properties/${editId}`, postData);
        toast.success('Property updated successfully!');
      } else {
        await api.post('/properties', postData);
        toast.success('Property created successfully! Pending admin approval.');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save property');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (prop) => {
    setEditMode(true);
    setEditId(prop._id);
    setFormData({
      title: prop.title,
      description: prop.description,
      propertyType: prop.propertyType,
      listingType: prop.listingType,
      price: prop.price,
      city: prop.city,
      state: prop.state,
      address: prop.address,
      bedrooms: prop.bedrooms || '',
      bathrooms: prop.bathrooms || '',
      area: prop.area,
      amenities: prop.amenities.join(', '),
      status: prop.status,
      // Plot fields mapping
      areaUnit: prop.areaUnit || 'Sq. Ft.',
      plotLength: prop.plotLength || '',
      plotWidth: prop.plotWidth || '',
      facing: prop.facing || 'East',
      cornerPlot: prop.cornerPlot === true ? 'Yes' : 'No',
      roadWidth: prop.roadWidth || '',
      plotType: prop.plotType || 'Residential Plot'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        toast.success('Property deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete property');
      }
    }
  };

  const handleInquiryStatusChange = async (id, status) => {
    try {
      await api.put(`/inquiries/${id}`, { status });
      toast.success('Inquiry status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', propertyType: 'Apartment', listingType: 'sale',
      price: '', city: '', state: '', address: '',
      bedrooms: '', bathrooms: '', area: '', amenities: '', status: 'available',
      areaUnit: 'Sq. Ft.', plotLength: '', plotWidth: '', facing: 'East',
      cornerPlot: 'No', roadWidth: '', plotType: 'Residential Plot'
    });
    setSelectedImages([]);
    setEditMode(false);
    setEditId(null);
  };

  // Stats calculation
  const totalProperties = properties.length;
  const activeListings = properties.filter(p => p.approved && p.status === 'available').length;
  const pendingListings = properties.filter(p => !p.approved).length;
  const soldOrRented = properties.filter(p => p.status === 'sold' || p.status === 'rented').length;
  const totalInquiries = inquiries.length;

  if (loading && properties.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Vendor Control Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your property catalog and follow up on inquiries.</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 w-fit"
        >
          <Plus size={18} /> Add New Listing
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 mb-8 border-b pb-1">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <LayoutDashboard size={18} /> Dashboard Stats
        </button>
        <button 
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'properties' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <HomeIcon size={18} /> Manage Listings ({totalProperties})
        </button>
        <button 
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'inquiries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <MessageSquare size={18} /> Customer Inquiries ({totalInquiries})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Listings</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{totalProperties}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Listings</p>
              <p className="text-3xl font-black text-emerald-600 mt-2">{activeListings}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending Approval</p>
              <p className="text-3xl font-black text-amber-500 mt-2">{pendingListings}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sold / Rented</p>
              <p className="text-3xl font-black text-gray-700 mt-2">{soldOrRented}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center col-span-2 lg:col-span-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Leads</p>
              <p className="text-3xl font-black text-indigo-600 mt-2">{totalInquiries}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {properties.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <HomeIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p>You haven't listed any properties yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((prop) => (
                    <tr key={prop._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={prop.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-50" />
                          <span className="font-extrabold text-gray-900 line-clamp-1">{prop.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{prop.city}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">${prop.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${prop.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${prop.approved ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                          {prop.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(prop)} className="p-2 border rounded-lg text-gray-600 hover:text-indigo-600 transition-colors bg-white shadow-sm">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(prop._id)} className="p-2 border rounded-lg text-gray-600 hover:text-red-600 transition-colors bg-white shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No customer inquiries received yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">Lead Details</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inquiries.map((inq) => (
                    <tr key={inq._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-gray-950">{inq.user?.name}</p>
                          <p className="text-xs text-gray-400 font-medium">{inq.user?.email}</p>
                          <p className="text-xs text-gray-400 font-medium">{inq.user?.mobile}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {inq.property ? (
                          <Link to={`/property/${inq.property.slug}`} className="font-bold text-indigo-600 hover:underline">
                            {inq.property.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Deleted property</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{inq.message}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={inq.status}
                          onChange={(e) => handleInquiryStatusChange(inq._id, e.target.value)}
                          className={`text-xs font-bold rounded-full px-2.5 py-1 border focus:outline-none ${inq.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : inq.status === 'contacted' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Listing Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">{editMode ? 'Edit Listing Details' : 'Create New Listing'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Title</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. Premium 3BHK Penthouse with Pool View" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea name="description" rows={3} required value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="Detailed property descriptions, locality highlights..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Type</label>
                  <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="House">House</option>
                    <option value="Plot">Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Listing Intent</label>
                  <select name="listingType" value={formData.listingType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="Total selling price or monthly rent" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {formData.propertyType === 'Plot' ? 'Plot Area' : 'Area Size (sqft)'}
                  </label>
                  <input type="number" name="area" required value={formData.area} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder={formData.propertyType === 'Plot' ? "e.g. 300" : "e.g. 1850"} />
                </div>

                {formData.propertyType === 'Plot' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Type</label>
                      <select name="plotType" value={formData.plotType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="Residential Plot">Residential Plot</option>
                        <option value="Commercial Plot">Commercial Plot</option>
                        <option value="Farm Land">Farm Land</option>
                        <option value="Industrial Plot">Industrial Plot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Area Unit</label>
                      <select name="areaUnit" value={formData.areaUnit} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="Sq. Yards">Sq. Yards</option>
                        <option value="Sq. Ft.">Sq. Ft.</option>
                        <option value="Acres">Acres</option>
                        <option value="Cents">Cents</option>
                        <option value="Gunta">Gunta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Length (ft/yards)</label>
                      <input type="number" name="plotLength" value={formData.plotLength} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. 50" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Width (ft/yards)</label>
                      <input type="number" name="plotWidth" value={formData.plotWidth} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. 30" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Facing</label>
                      <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Corner Plot</label>
                      <select name="cornerPlot" value={formData.cornerPlot} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Road Width (ft)</label>
                      <input type="number" name="roadWidth" value={formData.roadWidth} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. 30" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bedrooms</label>
                      <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. 3" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bathrooms</label>
                      <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. 2" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. Mumbai" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State</label>
                  <input type="text" name="state" required value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="e.g. Maharashtra" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="Detailed street address location" />
                </div>



                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amenities (Comma separated values)</label>
                  <input type="text" name="amenities" value={formData.amenities} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="Swimming Pool, Modular Kitchen, Gymnasium, 24/7 Security" />
                </div>

                {editMode && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Availability Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Upload Images (Up to 5)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="text-sm" />
                    {selectedImages.length > 0 && <p className="text-xs text-indigo-600 font-semibold mt-2">{selectedImages.length} files selected</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm">
                  {uploading ? <><Loader className="animate-spin" size={16} /> Saving Property...</> : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
