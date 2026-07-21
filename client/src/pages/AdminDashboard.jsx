import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Users, Building, ShieldAlert, BarChart3, Trash2, ShieldCheck, MapPin, X, Plus, Loader } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  const { users, vendors, reports, loading } = useSelector((state) => state.admin);
  
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Property moderation queue
  const [pendingProperties, setPendingProperties] = useState([]);
  const [modLoading, setModLoading] = useState(false);

  // City CRUD local states
  const [cities, setCities] = useState([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCity, setNewCity] = useState({ cityName: '', stateName: '', slug: '', image: '' });

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

  const fetchPendingProperties = async () => {
    setModLoading(true);
    try {
      const { data } = await api.get('/properties?approved=false');
      // Show both approved and pending, but filter to pending for moderation
      const pending = data.properties;
      setPendingProperties(pending);
    } catch (error) {
      toast.error('Failed to load properties');
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
      toast.success(approveState ? 'Listing Approved!' : 'Listing Rejected');
      fetchPendingProperties();
      fetchAdminData(); // refresh stats
    } catch (error) {
      toast.error('Failed to update listing approval status');
    }
  };

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
      <div className="mb-10 pb-6 border-b">
        <h1 className="text-3xl font-black text-gray-900">Administrator Console</h1>
        <p className="text-gray-500 text-sm mt-1">Review operational analytics, moderate listings, and manage configurations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b pb-1">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <BarChart3 size={18} /> Analytics & Reports
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'moderation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <ShieldAlert size={18} /> Approvals Queue ({pendingProperties.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={18} /> Users & Vendors
        </button>
        <button 
          onClick={() => setActiveTab('cities')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold text-sm transition-all ${activeTab === 'cities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <MapPin size={18} /> City Settings
        </button>
      </div>

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
