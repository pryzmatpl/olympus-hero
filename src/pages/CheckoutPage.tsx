import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { useHeroStore, useStoryStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import { CreditCard, Shield, X, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import QuotaStatusCheck from '../components/QuotaStatusCheck';
import axios from 'axios';
import MetaTags from '../components/ui/MetaTags';
import { track, getSessionId } from '../utils/analytics';
import { getCheckoutTrustVariant } from '../utils/growthExperiments';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';
import {
  LandingStyleHero,
  LandingStyleMain,
  LandingStylePageRoot,
} from '../components/layout/LandingStyleLayout';

const isDevelopment = import.meta.env.MODE === 'development';

const stripeKey = isDevelopment
  ? import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripeKey ? loadStripe(stripeKey) : Promise.resolve(null);

if (isDevelopment) {
  console.log('Running in development mode');
  console.log('Using Stripe key:', stripeKey ? 'TEST key available' : 'No key available');
}

const checkoutPanelClass =
  'rounded-sm border border-stone-700/90 bg-gradient-to-b from-stone-950/95 via-stone-950/88 to-stone-950 shadow-xl shadow-black/50 ring-1 ring-inset ring-stone-500/10 p-8 md:p-10';

const inputEpic =
  'w-full px-4 py-3 rounded-sm bg-stone-950/75 border border-stone-700/90 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-600/35 focus:border-amber-700/45 transition-shadow';

/** Stripe Appearance — aligns with Mythical Hero / landing stone tokens */
const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#0c0a09',
    colorText: '#e7e5e4',
    colorTextSecondary: '#a8a29e',
    colorTextPlaceholder: '#78716c',
    colorDanger: '#f87171',
    fontFamily:
      'ui-sans-serif, Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    spacingUnit: '5px',
    borderRadius: '2px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#0c0a09',
      border: '1px solid rgba(68, 64, 60, 0.65)',
      boxShadow: 'none',
      color: '#e7e5e4',
    },
    '.Input:focus': {
      border: '1px solid rgba(245, 158, 11, 0.45)',
      boxShadow: '0 0 0 2px rgba(217, 119, 6, 0.2)',
    },
    '.Label': {
      color: '#d6d3d1',
      fontWeight: '500',
    },
    '.Tab': {
      backgroundColor: 'rgba(28, 25, 23, 0.8)',
      border: '1px solid rgba(68, 64, 60, 0.65)',
      color: '#e7e5e4',
    },
    '.Tab--selected': {
      border: '1px solid rgba(245, 158, 11, 0.5)',
      backgroundColor: 'rgba(69, 26, 3, 0.35)',
    },
  },
};

const stripeElementsOptions = (clientSecret: string) => ({
  clientSecret,
  appearance: stripeAppearance,
  loader: 'always' as const,
});

type CheckoutFormContentProps = {
  heroId: string;
  email: string;
  onSuccess: (paymentIntent: import('@stripe/stripe-js').PaymentIntent) => void;
  onError: (message: string) => void;
  paymentAmount: number;
  paymentDescription: string;
  showExpandedTrust: boolean;
};

const CheckoutFormContent: React.FC<CheckoutFormContentProps> = ({
  heroId,
  email,
  onSuccess,
  onError,
  paymentAmount,
  paymentDescription,
  showExpandedTrust,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const mountedRef = React.useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handlePaymentElementReady = () => {
    setPaymentElementMounted(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not initialized');
      onError('Payment processor not available. Please try again later.');
      return;
    }

    if (!paymentElementMounted) {
      onError('Payment form is still loading. Please wait and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const element = elements.getElement(PaymentElement);
      if (!element) {
        throw new Error('Payment Element not found. Please refresh and try again.');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/hero/${heroId}`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message ?? null);
        onError(error.message ?? 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setErrorMessage(msg);
      onError(msg);
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  useEffect(() => {
    console.log('Stripe available:', !!stripe);
    console.log('Elements available:', !!elements);
  }, [stripe, elements]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8 rounded-sm border border-stone-800 bg-stone-950/80 p-4 shadow-inner shadow-black/40">
        <PaymentElement onReady={handlePaymentElementReady} />
      </div>

      <div className="mb-8 rounded-sm border border-amber-900/35 bg-gradient-to-br from-amber-950/25 to-stone-950/50 p-4 md:p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-500/90">
          <Shield size={16} className="opacity-95" aria-hidden />
          <span>Secure payment</span>
        </div>
        <p className="text-sm leading-relaxed text-stone-400">
          Your card runs through Stripe. We never store full card numbers on{' '}
          {DOMAIN_LABEL}
          &apos;s servers.
        </p>
        {showExpandedTrust && (
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Premium attaches to this hero: full-resolution portraits, full backstory, downloads, and
            shared-story access where enabled — kept with your account after checkout.
          </p>
        )}
        {isDevelopment && (
          <div className="mt-4 border-t border-amber-900/30 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
              Development mode
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Test card{' '}
              <code className="rounded bg-stone-950/90 px-1.5 py-0.5 text-amber-200/85">
                4242&nbsp;4242&nbsp;4242&nbsp;4242
              </code>
              , any future expiry, any CVC, any postal code.
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-8 flex gap-4 rounded-sm border border-red-800/60 bg-red-950/30 p-4">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
          <div>
            <p className="font-display font-semibold text-red-300">Payment could not finish</p>
            <p className="mt-1 text-sm text-red-200/85">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 border-t border-stone-800/90 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Total</p>
          <p className="font-display text-3xl font-bold tracking-tight text-amber-200/95">
            ${paymentAmount.toFixed(2)}
            <span className="ml-2 text-sm font-display font-semibold uppercase tracking-wide text-stone-500">
              USD
            </span>
          </p>
        </div>

        <Button
          type="submit"
          icon={<CreditCard size={16} />}
          disabled={isProcessing || !stripe || !elements || !paymentElementMounted}
          className={
            `${isProcessing ? 'opacity-80' : ''} border border-amber-700/40 shadow-lg shadow-amber-950/35`.trim()
          }
        >
          {isProcessing ? 'Processing…' : paymentDescription}
        </Button>
      </div>
    </form>
  );
};

const CheckoutPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { heroId, setPaymentStatus } = useHeroStore();
  const navigate = useNavigate();
  const checkoutTrustVariant = useMemo(() => getCheckoutTrustVariant(), []);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(3.99);
  const [paymentTitle, setPaymentTitle] = useState('Unlock Premium Hero');
  const [paymentDescription, setPaymentDescription] = useState('Upgrade to Premium');
  const [isUnlockingChapters, setIsUnlockingChapters] = useState(false);
  const [isPaymentDisabled, setIsPaymentDisabled] = useState(false);

  const effectiveHeroId = id || heroId;

  const heroLead = useMemo(
    () => (
      <div className="flex flex-col gap-2 font-medium text-stone-300 md:text-lg">
        <p className="text-amber-100/90">{paymentDescription}</p>
        <p className="text-sm leading-relaxed text-stone-500 md:text-[0.9375rem]">
          Stripe-encrypted checkout for this hero • {DOMAIN_LABEL}
        </p>
      </div>
    ),
    [paymentDescription],
  );

  useEffect(() => {
    const checkStripeAvailability = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          setError('Payment processing is unavailable. Please try again later.');
        } else {
          setStripeReady(true);
        }
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError('Payment processing failed to initialize. Please try again later.');
      }
    };
    checkStripeAvailability();
  }, []);

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!effectiveHeroId || isPaymentDisabled) return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'premium_upgrade';

        if (type === 'chapters') {
          setPaymentTitle('Unlock More Chapters');
          setPaymentDescription('Unlock 3 chapters');
          setPaymentAmount(1.99);
          setIsUnlockingChapters(true);
        }

        const response = await api.post('/api/create-payment-intent', {
          amount: type === 'chapters' ? 1.99 : 3.99,
          currency: 'usd',
          heroId: effectiveHeroId,
          walletAddress,
          unlockChapters: type === 'chapters',
          paymentType: type,
          is_test: isDevelopment,
          sessionId: getSessionId(),
        });

        setClientSecret(response.data.clientSecret);
        track('checkout_open', { heroId: String(effectiveHeroId), paymentType: type });
      } catch (err: unknown) {
        console.error('Error creating payment intent:', err);
        const ax = err as { response?: { data?: { errorType?: string; message?: string } } };
        if (ax.response?.data?.errorType === 'quota_exceeded') {
          setError(
            ax.response.data.message ||
              'Payment is temporarily unavailable due to AI quota limits.',
          );
        } else {
          const msg =
            err instanceof Error ? err.message : 'Failed to initialize payment. Try again later.';
          setError(msg);
        }
      }
    };

    if (effectiveHeroId && !isPaymentDisabled) initializeCheckout();
  }, [effectiveHeroId, walletAddress, isPaymentDisabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'walletAddress') setWalletAddress(value);
  };

  const handlePaymentSuccess = async (paymentIntent: import('@stripe/stripe-js').PaymentIntent) => {
    track('payment_success_client', {
      heroId: String(effectiveHeroId),
      paymentIntentId: String(paymentIntent?.id || ''),
    });
    let navigationTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      navigationTimeout = setTimeout(() => {
        navigate(
          `/hero/${effectiveHeroId}?payment=success${isUnlockingChapters ? '&type=chapters' : ''}`,
        );
      }, 5000);

      await api.post(`/api/heroes/setpremium/${effectiveHeroId}`);
      setPaymentStatus('paid');

      if (isUnlockingChapters) {
        try {
          const fastApi = axios.create({
            baseURL: api.defaults.baseURL,
            headers: api.defaults.headers,
            timeout: 3000,
          });
          const authToken = localStorage.getItem('authToken');
          if (authToken) fastApi.defaults.headers.Authorization = `Bearer ${authToken}`;
          await fastApi.post(`/api/storybook/${effectiveHeroId}/unlock-after-payment`);
        } catch (unlockError) {
          console.error('Error or timeout unlocking chapters:', unlockError);
        }
      }

      setTimeout(() => {
        try {
          useStoryStore.getState().fetchStorybook(effectiveHeroId);
        } catch (fetchError) {
          console.error('Error in delayed storybook fetch:', fetchError);
        }
      }, 0);
    } catch (err) {
      console.error('Error handling successful payment:', err);
      setError(
        'Payment succeeded, but updating your hero hit an error. Refresh the hero page.',
      );
    } finally {
      if (navigationTimeout) clearTimeout(navigationTimeout);
      navigate(`/hero/${effectiveHeroId}?payment=success${isUnlockingChapters ? '&type=chapters' : ''}`);
    }
  };

  const handlePaymentError = (errorMessage: string) => setError(errorMessage);

  const handleQuotaExceeded = () => {
    setIsPaymentDisabled(true);
    setError('Checkout is paused while AI quota is exceeded. Try again shortly.');
  };

  const handleQuotaAvailable = () => setIsPaymentDisabled(false);

  return (
    <LandingStylePageRoot>
      <MetaTags
        title={`Checkout | ${PRODUCT_NAME}`}
        description={`Secure checkout on ${DOMAIN_LABEL} for premium hero unlocks and chapter bundles.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/checkout/${id || heroId || 'hero'}`}
        robots="noindex,nofollow"
      />

      <LandingStyleHero
        eyebrow="Mythical Hero · Forge"
        title={paymentTitle}
        lead={heroLead}
        leadStyle="plain"
        headingId="checkout-heading"
        actions={
          <Button
            type="button"
            variant="outline"
            icon={<X size={16} />}
            onClick={() => navigate(-1)}
            className="rounded-full border-stone-600 text-stone-200 hover:bg-stone-900/90"
          >
            Cancel
          </Button>
        }
      />

      <LandingStyleMain>
        <div className="max-w-2xl mx-auto pb-16">
          {error && (
            <div className="mb-10 flex gap-4 rounded-sm border border-red-800/60 bg-red-950/25 p-6 shadow-lg shadow-black/30">
              <AlertTriangle size={26} className="mt-0.5 shrink-0 text-red-400/95" aria-hidden />
              <div>
                <h2 className="font-display text-lg font-semibold text-red-300">Something went wrong</h2>
                <p className="mt-2 text-sm leading-relaxed text-red-200/90">{error}</p>
              </div>
            </div>
          )}

          <QuotaStatusCheck onQuotaExceeded={handleQuotaExceeded} onQuotaAvailable={handleQuotaAvailable}>
            <section className={checkoutPanelClass} aria-labelledby="payment-details-heading">
              <header className="mb-10 border-b border-stone-800 pb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-500/90">
                  Payment
                </p>
                <h2 id="payment-details-heading" className="font-display text-2xl font-bold text-stone-100">
                  Billing details
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-400">
                  Use the card you want charged. Receipt goes to your email unless you edit it in the payment
                  form.
                </p>
                <p className="mt-6 font-display text-xl font-semibold tracking-tight text-amber-200/95 md:text-2xl">
                  {paymentAmount.toFixed(2)} USD
                  <span className="ml-3 text-sm font-sans font-medium uppercase tracking-wider text-stone-500">
                    today
                  </span>
                </p>
              </header>

              <div className="space-y-8">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    className={inputEpic}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="walletAddress" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Wallet <span className="font-normal normal-case tracking-normal text-stone-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="walletAddress"
                    name="walletAddress"
                    value={walletAddress}
                    onChange={handleInputChange}
                    className={inputEpic}
                    placeholder="0x…"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">
                    Future optional mint only — leave blank if you are here for portraits and lore.
                  </p>
                </div>

                {stripeReady && clientSecret ? (
                  <Elements stripe={stripePromise} options={stripeElementsOptions(clientSecret)}>
                    <CheckoutFormContent
                      heroId={effectiveHeroId!}
                      email={email}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      paymentAmount={paymentAmount}
                      paymentDescription={paymentDescription}
                      showExpandedTrust={checkoutTrustVariant === 'expanded'}
                    />
                  </Elements>
                ) : (
                  <div className="flex min-h-[8rem] items-center justify-center gap-4 rounded-sm border border-dashed border-stone-700 bg-stone-950/60 py-12">
                    {!error && (
                      <>
                        <div className="h-7 w-7 shrink-0 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500/90" />
                        <span className="font-medium text-stone-400">
                          Summoning Stripe…
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          </QuotaStatusCheck>
        </div>
      </LandingStyleMain>
    </LandingStylePageRoot>
  );
};

export default CheckoutPage;
