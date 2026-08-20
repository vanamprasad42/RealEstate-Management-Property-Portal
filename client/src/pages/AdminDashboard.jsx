import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setAdminRequest, 
  setAdminUsersSuccess, 
  setAdminVendorsSuccess, 
  setAdminReportsSuccess, 
  setAdminFail,
  toggleUserBlockSuccess,
  deleteUserSuccess
} from '../redux/slices/adminSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  Users, Building, ShieldAlert, BarChart3, Trash2, ShieldCheck, MapPin, X, Plus, Loader, 
  Edit2, Search, Filter, Home as HomeIcon, Upload, CheckCircle, XCircle, ExternalLink 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  const { users, vendors, reports, loading } = useSelector((state) => state.admin);
  
  const [activeTab, setActiveTab] = useState('all-properties');
  
  // All Properties state for Admin
  const [allProperties, setAllProperties] = useState([]);
  const [allPropsLoading, setAllPropsLoading] = useState(false);

  // Search & Filtering state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState('');
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState('');

  // Property moderation queue
  const [pendingProperties, setPendingProperties] = useState([]);
  const [modLoading, setModLoading] = useState(false);

  // City CRUD local states
  const [cities, setCities] = useState([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCity, setNewCity] = useState({ cityName: '', stateName: '', slug: '', image: '' });

  // Admin Edit Property Modal State
  const [showPropModal, setShowPropModal] = useState(false);
  const [editPropId, setEditPropId] = useState(null);
  const [editPropForm, setEditPropForm] = useState({
    title: '', description: '', propertyType: 'Apartment', listingType: 'sale',
    price: '', city: '', state: '', address: '',
    bedrooms: '', bathrooms: '', area: '', amenities: '', status: 'available', approved: true,
    areaUnit: 'Sq. Ft.', plotLength: '', plotWidth: '', facing: 'East',
    cornerPlot: 'No', roadWidth: '', plotType: 'Residential Plot'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchAdminData = async () => {
    dispatch(setAdminRequest());
    try {
      // 1. Fetch Users
      const usersRes = await api.get('/admin/users');
      dispatch(setAdminUsersSuccess(usersRes.data));

      // 2. Fetch Vendors
      const vendorsRes = await api.get('/admin/vendors');
      dispatch(setAdminVendorsSuccess(vendorsRes.data));

      // 3. Fetch Reports
      const reportsRes = await api.get('/admin/reports');
      dispatch(setAdminReportsSuccess(reportsRes.data));
    } catch (error) {
      dispatch(setAdminFail(error.response?.data?.message || error.message));
    }
  };

  const fetchAllProperties = async () => {
    setAllPropsLoading(true);
    try {
      const { data } = await api.get('/properties?approved=all&pageSize=all');
      setAllProperties(data.properties || []);
    } catch (error) {
      toast.error('Failed to load all properties catalog');
    } finally {
      setAllPropsLoading(false);
    }
  };

  const fetchPendingProperties = async () => {
    setModLoading(true);
    try {
      const { data } = await api.get('/properties?approved=false');
      setPendingProperties(data.properties || []);
    } catch (error) {
      toast.error('Failed to load pending properties');
    } finally {
      setModLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data);
    } catch (error) {
      toast.error('Failed to load cities');
    }
  };

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdminData();
    fetchAllProperties();
    fetchPendingProperties();
    fetchCities();
  }, [userInfo, navigate]);

  const handleBlockToggle = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/block`);
      dispatch(toggleUserBlockSuccess({ user: data.user }));
      toast.success(data.message);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to toggle block status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this account permanently?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        dispatch(deleteUserSuccess(userId));
        toast.success('Account deleted successfully');
        fetchAdminData();
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleApproveProperty = async (id, approveState) => {
    try {
      await api.put(`/admin/property-approval/${id}`, { approved: approveState });
      toast.success(approveState ? 'Listing Approved & Live!' : 'Listing Unapproved');
      fetchAllProperties();
      fetchPendingProperties();
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update listing approval status');
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property listing permanently?')) {
      try {
        await api.delete(`/properties/${id}`);
        toast.success('Property deleted successfully');
        fetchAllProperties();
        fetchPendingProperties();
        fetchAdminData();
      } catch (error) {
        toast.error('Failed to delete property');
      }
    }
  };

  // Edit Property Handlers
  const handleEditPropertyClick = (prop) => {
    setEditPropId(prop._id);
    setEditPropForm({
      title: prop.title || '',
      description: prop.description || '',
      propertyType: prop.propertyType || 'Apartment',
      listingType: prop.listingType || 'sale',
      price: prop.price || '',
      city: prop.city || '',
      state: prop.state || '',
      address: prop.address || '',
      bedrooms: prop.bedrooms || '',
      bathrooms: prop.bathrooms || '',
      area: prop.area || '',
      amenities: Array.isArray(prop.amenities) ? prop.amenities.join(', ') : '',
      status: prop.status || 'available',
      approved: prop.approved ?? true,
      areaUnit: prop.areaUnit || 'Sq. Ft.',
      plotLength: prop.plotLength || '',
      plotWidth: prop.plotWidth || '',
      facing: prop.facing || 'East',
      cornerPlot: prop.cornerPlot ? 'Yes' : 'No',
      roadWidth: prop.roadWidth || '',
      plotType: prop.plotType || 'Residential Plot'
    });
    setSelectedImages([]);
    setShowPropModal(true);
  };

  const handlePropFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditPropForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePropModalSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrls = [];
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
        ...editPropForm,
        price: Number(editPropForm.price),
        area: Number(editPropForm.area),
        approved: editPropForm.approved,
        amenities: typeof editPropForm.amenities === 'string'
          ? editPropForm.amenities.split(',').map(a => a.trim()).filter(Boolean)
          : editPropForm.amenities,
      };

      if (imageUrls.length > 0) {
        postData.images = imageUrls;
      }

      if (editPropForm.propertyType === 'Plot') {
        postData.bedrooms = undefined;
        postData.bathrooms = undefined;
        postData.plotLength = editPropForm.plotLength ? Number(editPropForm.plotLength) : undefined;
        postData.plotWidth = editPropForm.plotWidth ? Number(editPropForm.plotWidth) : undefined;
        postData.cornerPlot = editPropForm.cornerPlot === 'Yes';
        postData.roadWidth = editPropForm.roadWidth ? Number(editPropForm.roadWidth) : undefined;
      } else {
        postData.bedrooms = editPropForm.bedrooms ? Number(editPropForm.bedrooms) : undefined;
        postData.bathrooms = editPropForm.bathrooms ? Number(editPropForm.bathrooms) : undefined;
      }

      await api.put(`/properties/${editPropId}`, postData);
      toast.success('Property updated successfully by Admin!');
      setShowPropModal(false);
      fetchAllProperties();
      fetchPendingProperties();
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update property');
    } finally {
      setUploading(false);
    }
  };

  // City Management Handlers
  const handleCityCreate = async (e) => {
    e.preventDefault();
    try {
      const generatedSlug = newCity.cityName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      await api.post('/cities', {
        ...newCity,
        slug: newCity.slug || generatedSlug
      });
      toast.success('City added successfully');
      setShowCityModal(false);
      setNewCity({ cityName: '', stateName: '', slug: '', image: '' });
      fetchCities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add city');
    }
  };

  const handleCityDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this city?')) {
      try {
        await api.delete(`/cities/${id}`);
        toast.success('City removed');
        fetchCities();
      } catch (error) {
        toast.error('Failed to remove city');
      }
    }
  };

  // Filtered Properties for All-Properties tab
  const filteredProperties = allProperties.filter((prop) => {
    const matchesKeyword = searchKeyword === '' || 
      prop.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      prop.city?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      prop.address?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      prop.vendor?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      prop.vendor?.email?.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesCity = !selectedCityFilter || prop.city?.toLowerCase() === selectedCityFilter.toLowerCase();
    const matchesCategory = !selectedCategoryFilter || prop.propertyType === selectedCategoryFilter;
    const matchesIntent = !selectedIntentFilter || prop.listingType === selectedIntentFilter;
    const matchesApproval = !selectedApprovalFilter || 
      (selectedApprovalFilter === 'approved' && prop.approved) ||
      (selectedApprovalFilter === 'pending' && !prop.approved);

    return matchesKeyword && matchesCity && matchesCategory && matchesIntent && matchesApproval;
  });

  // Extract unique cities list for filter dropdown
  const uniqueCities = Array.from(new Set([
    ...cities.map(c => c.cityName),
    ...allProperties.map(p => p.city)
  ].filter(Boolean)));

  if (loading && !reports) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="mb-8 pb-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Administrator Control Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage location-wise & category-wise properties, review approvals, users, and analytics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b pb-1">
        <button 
          onClick={() => setActiveTab('all-properties')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${activeTab === 'all-properties' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <HomeIcon size={18} /> All Properties Catalog ({allProperties.length})
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${activeTab === 'moderation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <ShieldAlert size={18} /> Approvals Queue ({pendingProperties.length})
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <BarChart3 size={18} /> Analytics & Reports
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={18} /> Users & Vendors
        </button>
        <button 
          onClick={() => setActiveTab('cities')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${activeTab === 'cities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <MapPin size={18} /> City Settings
        </button>
      </div>

      {/* ALL PROPERTIES CATALOG (LOCATION & CATEGORY WISE + EDIT/DELETE) */}
      {activeTab === 'all-properties' && (
        <div className="space-y-6">
          {/* Filters and Search Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by title, location, address, vendor..." 
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                <span>Showing {filteredProperties.length} of {allProperties.length} total properties</span>
              </div>
            </div>

            {/* Location & Category Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              {/* Location-Wise Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Location (City-Wise)
                </label>
                <select 
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-gray-700"
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                >
                  <option value="">All Locations / Cities</option>
                  {uniqueCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Category-Wise Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Category (Type-Wise)
                </label>
                <select 
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-gray-700"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="House">House</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>

              {/* Listing Intent Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Listing Intent
                </label>
                <select 
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-gray-700"
                  value={selectedIntentFilter}
                  onChange={(e) => setSelectedIntentFilter(e.target.value)}
                >
                  <option value="">All (Sale & Rent)</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              {/* Approval Status Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Approval Status
                </label>
                <select 
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-gray-700"
                  value={selectedApprovalFilter}
                  onChange={(e) => setSelectedApprovalFilter(e.target.value)}
                >
                  <option value="">All Approval Statuses</option>
                  <option value="approved">Approved & Live</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {allPropsLoading ? (
              <div className="p-12 text-center">
                <Loader className="animate-spin text-indigo-600 mx-auto" size={36} />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <HomeIcon size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700">No properties match your filter criteria</h3>
                <p className="text-xs text-gray-400 mt-1">Try resetting search keywords or location/category filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                    <tr>
                      <th className="px-6 py-4">Property</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProperties.map((prop) => (
                      <tr key={prop._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={prop.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80'} 
                              alt="" 
                              className="w-12 h-12 object-cover rounded-lg bg-gray-50 border" 
                            />
                            <div>
                              <span className="font-extrabold text-gray-900 line-clamp-1 flex items-center gap-1.5">
                                {prop.title}
                                {prop.slug && (
                                  <Link to={`/property/${prop.slug}`} target="_blank" className="text-indigo-600 hover:text-indigo-800">
                                    <ExternalLink size={13} />
                                  </Link>
                                )}
                              </span>
                              <p className="text-xs text-gray-400 font-medium line-clamp-1">{prop.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-800 capitalize">
                            {prop.propertyType} ({prop.listingType})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-gray-800">{prop.city}</p>
                          <p className="text-xs text-gray-400">{prop.state}</p>
                        </td>
                        <td className="px-6 py-4 font-black text-indigo-600">
                          ${prop.price?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 text-xs">{prop.vendor?.name || 'Admin'}</p>
                          <p className="text-[11px] text-gray-400">{prop.vendor?.email || 'System'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full w-max ${prop.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {prop.approved ? 'Live / Approved' : 'Pending Approval'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold capitalize">
                              {prop.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Toggle Approval button */}
                            <button 
                              onClick={() => handleApproveProperty(prop._id, !prop.approved)}
                              title={prop.approved ? "Unapprove property" : "Approve property"}
                              className={`p-2 rounded-lg text-xs font-bold transition-colors ${prop.approved ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                              {prop.approved ? <XCircle size={15} /> : <CheckCircle size={15} />}
                            </button>

                            {/* Edit Property Button */}
                            <button 
                              onClick={() => handleEditPropertyClick(prop)}
                              title="Edit property details"
                              className="p-2 border rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors bg-white shadow-sm"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Delete Property Button */}
                            <button 
                              onClick={() => handleDeleteProperty(prop._id)}
                              title="Delete property"
                              className="p-2 border rounded-lg text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors bg-white shadow-sm"
                            >
                              <Trash2 size={15} />
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
        </div>
      )}

      {/* Analytics Reports */}
      {activeTab === 'analytics' && reports && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Listings</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{reports.totalListings}</p>
              <div className="flex justify-center gap-4 text-xs text-gray-500 mt-3 font-semibold">
                <span className="text-emerald-600">{reports.activeListings} Active</span>
                <span className="text-amber-500">{reports.pendingListings} Pending</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Verified Vendors</p>
              <p className="text-4xl font-black text-indigo-600 mt-2">{reports.totalVendors}</p>
              <p className="text-xs text-gray-400 mt-3">Active service providers</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Registered Buyers</p>
              <p className="text-4xl font-black text-purple-600 mt-2">{reports.totalUsers}</p>
              <p className="text-xs text-gray-400 mt-3">End-consumer user accounts</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estimated Revenue</p>
              <p className="text-4xl font-black text-emerald-600 mt-2">{reports.revenue?.formattedRevenue || '$0'}</p>
              <p className="text-xs text-gray-400 mt-3">Based on vendor subscriptions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* City Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2">
              <h3 className="font-extrabold text-lg text-gray-900 mb-4">City-Wise Properties Distribution</h3>
              {reports.cityWise?.length === 0 ? (
                <p className="text-sm text-gray-500">No location listings distribution data available.</p>
              ) : (
                <div className="space-y-4">
                  {reports.cityWise?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700 capitalize">{item.city || 'Other'}</span>
                      <div className="flex items-center gap-3 w-2/3">
                        <div className="bg-gray-100 h-2.5 rounded-full w-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (item.count / reports.totalListings) * 100)}%` }}></div>
                        </div>
                        <span className="font-bold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {modLoading ? (
            <div className="p-12 text-center">
              <Loader className="animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : pendingProperties.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="font-bold text-gray-800 text-lg">Moderation queue clear</h3>
              <p className="text-sm text-gray-400 mt-1">All properties have been verified and approved.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Vendor Email</th>
                    <th className="px-6 py-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingProperties.map((prop) => (
                    <tr key={prop._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={prop.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-50" />
                          <span className="font-bold text-gray-900 line-clamp-1">{prop.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{prop.city}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">${prop.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">{prop.vendor?.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveProperty(prop._id, true)} className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                            Approve
                          </button>
                          <button onClick={() => handleApproveProperty(prop._id, false)} className="bg-red-50 text-red-600 text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            Reject
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

      {/* Users & Vendors Management */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Vendors */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-extrabold text-lg text-gray-900">Vendors / Real Estate Agents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-extrabold text-gray-900">{vendor.name}</td>
                      <td className="px-6 py-4 text-gray-600">{vendor.email}</td>
                      <td className="px-6 py-4 text-gray-600">{vendor.mobile}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleBlockToggle(vendor._id)} 
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${vendor.isBlocked ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            {vendor.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button onClick={() => handleDeleteUser(vendor._id)} className="p-2 border rounded-lg text-gray-600 hover:text-red-600 transition-colors bg-white shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buyers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-extrabold text-lg text-gray-900">Registered Buyers / Customers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-extrabold text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{user.mobile}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleBlockToggle(user._id)} 
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${user.isBlocked ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button onClick={() => handleDeleteUser(user._id)} className="p-2 border rounded-lg text-gray-600 hover:text-red-600 transition-colors bg-white shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* City Settings CRUD */}
      {activeTab === 'cities' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Supported Cities Catalog</h3>
              <p className="text-xs text-gray-500">Configure regions that show up in user filters and the Popular Cities grid.</p>
            </div>
            
            <button 
              onClick={() => { setShowCityModal(true); }}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
            >
              <Plus size={16} /> Add Popular City
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b">
                  <tr>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">State</th>
                    <th className="px-6 py-4">URL Slug</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cities.map((city) => (
                    <tr key={city._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-gray-950 flex items-center gap-3">
                        <img src={city.image || 'https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} alt="" className="w-10 h-7 object-cover rounded" />
                        <span>{city.cityName}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{city.stateName}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">/city/{city.slug}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleCityDelete(city._id)} className="p-2 border rounded-lg text-gray-500 hover:text-red-600 transition-colors bg-white shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Property Modal */}
      {showPropModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPropModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Admin Edit Property Listing</h2>

            <form onSubmit={handlePropModalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Title</label>
                  <input type="text" name="title" required value={editPropForm.title} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea name="description" rows={3} required value={editPropForm.description} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Type (Category)</label>
                  <select name="propertyType" value={editPropForm.propertyType} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="House">House</option>
                    <option value="Plot">Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Listing Intent</label>
                  <select name="listingType" value={editPropForm.listingType} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input type="number" name="price" required value={editPropForm.price} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {editPropForm.propertyType === 'Plot' ? 'Plot Area' : 'Area Size (sqft)'}
                  </label>
                  <input type="number" name="area" required value={editPropForm.area} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                {editPropForm.propertyType === 'Plot' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Type</label>
                      <select name="plotType" value={editPropForm.plotType} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="Residential Plot">Residential Plot</option>
                        <option value="Commercial Plot">Commercial Plot</option>
                        <option value="Farm Land">Farm Land</option>
                        <option value="Industrial Plot">Industrial Plot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Area Unit</label>
                      <select name="areaUnit" value={editPropForm.areaUnit} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="Sq. Yards">Sq. Yards</option>
                        <option value="Sq. Ft.">Sq. Ft.</option>
                        <option value="Acres">Acres</option>
                        <option value="Cents">Cents</option>
                        <option value="Gunta">Gunta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Length</label>
                      <input type="number" name="plotLength" value={editPropForm.plotLength} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plot Width</label>
                      <input type="number" name="plotWidth" value={editPropForm.plotWidth} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Facing</label>
                      <select name="facing" value={editPropForm.facing} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Corner Plot</label>
                      <select name="cornerPlot" value={editPropForm.cornerPlot} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Road Width (ft)</label>
                      <input type="number" name="roadWidth" value={editPropForm.roadWidth} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bedrooms</label>
                      <input type="number" name="bedrooms" value={editPropForm.bedrooms} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bathrooms</label>
                      <input type="number" name="bathrooms" value={editPropForm.bathrooms} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City (Location)</label>
                  <input type="text" name="city" required value={editPropForm.city} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State</label>
                  <input type="text" name="state" required value={editPropForm.state} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input type="text" name="address" required value={editPropForm.address} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amenities (Comma separated)</label>
                  <input type="text" name="amenities" value={editPropForm.amenities} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Availability Status</label>
                  <select name="status" value={editPropForm.status} onChange={handlePropFormChange} className="w-full px-3 py-2 text-sm border rounded-xl bg-white">
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Admin Live Approval</label>
                  <select name="approved" value={editPropForm.approved ? 'true' : 'false'} onChange={(e) => setEditPropForm({ ...editPropForm, approved: e.target.value === 'true' })} className="w-full px-3 py-2 text-sm border rounded-xl bg-white font-bold text-indigo-600">
                    <option value="true">Approved & Live</option>
                    <option value="false">Pending Approval</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Upload Replacement Images (Optional)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <input type="file" multiple accept="image/*" onChange={(e) => setSelectedImages([...e.target.files])} className="text-sm" />
                    {selectedImages.length > 0 && <p className="text-xs text-indigo-600 font-semibold mt-2">{selectedImages.length} new files selected</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowPropModal(false)} className="px-5 py-2.5 border rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm">
                  {uploading ? <><Loader className="animate-spin" size={16} /> Saving Changes...</> : 'Save Property Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-gray-100">
            <button onClick={() => setShowCityModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Add New Popular City</h2>

            <form onSubmit={handleCityCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                  value={newCity.cityName}
                  onChange={(e) => setNewCity({ ...newCity, cityName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                  value={newCity.stateName}
                  onChange={(e) => setNewCity({ ...newCity, stateName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City URL Slug (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. mumbai"
                  className="w-full px-3 py-2 text-sm border rounded-xl font-mono"
                  value={newCity.slug}
                  onChange={(e) => setNewCity({ ...newCity, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Banner Image (Cloudinary or Direct URL)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                  value={newCity.image}
                  onChange={(e) => setNewCity({ ...newCity, image: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCityModal(false)} className="px-4 py-2 border rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-sm">
                  Add City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
