import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { Home, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Home size={28} />
              <span>RealEstate</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/properties" className="text-gray-700 hover:text-primary transition-colors font-medium">Properties</Link>
            <Link to="/cities" className="text-gray-700 hover:text-primary transition-colors font-medium">Cities</Link>

            {userInfo ? (
              <div className="flex items-center gap-4">
                {userInfo.role === 'vendor' && (
                  <Link to="/vendor/dashboard" className="text-gray-700 hover:text-primary transition-colors font-medium">Dashboard</Link>
                )}
                {userInfo.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary transition-colors font-medium">Admin</Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium">
                    <UserIcon size={20} />
                    {userInfo.name}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-700 hover:text-primary transition-colors font-medium">Login</Link>
                <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">Register</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Sliding Mobile Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 md:hidden flex flex-col p-6 border-l border-gray-100"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-primary font-bold text-xl">
                  <Home size={24} />
                  <span>RealEstate</span>
                </Link>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-primary transition-colors p-1" aria-label="Close menu">
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-4 flex-grow">
                <Link to="/properties" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-lg font-semibold text-gray-700 hover:text-primary transition-colors border-b border-gray-50">
                  Properties
                </Link>
                <Link to="/cities" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-lg font-semibold text-gray-700 hover:text-primary transition-colors border-b border-gray-50">
                  Cities
                </Link>
                
                {userInfo ? (
                  <>
                    {userInfo.role === 'vendor' && (
                      <Link to="/vendor/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-lg font-semibold text-gray-700 hover:text-primary transition-colors border-b border-gray-50">
                        Dashboard
                      </Link>
                    )}
                    {userInfo.role === 'admin' && (
                      <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-lg font-semibold text-gray-700 hover:text-primary transition-colors border-b border-gray-50">
                        Admin
                      </Link>
                    )}
                    <div className="mt-auto pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600 font-medium text-sm mb-4 px-3">
                        <UserIcon size={16} />
                        <span>{userInfo.name} ({userInfo.role})</span>
                      </div>
                      <button 
                        onClick={() => { handleLogout(); setIsOpen(false); }} 
                        className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <Link 
                      to="/login" 
                      onClick={() => setIsOpen(false)} 
                      className="flex items-center justify-center w-full border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setIsOpen(false)} 
                      className="flex items-center justify-center w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
