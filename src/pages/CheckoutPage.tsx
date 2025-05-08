import React, {useState, useEffect, useContext} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {AuthContext} from '../App';
import {useHeroStore} from '../store/heroStore';
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
const CheckoutFormContent = ({ clientSecret, heroId, email, walletAddress, onSuccess, onError }) => {
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
                    <span className="text-cosmic-400">$9.99</span>
                    <span className="text-xs text-gray-500 ml-1">USD</span>
                </div>

                <Button
                    type="submit"
                    icon={<CreditCard size={16}/>}
                    disabled={isProcessing || !stripe || !elements || !paymentElementMounted}
                    className={isProcessing ? 'opacity-75' : ''}
                >
                    {isProcessing ? 'Processing...' : 'Upgrade to Premium'}
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
    const {id} = useParams<{ id: string }>();
    const {heroName, images, status, loadHeroFromAPI} = useHeroStore();
    const {token} = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        walletAddress: '',
    });
    const [clientSecret, setClientSecret] = useState(null);
    const [stripeReady, setStripeReady] = useState(false);

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

    // Load hero and create payment intent
    useEffect(() => {
        const initializeCheckout = async () => {
            if (!id) {
                console.error('Hero ID is missing in URL parameters');
                setError('Hero ID is missing');
                setIsLoading(false);
                return;
            }

            if (!stripeReady) {
                // Wait for Stripe to be ready before proceeding
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Clean the heroId by removing any 'preview-' prefix
                const cleanHeroId = id.replace('preview-', '');
                console.log(`Initializing checkout for hero ID: ${cleanHeroId}`);

                // 1. Load hero details
                const heroResponse = await api.get(`/api/heroes/${cleanHeroId}`);
                console.log('Hero data fetched successfully:', heroResponse.data);
                await loadHeroFromAPI(heroResponse.data);

                // 2. Create payment intent to get client secret
                const paymentResponse = await api.post('/api/create-payment-intent', {
                    amount: 9.99, // Price in dollars
                    currency: 'usd',
                    heroId: cleanHeroId,
                    walletAddress: formData.walletAddress || '0x0000000000000000000000000000000000000000',
                    // Make sure to clearly indicate test mode
                    is_test: isDevelopment
                });

                if (!paymentResponse.data.clientSecret) {
                    throw new Error('No client secret returned from the server');
                }

                setClientSecret(paymentResponse.data.clientSecret);
                console.log('Payment intent created successfully');
            } catch (err) {
                console.error('Error initializing checkout:', err);
                setError(err.message || 'Failed to initialize checkout. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeCheckout();
    }, [id, loadHeroFromAPI, stripeReady]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle payment success
    const handlePaymentSuccess = async (paymentIntent) => {
        setSuccess(true);
        
        try {
            // Refresh hero data to reflect paid status
            const cleanHeroId = id.replace('preview-', '');
            const updatedHeroResponse = await api.get(`/api/heroes/${cleanHeroId}`);
            await loadHeroFromAPI(updatedHeroResponse.data);
            console.log('Hero data updated with paid status');

            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/hero/${cleanHeroId}`);
            }, 2000);
        } catch (err) {
            console.error('Error updating hero after payment:', err);
            // Continue with success flow even if update fails
        }
    };

    // Handle payment error
    const handlePaymentError = (errorMessage) => {
        setError(errorMessage);
    };

    // Render loading state
    if (isLoading) {
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
                        <Button variant="ghost" icon={<X size={16}/>} onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                    </div>
                    <div className="mt-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-500"></div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Render success state
    if (success) {
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
                    </div>
                    <div className="mt-8 bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
                            <Check size={32} className="text-green-400"/>
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
                </div>
            </motion.div>
        );
    }

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
                    <Button variant="ghost" icon={<X size={16}/>} onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                </div>

                {error && !clientSecret && (
                    <div className="mt-8 bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
                        <AlertTriangle size={32} className="mx-auto text-red-400 mb-4" />
                        <h2 className="text-xl font-bold text-red-400 mb-2">Checkout Error</h2>
                        <p className="text-red-300 mb-4">{error}</p>
                        <Button onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                )}

                {clientSecret ? (
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

                        {stripeReady ? (
                            <Elements
                                stripe={stripePromise}
                                options={stripeElementsOptions(clientSecret)}
                            >
                                <CheckoutFormContent
                                    clientSecret={clientSecret}
                                    heroId={id?.replace('preview-', '')}
                                    email={formData.email}
                                    walletAddress={formData.walletAddress}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                />
                            </Elements>
                        ) : (
                            <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg text-center">
                                <AlertTriangle size={24} className="mx-auto text-amber-400 mb-2"/>
                                <p className="text-amber-300">
                                    Payment processor is initializing. Please wait...
                                </p>
                            </div>
                        )}
                    </div>
                ) : !error && (
                    <div className="mt-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-500"></div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CheckoutPage;