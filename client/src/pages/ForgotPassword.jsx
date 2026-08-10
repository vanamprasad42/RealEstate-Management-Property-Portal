import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevLink('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Password reset link sent to your email.');
      if (data.devLink) {
        setDevLink(data.devLink);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeDevPath = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100"
      >
        <Link to="/login" className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 font-semibold mb-6 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h2>
        <p className="text-gray-500 text-sm mb-6">No worries, enter your account email address below and we'll send you a password reset link.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        {devLink && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-left"
          >
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1">
              <ShieldAlert size={18} className="text-indigo-600" />
              Dev Mode Reset Link
            </div>
            <p className="text-xs text-indigo-700 mb-3">
              If email delivery was skipped or delayed, you can use the generated reset link directly:
            </p>
            <Link 
              to={getRelativeDevPath(devLink)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Reset Password Now <ExternalLink size={14} />
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
