import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP state
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.requiresOtp) {
        setRequiresOtp(true);
        toast.info('Verification OTP sent to your email!');
      } else {
        // Fallback if OTP is disabled on backend
        dispatch(setCredentials(data));
        toast.success('Login Successful');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('OTP must be exactly 6 digits');
    }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      dispatch(setCredentials(data));
      toast.success('Verification successful! Welcome back.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <AnimatePresence mode="wait">
        {!requiresOtp ? (
          // Login Form Card
          <motion.div 
            key="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Welcome Back</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required 
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </form>
            <div className="flex flex-col gap-2 mt-6 text-center text-sm text-gray-600">
              <Link to="/forgot-password" className="text-primary hover:underline font-semibold">Forgot Password?</Link>
              <p>
                Don't have an account? <Link to="/register" className="text-primary hover:underline font-extrabold">Register here</Link>
              </p>
            </div>
          </motion.div>
        ) : (
          // OTP Entry Card
          <motion.div 
            key="otp-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100"
          >
            <button 
              onClick={() => setRequiresOtp(false)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 font-semibold mb-6 text-xs transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">Enter verification code</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              We emailed a 6-digit OTP to <strong className="text-gray-800">{email}</strong>. Enter it below to complete verification.
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Verification Code (OTP)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm tracking-[0.2em] font-mono text-center font-bold"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={otpLoading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {otpLoading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
