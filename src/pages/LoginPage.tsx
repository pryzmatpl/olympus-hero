import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { isAxiosError } from 'axios';
import { AuthContext } from '../App';
import PageTitle from '../components/ui/PageTitle';
import { useNotification } from '../context/NotificationContext';
import MetaTags from '../components/ui/MetaTags';
import { track } from '../utils/analytics';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to home or previous page if already authenticated
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store the token and user data
      login(token, user);
      track('login_success', { userId: String(user?.id ?? '') });

      // Show success notification
      showNotification(
        'success',
        'Login Successful',
        `Welcome back, ${user.name || 'Hero'}!`,
        true,
        3000
      );
      
      // Redirect to home or intended page
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Clear any previous error
      setError(null);
      
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.response?.data?.error) {
          setError(String(err.response.data.error));
        } else if (err.request) {
          setError('No response from server. Please check your connection and try again.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Login request failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      className="container mx-auto px-4 py-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <MetaTags
        title={`Sign in | ${PRODUCT_NAME}`}
        description={`Sign in to ${PRODUCT_NAME} on ${DOMAIN_LABEL} to continue your AI fantasy hero.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/login`}
        robots="noindex,follow"
      />
      <div className="max-w-md mx-auto">
        <PageTitle>Log In</PageTitle>
        
        <div className="bg-mystic-800/60 rounded-lg p-8 mt-8 border border-mystic-700 shadow-lg">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block mb-2 text-cosmic-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full bg-mystic-900 border border-mystic-700 rounded-lg p-3 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-cosmic-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full bg-mystic-900 border border-mystic-700 rounded-lg p-3 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-cosmic-600 hover:bg-cosmic-500 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-cosmic-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                state={location.state}
                className="text-cosmic-300 hover:text-cosmic-200"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage; 