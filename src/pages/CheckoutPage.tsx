import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard, Image, Download, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useHeroStore } from '../store/heroStore';
import axios from 'axios';

// Placeholder image for demo
const PLACEHOLDER_IMAGE = 'https://images.pexels.com/photos/1554646/pexels-photo-1554646.jpeg';

const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hero, setHero] = useState<any>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: ''
  });
  
  const { setPaymentStatus } = useHeroStore();
  
  // Load hero data
  useEffect(() => {
    const fetchHero = async () => {
      if (!id) return;
      
      try {
        const response = await axios.get(`/api/heroes/${id?.replace('preview-', '')}`);
        setHero(response.data.hero);
      } catch (error) {
        console.error('Error fetching hero:', error);
        setError('Could not load hero information. Please try again.');
      }
    };
    
    fetchHero();
  }, [id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      // Prepare payment details
      const paymentDetails = {
        id: `payment_${Date.now()}`, // In a real app, this would come from Stripe
        cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Only store last 4 digits
        amount: 999, // $9.99
        currency: 'usd',
        status: 'succeeded'
      };
      
      // Send payment to server
      const response = await axios.post(`/api/heroes/${id?.replace('preview-', '')}/payment`, {
        paymentDetails
      });
      
      // Update local state on success
      setPaymentStatus('paid');
      setStep(2);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.response?.data?.error || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleComplete = () => {
    // Navigate to the final hero page
    navigate(`/hero/${id?.replace('preview-', '')}`);
  };
  
  const heroName = hero?.name || 'Cosmic Hero';
  const heroImage = hero?.images && hero.images.length > 0 
    ? hero.images[0].url 
    : 'https://images.pexels.com/photos/1554646/pexels-photo-1554646.jpeg';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-32 pb-20"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back to Hero */}
        <Link to={`/hero/${id}`} className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to Hero Preview
        </Link>
        
        <div className="bg-mystic-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-mystic-gradient p-6">
            <h1 className="text-2xl font-display font-semibold">Complete Your Purchase</h1>
          </div>
          
          <div className="p-6">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Payment Form */}
                <div className="md:col-span-3">
                  <h2 className="text-lg font-medium mb-4 flex items-center">
                    <Lock size={18} className="mr-2 text-cosmic-500" /> Secure Payment
                  </h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="space-y-4">
                      <Input
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        fullWidth
                        leftIcon={<CreditCard size={18} />}
                        required
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiration Date"
                          placeholder="MM / YY"
                          required
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                        />
                        <Input
                          label="Security Code"
                          placeholder="CVC"
                          required
                          name="cvc"
                          value={formData.cvc}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <Input
                        label="Cardholder Name"
                        placeholder="Name as it appears on card"
                        fullWidth
                        required
                        name="cardholderName"
                        value={formData.cardholderName}
                        onChange={handleInputChange}
                      />
                      
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          fullWidth
                          isLoading={isProcessing}
                        >
                          Pay $9.99
                        </Button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          Your payment is secured with end-to-end encryption
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
                
                {/* Order Summary */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  
                  <div className="bg-mystic-900 rounded-lg p-4 mb-4">
                    <div className="aspect-square rounded overflow-hidden mb-4">
                      <img 
                        src={heroImage} 
                        alt={`${heroName} preview`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="font-medium">{heroName} Package</h3>
                    <p className="text-sm text-gray-400 mb-4">Full access to your unique mythical hero</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base price</span>
                        <span>$9.99</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>$9.99</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    <h3 className="font-medium text-white mb-2">What's included:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Image size={16} className="mr-2 mt-1 text-cosmic-500" />
                        <span>High-resolution hero images</span>
                      </li>
                      <li className="flex items-start">
                        <Download size={16} className="mr-2 mt-1 text-cosmic-500" />
                        <span>Downloadable files in multiple formats (JPG, PNG)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={16} className="mr-2 mt-1 text-cosmic-500" />
                        <span>Complete hero backstory and traits</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cosmic-500/20 mb-4">
                  <CheckCircle size={32} className="text-cosmic-500" />
                </div>
                
                <h2 className="text-2xl font-display font-semibold mb-2">Payment Successful!</h2>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Thank you for your purchase. Your cosmic hero has been successfully unlocked and is now ready for you to enjoy.
                </p>
                
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={handleComplete}
                >
                  View My Hero
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;