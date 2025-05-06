import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { useHeroStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import { CreditCard, Lock, Shield, X, Check, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const CheckoutForm = () => {
  const { heroId } = useParams<{ heroId: string }>();
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
      if (!heroId) return;
      
      try {
        setIsLoading(true);
        await loadHeroFromAPI(heroId);
      } catch (error) {
        console.error('Error loading hero:', error);
        setError('Failed to load hero details');
      } finally {
        setIsLoading(false);
      }
    };
    console.log("STUCK?");
    //loadHero();
  }, [heroId, loadHeroFromAPI]);
  
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
    
    if (!heroId) {
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
      
      // In a real implementation, you would securely create a token on the client side
      // For this example, we're simulating the token creation
      const mockStripeToken = `tok_${Date.now()}`;
      
      // Set up a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          setError('Payment request timed out. Please try again.');
          setIsProcessing(false);
        }
      }, 30000); // 30 second timeout
      
      // Send the payment data to your server
      const response = await api.post('/process-payment', {
        heroId,
        stripeToken: mockStripeToken,
        amount: 9.99, // Price in dollars
        currency: 'usd',
        walletAddress: formData.walletAddress || '0x0000000000000000000000000000000000000000',
        email: formData.email || 'user@example.com',
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Handle the response
      if (response.data) {
        console.log('Payment successful:', response.data);
        // Payment was successful
        setSuccess(true);
        
        // Update hero in store to reflect paid status
        await loadHeroFromAPI(heroId);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/heroes/${heroId}`);
        }, 2000);
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
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
      <div className="mt-8 bg-mystic-900/60 border border-mystic-700 rounded-xl p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cosmic-500 mb-4 mx-auto"></div>
        <h2 className="text-2xl font-bold text-cosmic-400 mb-2">
          Processing Payment
        </h2>
        <p className="text-gray-400 mb-6">
          Please wait while we process your payment. This may take a few moments.
        </p>
        <div className="w-full max-w-md mx-auto bg-mystic-800/50 rounded-lg overflow-hidden h-2">
          <div className="bg-cosmic-500 h-full animate-pulse"></div>
        </div>
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
        <Button onClick={() => navigate(`/heroes/${heroId}`)}>
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