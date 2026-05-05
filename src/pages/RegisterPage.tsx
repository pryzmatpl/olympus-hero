import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { motion } from 'framer-motion';
import api from '../utils/api.ts';
import { AuthContext } from '../App';
import { getSessionId, track } from '../utils/analytics';
import MetaTags from '../components/ui/MetaTags';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAfterRegister =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/create';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Register the user
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        sessionId: getSessionId(),
      });

      // Now login the user
      const loginResponse = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = loginResponse.data;
      
      // Store the token and user data
      login(token, user);
      track('register_success', { userId: String(user?.id ?? '') });

      navigate(redirectAfterRegister, { replace: true });
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const message = isAxiosError(err)
        ? String(err.response?.data?.error ?? err.message)
        : 'Registration failed. Please try again.';
      setError(message);
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
        title={`Create account | ${PRODUCT_NAME}`}
        description={`Join ${PRODUCT_NAME} on ${DOMAIN_LABEL} to save heroes and unlock premium when you are ready.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/register`}
        robots="noindex,follow"
      />
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-cosmic-400 text-center mb-8">Join the mythical heroes community</p>
        
        <div className="bg-mystic-800/60 rounded-lg p-8 border border-mystic-700 shadow-lg">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block mb-2 text-cosmic-300">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full bg-mystic-900 border border-mystic-700 rounded-lg p-3 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            
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
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block mb-2 text-cosmic-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full bg-mystic-900 border border-mystic-700 rounded-lg p-3 text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-cosmic-600 hover:bg-cosmic-500 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-cosmic-400">
              Already have an account?{' '}
              <Link
                to="/login"
                state={location.state}
                className="text-cosmic-300 hover:text-cosmic-200"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterPage; 