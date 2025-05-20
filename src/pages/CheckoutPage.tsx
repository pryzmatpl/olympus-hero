import React, {useState, useEffect, useContext} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {AuthContext} from '../App';
import {useHeroStore, useStoryStore} from '../store/heroStore';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import {CreditCard, Lock, Shield, X, Check, AlertTriangle} from 'lucide-react';
import api from '../utils/api';
// Import the Stripe.js library
import {loadStripe} from '@stripe/stripe-js';
import {
    PaymentElement,
    Elements,
    useStripe,
    useElements,
    AddressElement,
} from '@stripe/react-stripe-js';
import QuotaStatusCheck from '../components/QuotaStatusCheck';
import axios from 'axios';

// Determine if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Choose the appropriate Stripe key based on environment
const stripeKey = isDevelopment 
    ? import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY 
    : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe with the appropriate key
const stripePromise = stripeKey
    ? loadStripe(stripeKey)
    : Promise.resolve(null);

// Log environment information for debugging (removed in production builds)
if (isDevelopment) {
    console.log('Running in development mode');
    console.log('Using Stripe key:', stripeKey ? 'TEST key available' : 'No key available');
}

// Animation variants
const pageVariants = {
    initial: {opacity: 0},
    animate: {opacity: 1, transition: {duration: 0.5}},
    exit: {opacity: 0, transition: {duration: 0.3}}
};

// This is the inner form component that uses the Elements context
const CheckoutFormContent = ({ clientSecret, heroId, email, walletAddress, onSuccess, onError, paymentAmount, paymentTitle, paymentDescription }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [paymentElementMounted, setPaymentElementMounted] = useState(false);
    const mountedRef = React.useRef(false);
    const navigate = useNavigate();

    // When the component mounts, set the ref flag
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Track when the Payment Element is ready
    const handlePaymentElementReady = () => {
        console.log("Payment Element is ready");
        setPaymentElementMounted(true);
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            console.error("Stripe or Elements not initialized");
            onError("Payment processor not available. Please try again later.");
            return;
        }

        if (!paymentElementMounted) {
            console.error("Payment Element not ready yet");
            onError("Payment form is still loading. Please wait and try again.");
            return;
        }

        setIsProcessing(true);

        try {
            console.log("Confirming payment with client secret");
            
            // Verify we have the right elements instance
            const element = elements.getElement(PaymentElement);
            if (!element) {
                throw new Error("Payment Element not found. Please refresh and try again.");
            }

            // Use confirmPayment with the mounted elements
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/hero/${heroId}`,
                    receipt_email: email,
                },
                redirect: 'if_required',
            });

            if (error) {
                console.error("Payment confirmation error:", error);
                setErrorMessage(error.message);
                onError(error.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                console.log("Payment succeeded:", paymentIntent);
                onSuccess(paymentIntent);
            } else {
                console.log("Payment requires additional steps or is processing");
                // The customer will be redirected if needed
            }
        } catch (err) {
            console.error("Payment submission error:", err);
            console.error("Error details:", err.message);
            setErrorMessage(err.message);
            onError(err.message);
        } finally {
            if (mountedRef.current) {
                setIsProcessing(false);
            }
        }
    };

    // Log when the stripe or elements change
    useEffect(() => {
        console.log("Stripe available:", !!stripe);
        console.log("Elements available:", !!elements);
    }, [stripe, elements]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6 bg-mystic-800 border border-mystic-700 rounded-lg p-4">
                <PaymentElement onReady={handlePaymentElementReady} />
            </div>

            <div className="mb-6 p-3 bg-cosmic-900/20 border border-cosmic-800/30 rounded-lg">
                <div className="flex items-center gap-2 text-cosmic-400 text-sm mb-2">
                    <Shield size={16}/>
                    <span className="font-medium">Secure Payment</span>
                </div>
                <p className="text-cosmic-500 text-xs">
                    Your payment information is securely processed by Stripe.
                    We do not store your card details on our servers.
                </p>
                {isDevelopment && (
                    <div className="mt-2 pt-2 border-t border-cosmic-800/30">
                        <p className="text-amber-400 text-xs font-semibold">Development Mode</p>
                        <p className="text-cosmic-500 text-xs">
                            Use Stripe test card: 4242 4242 4242 4242, any future date, any 3 digits CVC, any postal code
                        </p>
                    </div>
                )}
            </div>

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5"/>
                    <div>
                        <h4 className="font-semibold text-red-400">Payment Error</h4>
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="text-xl font-bold">
                    <span className="text-cosmic-400">${paymentAmount.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 ml-1">USD</span>
                </div>

                <Button
                    type="submit"
                    icon={<CreditCard size={16}/>}
                    disabled={isProcessing || !stripe || !elements || !paymentElementMounted}
                    className={isProcessing ? 'opacity-75' : ''}
                >
                    {isProcessing ? 'Processing...' : paymentDescription}
                </Button>
            </div>
        </form>
    );
};

// Stripe appearance options
const appearance = {
    theme: 'night',
    variables: {
        colorPrimary: '#8B5CF6',
        colorBackground: '#1F2937',
        colorText: '#F9FAFB',
        colorDanger: '#EF4444',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
    },
};

// Stripe Element options
const stripeElementsOptions = (clientSecret) => ({
    clientSecret,
    appearance,
    loader: 'always',
});

const CheckoutPage = () => {
    const { id } = useParams();
    const { token, user } = useContext(AuthContext);
    const { heroId, heroName, images, setPaymentStatus } = useHeroStore();
    const navigate = useNavigate();
    
    // State variables
    const [clientSecret, setClientSecret] = useState(null);
    const [stripeReady, setStripeReady] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState(user?.email || '');
    const [walletAddress, setWalletAddress] = useState('');
    const [paymentAmount, setPaymentAmount] = useState(3.99);
    const [paymentTitle, setPaymentTitle] = useState('Unlock Premium Hero');
    const [paymentDescription, setPaymentDescription] = useState('Upgrade to Premium');
    const [paymentType, setPaymentType] = useState('premium_upgrade');
    const [isUnlockingChapters, setIsUnlockingChapters] = useState(false);
    const [isPaymentDisabled, setIsPaymentDisabled] = useState(false);
    
    // Determine the actual hero ID to use
    const effectiveHeroId = id || heroId;

    // Verify if the Stripe Elements can be initialized
    useEffect(() => {
        const checkStripeAvailability = async () => {
            try {
                // Check if stripePromise is resolved properly
                const stripeInstance = await stripePromise;
                if (!stripeInstance) {
                    console.error("Stripe failed to initialize - no publishable key?");
                    setError("Payment processing is unavailable. Please try again later.");
                } else {
                    console.log("Stripe initialized successfully");
                    setStripeReady(true);
                }
            } catch (err) {
                console.error("Error initializing Stripe:", err);
                setError("Payment processing failed to initialize. Please try again later.");
            }
        };

        checkStripeAvailability();
    }, []);

    // Initialize the checkout when parameters are available
    useEffect(() => {
        const initializeCheckout = async () => {
            // Skip if no hero ID is available or if disabled
            if (!effectiveHeroId || isPaymentDisabled) return;
            
            try {
                console.log(`Initializing checkout for hero: ${effectiveHeroId}`);
                
                // Determine payment type and amount from URL params
                const urlParams = new URLSearchParams(window.location.search);
                const type = urlParams.get('type') || 'premium_upgrade';
                setPaymentType(type);
                
                if (type === 'chapters') {
                    setPaymentTitle('Unlock More Chapters');
                    setPaymentDescription('Unlock 3 Chapters');
                    setPaymentAmount(1.99);
                    setIsUnlockingChapters(true);
                }
                
                // Create a payment intent
                const response = await api.post('/api/create-payment-intent', {
                    amount: type === 'chapters' ? 1.99 : 3.99,
                    currency: 'usd',
                    heroId: effectiveHeroId,
                    walletAddress: walletAddress,
                    unlockChapters: type === 'chapters',
                    paymentType: type,
                    is_test: isDevelopment // Pass development mode flag
                });
                
                console.log("Payment intent created");
                setClientSecret(response.data.clientSecret);
            } catch (err) {
                console.error("Error creating payment intent:", err);
                if (err.response?.data?.errorType === 'quota_exceeded') {
                    setError(err.response.data.message || "Payment processing is temporarily unavailable due to AI service quota limitations.");
                } else {
                    setError(err.message || "Failed to initialize payment. Please try again later.");
                }
            }
        };
        
        if (effectiveHeroId && !isPaymentDisabled) {
            initializeCheckout();
        }
    }, [effectiveHeroId, walletAddress, isPaymentDisabled]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'email') setEmail(value);
        if (name === 'walletAddress') setWalletAddress(value);
    };

    // Handle successful payment
    const handlePaymentSuccess = async (paymentIntent) => {
        console.log("Payment successful:", paymentIntent);
        let navigationTimeout = null;
        
        try {
            // Set a safety timeout to ensure navigation happens even if API calls hang
            navigationTimeout = setTimeout(() => {
                console.log("Navigation timeout triggered - ensuring redirect happens");
                navigate(`/hero/${effectiveHeroId}?payment=success${isUnlockingChapters ? '&type=chapters' : ''}`);
            }, 5000); // 5 second safety timeout
            
            // Update hero payment status
            await api.post(`/api/heroes/setpremium/${effectiveHeroId}`);
            
            // Update local state immediately
            setPaymentStatus('paid');
            
            // If unlocking chapters, make additional API call with timeout protection
            if (isUnlockingChapters) {
                try {
                    // Create a specialized API instance with shorter timeout for this critical call
                    const fastApi = axios.create({
                        baseURL: api.defaults.baseURL,
                        headers: api.defaults.headers,
                        timeout: 3000 // 3 seconds timeout
                    });
                    
                    // Add authorization header
                    const authToken = localStorage.getItem('authToken');
                    if (authToken) {
                        fastApi.defaults.headers.Authorization = `Bearer ${authToken}`;
                    }
                    
                    // Make the API call with the specialized instance
                    await fastApi.post(`/api/storybook/${effectiveHeroId}/unlock-after-payment`);
                    console.log("Successfully unlocked chapters after payment");
                } catch (unlockError) {
                    console.error("Error or timeout unlocking chapters:", unlockError);
                    // Continue execution even if this fails
                }
            }
            
            // Fetch updated storybook using the store's function directly
            try {
                // Use a non-blocking approach to fetch the storybook data
                setTimeout(() => {
                    try {
                        console.log("Fetching storybook data after payment");
                        useStoryStore.getState().fetchStorybook(effectiveHeroId);
                    } catch (fetchError) {
                        console.error("Error in delayed storybook fetch:", fetchError);
                    }
                }, 0);
            } catch (fetchError) {
                console.error("Error setting up storybook fetch:", fetchError);
                // Continue with navigation even if storybook fetch fails
            }
        } catch (err) {
            console.error("Error handling successful payment:", err);
            setError("Payment was successful, but we encountered an error updating your hero. Please refresh the page.");
        } finally {
            // Clear the navigation timeout since we're navigating normally
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
                navigationTimeout = null;
            }
            
            // Always navigate back to hero page with success message and payment type
            // This ensures navigation happens regardless of any errors in the process
            navigate(`/hero/${effectiveHeroId}?payment=success${isUnlockingChapters ? '&type=chapters' : ''}`);
        }
    };

    // Handle payment error
    const handlePaymentError = (errorMessage) => {
        console.error("Payment error:", errorMessage);
        setError(errorMessage);
    };
    
    // Handle quota exceeded
    const handleQuotaExceeded = () => {
        setIsPaymentDisabled(true);
        setError("Payment processing is temporarily disabled because the AI service quota has been exceeded. Please try again later.");
    };
    
    // Handle quota available
    const handleQuotaAvailable = () => {
        setIsPaymentDisabled(false);
    };

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
                    <PageTitle>{paymentTitle}</PageTitle>
                    <Button variant="ghost" icon={<X size={16}/>} onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-8 flex items-start gap-4">
                        <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24}/>
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
                            <p className="text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                <QuotaStatusCheck 
                    onQuotaExceeded={handleQuotaExceeded}
                    onQuotaAvailable={handleQuotaAvailable}
                >
                    <div className="bg-mystic-900 border border-mystic-800 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-medium text-white mb-6">Payment Details</h2>

                        <div className="mb-6">
                            <label htmlFor="email" className="block text-white font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="walletAddress" className="block text-white font-medium">
                                    Wallet Address <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                            </div>
                            <input
                                type="text"
                                id="walletAddress"
                                name="walletAddress"
                                value={walletAddress}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-mystic-800 border border-mystic-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                                placeholder="0x..."
                            />
                            <p className="text-gray-400 text-xs mt-2">
                                For storing your hero as an NFT in the future (not required)
                            </p>
                        </div>

                        {stripeReady && clientSecret ? (
                            <Elements stripe={stripePromise} options={stripeElementsOptions(clientSecret)}>
                                <CheckoutFormContent
                                    clientSecret={clientSecret}
                                    heroId={effectiveHeroId}
                                    email={email}
                                    walletAddress={walletAddress}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    paymentAmount={paymentAmount}
                                    paymentTitle={paymentTitle}
                                    paymentDescription={paymentDescription}
                                />
                            </Elements>
                        ) : (
                            <div className="flex justify-center items-center py-8">
                                {!error && (
                                    <>
                                        <div className="mr-3 w-6 h-6 border-4 border-cosmic-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-cosmic-300">Initializing payment form...</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </QuotaStatusCheck>
            </div>
        </motion.div>
    );
};

export default CheckoutPage;