import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../App';

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
      const registerResponse = await axios.post('/api/auth/register', {
        name,
        email,
        password
      });
      
      // Now login the user
      const loginResponse = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = loginResponse.data;
      
      // Store the token and user data
      login(token, user);
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
              <Link to="/login" className="text-cosmic-300 hover:text-cosmic-200">
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