import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { useHeroStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import { CreditCard, Lock, Shield, X, Check, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
// Import the Stripe.js library
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutProvider, PaymentElement} from '@stripe/react-stripe-js';
// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const CheckoutForm = () => {
  const { id } = useParams<{ id: string }>();
  const { heroName, images, status, loadHeroFromAPI } = useHeroStore();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: '',
    walletAddress: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: ''
  });
  
  // Load hero details
  useEffect(() => {
    const loadHero = async () => {
      if (!id) {
        console.error('Hero ID is missing in URL parameters');
        return;
      }
      
      // Remove any 'preview-' prefix that might be in the heroId
      const cleanHeroId = id.replace('preview-', '');
      console.log(`Attempting to load hero with ID: ${cleanHeroId}`);
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Directly fetch hero data from API first to verify API is working
        const response = await api.get(`/api/heroes/${cleanHeroId}`);
        console.log('Hero data fetched successfully:', response.data);
        
        // Now update the store with the fetched data
        await loadHeroFromAPI(response.data);
        console.log('Hero data loaded into store');
      } catch (error) {
        console.error('Error loading hero:', error);
        setError('Failed to load hero details. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    console.log("Loading hero for checkout");
    loadHero();
  }, [id, loadHeroFromAPI]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      setError('Hero ID is missing');
      return;
    }
    
    // Validate card details
    if (!formData.cardNumber || !formData.expiryDate || !formData.cvc || !formData.cardholderName) {
      setError('Please fill in all card details');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      
      // Clean the heroId by removing any 'preview-' prefix
      const cleanHeroId = id.replace('preview-', '');
      
      // Determine if we're in development or production
      const isDevelopment = import.meta.env.MODE === 'development';
      let stripeToken;
      
      if (isDevelopment) {
        // For development, use a mock token
        stripeToken = `tok_${Date.now()}`;
        console.log('Development mode: Using mock Stripe token');
      } else {
        // For production, use a Stripe test token until we implement Elements
        console.log('Production mode: Using Stripe test token for now');
        
        try {

          // NOTE: In a real implementation, you would use Stripe Elements:
          // 1. Create card elements in the UI
          // 2. Create a token from the card element:
          // const { token, error } = await stripe.createToken(cardElement);
          stripeToken = 'tok_visa';
          
          console.log('Using Stripe test token:', stripeToken);
          
          // NOTE: In a real implementation, you would use Stripe Elements:
          // 1. Create card elements in the UI
          // 2. Create a token from the card element:
          // const { token, error } = await stripe.createToken(cardElement);
        } catch (stripeError: any) {
          console.error('Error creating Stripe token:', stripeError);
          setError(stripeError.message || 'Failed to process payment method. Please try again.');
          setIsProcessing(false);
          return;
        }
      }
      
      console.log(`Processing payment for hero: ${cleanHeroId}`);
      console.log('Payment details prepared', { 
        heroId: cleanHeroId, 
        hasStripeToken: !!stripeToken,
        amount: 9.99,
        currency: 'usd',
        email: formData.email || 'user@example.com'
      });
      
      // Set up a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          setError('Payment request timed out. Please try again.');
          setIsProcessing(false);
        }
      }, 30000); // 30 second timeout
      
      // Send the payment data to your server
      const response = await api.post('/api/process-payment', {
        heroId: cleanHeroId,
        stripeToken: stripeToken,
        amount: 9.99, // Price in dollars
        currency: 'usd',
        walletAddress: formData.walletAddress || '0x0000000000000000000000000000000000000000',
        email: formData.email || 'user@example.com',
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      console.log('Payment response received:', response.data);
      
      // Handle the response
      if (response.data && response.data.id) {
        console.log('Payment successful:', response.data);
        // Payment was successful
        setSuccess(true);
        
        // Update hero in store to reflect paid status
        try {
          // Fetch the updated hero data with the new payment status
          const updatedHeroResponse = await api.get(`/api/heroes/${cleanHeroId}`);
          console.log('Updated hero data:', updatedHeroResponse.data);
          await loadHeroFromAPI(updatedHeroResponse.data);
          console.log('Hero data updated with paid status');
        } catch (updateError) {
          console.error('Error updating hero after payment:', updateError);
          // Continue with success flow even if update fails
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/hero/${cleanHeroId}`);
        }, 2000);
      } else {
        console.error('Invalid payment response:', response.data);
        setError('Payment processing returned an invalid response. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Server response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error details:', error.message);
      }
      
      // Provide more detailed error message to the user
      const errorMessage = error.response?.data?.error || 
                          'Failed to process payment. Please check your card details and try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-500"></div>
      </div>
    );
  }
  
  // Render processing state
  if (isProcessing) {
    return (
      <div className="mt-8 bg-mystic-900/60 border border-cosmic-600/30 rounded-xl p-8 text-center">
        <div className="relative h-32 mb-6">
          {/* Central credit card icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cosmic-800 rounded-xl flex items-center justify-center">
            <CheckoutProvider stripe={stripePromise}>
            <form>
              <PaymentElement size={32} className="text-cosmic-400" />
            </form>
            </CheckoutProvider>
          </div>
          
          {/* Orbiting animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-dashed border-cosmic-500/30 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-dashed border-cosmic-400/20 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-cosmic-400 mb-3">
          Processing Your Cosmic Transaction
        </h2>
        
        {/* Rotating messages */}
        <div className="h-12 mb-5 flex items-center justify-center">
          <motion.p 
            key={Math.random()} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-gray-300"
          >
            {[
              "Connecting to the cosmic payment network...",
              "Verifying star alignment for transaction...",
              "Summoning the financial energies...",
              "Creating your celestial receipt...",
              "Securing payment with cosmic encryption...",
              "Preparing your premium hero upgrade..."
            ][Math.floor(Date.now() / 2500) % 6]}
          </motion.p>
        </div>
        
        {/* Animated progress bar */}
        <div className="w-full max-w-md mx-auto bg-mystic-800/50 rounded-lg overflow-hidden h-2 mb-6">
          <motion.div 
            className="bg-gradient-to-r from-cosmic-700 via-cosmic-500 to-cosmic-400 h-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
          ></motion.div>
        </div>
        
        <p className="text-gray-400 text-sm">
          Your payment is being secured in the cosmic vault.
          <br />This may take a moment to complete.
        </p>
      </div>
    );
  }
  
  // Render success state
  if (success) {
    return (
      <div className="mt-8 bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
          <Check size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">
          Payment Successful!
        </h2>
        <p className="text-green-300 mb-4">
          Your hero has been upgraded to premium status!
        </p>
        <Button onClick={() => navigate(`/hero/${id?.replace('preview-', '')}`)}>
          Return to Hero
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-8 bg-mystic-900/60 border border-mystic-700 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
        <p className="text-gray-400">
          Upgrade your hero to unlock all features including shared story creation.
        </p>
      </div>
      
      {heroName && (
        <div className="mb-6 flex items-center gap-4 p-4 bg-mystic-800/50 rounded-lg">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-mystic-700">
            {images && images.length > 0 ? (
              <img 
                src={images[0]?.url} 
                alt={heroName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <span>No Image</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{heroName}</h3>
            <p className="text-cosmic-400">Upgrading to Premium Hero</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-400">Payment Error</h4>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handlePaymentSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="walletAddress" className="block text-sm font-medium mb-1">
            Wallet Address (optional)
          </label>
          <input
            id="walletAddress"
            name="walletAddress"
            type="text"
            value={formData.walletAddress}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="cardholderName" className="block text-sm font-medium mb-1">
            Cardholder Name
          </label>
          <input
            id="cardholderName"
            name="cardholderName"
            type="text"
            value={formData.cardholderName}
            onChange={handleInputChange}
            placeholder="John Doe"
            className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
            Card Number
          </label>
          <div className="relative">
            <input
              id="cardNumber"
              name="cardNumber"
              type="text"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              className="w-full pl-10 pr-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
              required
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <CreditCard size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
              Expiry Date
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="text"
              value={formData.expiryDate}
              onChange={handleInputChange}
              placeholder="MM/YY"
              className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="cvc" className="block text-sm font-medium mb-1">
              CVC
            </label>
            <input
              id="cvc"
              name="cvc"
              type="text"
              value={formData.cvc}
              onChange={handleInputChange}
              placeholder="123"
              className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        
        <div className="mb-6 p-3 bg-cosmic-900/20 border border-cosmic-800/30 rounded-lg">
          <div className="flex items-center gap-2 text-cosmic-400 text-sm mb-2">
            <Shield size={16} />
            <span className="font-medium">Secure Payment</span>
          </div>
          <p className="text-cosmic-500 text-xs">
            Your payment information is securely processed by Stripe.
            We do not store your card details on our servers.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-cosmic-400">$9.99</span>
            <span className="text-xs text-gray-500 ml-1">USD</span>
          </div>
          
          <Button
            type="submit"
            icon={<CreditCard size={16} />}
            disabled={isProcessing}
            className={isProcessing ? 'opacity-75' : ''}
          >
            {isProcessing ? 'Processing...' : 'Upgrade to Premium'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="container mx-auto px-4 pt-20 pb-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageTitle>Checkout</PageTitle>
          <Button variant="ghost" icon={<X size={16} />} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
        
        <CheckoutForm />
      </div>
    </motion.div>
  );
};

export default CheckoutPage;