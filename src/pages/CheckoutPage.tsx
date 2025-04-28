import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard, Image, Download, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// Placeholder image for demo
const PLACEHOLDER_IMAGE = 'https://images.pexels.com/photos/1554646/pexels-photo-1554646.jpeg';

const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };
  
  const handleComplete = () => {
    // Navigate to the final hero page
    navigate(`/hero/${id?.replace('preview-', '')}`);
  };
  
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
                  
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="space-y-4">
                      <Input
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        fullWidth
                        leftIcon={<CreditCard size={18} />}
                        required
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiration Date"
                          placeholder="MM / YY"
                          required
                        />
                        <Input
                          label="Security Code"
                          placeholder="CVC"
                          required
                        />
                      </div>
                      
                      <Input
                        label="Cardholder Name"
                        placeholder="Name as it appears on card"
                        fullWidth
                        required
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
                        src={PLACEHOLDER_IMAGE} 
                        alt="Hero preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="font-medium">Cosmic Hero Package</h3>
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
                        <span>3 high-resolution hero images (front, profile, action)</span>
                      </li>
                      <li className="flex items-start">
                        <Download size={16} className="mr-2 mt-1 text-cosmic-500" />
                        <span>Downloadable files in multiple formats (JPG, PNG)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={16} className="mr-2 mt-1 text-cosmic-500" />
                        <span>Personal and commercial usage rights</span>
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
                  Thank you for your purchase. Your cosmic hero has been successfully generated and is now ready to download.
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