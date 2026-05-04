import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, SparkleIcon } from 'lucide-react';
import DatePickerInput from '../components/form/DatePickerInput';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import MetaTags from '../components/ui/MetaTags';
import { useZodiac } from '../hooks/useZodiac';
import { useHeroStore } from '../store/heroStore';
import api from '../utils/api.ts';
import { Guid } from 'guid-typescript';
import { useNotification } from '../context/NotificationContext';
import { track } from '../utils/analytics';
import { getCreatorLimitHintVariant } from '../utils/growthExperiments';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';

const CreatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const creatorLimitVariant = getCreatorLimitHintVariant();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get heroStore actions
  const { 
    setHeroName: setStoreHeroName, 
    setBirthdate: setStoreBirthdate, 
    setZodiacInfo, 
    setBackstory,
    setImages,
    setStatus,
    resetHero
  } = useHeroStore();
  
  // Form state
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [heroName, setHeroName] = useState<string>('');
  
  // Form validation
  const [birthdateError, setBirthdateError] = useState<string>('');
  const [heroNameError, setHeroNameError] = useState<string>('');
  
  // Calculate zodiac information
  const zodiacInfo = useZodiac(birthdate);
  
  // Function to validate and proceed to next step
  const handleNextStep = () => {
    if (step === 1) {
      if (!birthdate) {
        setBirthdateError('Please select your birth date');
        return;
      }
      setBirthdateError('');
      setStep(2);
      
      // Save birthdate and zodiac info to store
      setStoreBirthdate(birthdate);
      if (zodiacInfo) {
        setZodiacInfo(zodiacInfo);
      }
    } else if (step === 2) {
      if (!heroName.trim()) {
        setHeroNameError('Please enter a name for your hero');
        return;
      }
      setHeroNameError('');
      setStep(3);
      
      // Save hero name to store
      setStoreHeroName(heroName);
    } else if (step === 3) {
      handleCreateHero();
    }
  };

  // Function to go back to previous step
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Function to create the hero
  const handleCreateHero = async () => {
    setLoading(true);
    setStatus('generating');
    let heroId = Guid.create().toString();
    heroId = heroId.replace(/-/gi, '');

    track('hero_generate_start', { heroId });

    try {
      if (!birthdate) {
        throw new Error('Birth date is required');
      }
      const createRes = await api.post(`/api/heroes`, {
        heroName: heroName.trim(),
        birthdate: birthdate.toISOString(),
        heroId,
      });
      const created = createRes.data?.hero;
      if (!created) {
        throw new Error('Failed to create hero');
      }

      const genRes = await api.post(`/api/heroes/generate/${heroId}`);
      const updated = genRes.data?.hero;
      if (updated?.images) setImages(updated.images);
      if (updated?.backstory) setBackstory(updated.backstory);
      setStatus('complete');
      track('hero_generate_success', { heroId });
      navigate(`/hero/${heroId}`);
    } catch (error: unknown) {
      console.error('Error creating hero:', error);
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      if (err.response?.data?.error === 'You already have a non-premium hero') {
        setStatus('limit_reached');
        showNotification('warning', 'Hero limit', err.response.data.message ?? 'Upgrade an existing hero first.', true, 6000);
        navigate('/heroes');
      } else {
        setStatus('error');
        showNotification(
          'error',
          'Could not create hero',
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Something went wrong. Please try again.',
          true,
          5000
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const progress = useMemo(() => {
    return (step / 3) * 100;
  }, [step]);

  // Reset store when unmounting if not completed
  React.useEffect(() => {
    return () => {
      if (step < 3) {
        resetHero();
      }
    };
  }, [resetHero, step]);

  // Check if user already has a non-premium hero
  React.useEffect(() => {
    const checkExistingHeroes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await api.get('/api/user/heroes');

        if (response.data?.heroes) {
          const hasNonPremiumHero = response.data.heroes.some(
            (hero: { paymentStatus?: string }) => hero.paymentStatus !== 'paid'
          );

          if (hasNonPremiumHero) {
            showNotification(
              'info',
              'One unpaid hero at a time',
              'Upgrade your existing hero to premium before creating another.',
              true,
              6000
            );
            navigate('/heroes');
          }
        }
      } catch (error) {
        console.error('Error checking existing heroes:', error);
      }
    };

    void checkExistingHeroes();
  }, [navigate, showNotification]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-32 pb-20"
    >
      <MetaTags
        title={`Create your hero | ${PRODUCT_NAME}`}
        description={`Guided creator on ${DOMAIN_LABEL}: birth date, name, then AI portraits and backstory.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/create`}
        robots="noindex,follow"
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-2">Create your cosmic hero</h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          {creatorLimitVariant === 'prominent'
            ? 'Free accounts may keep one unpaid hero at a time—upgrade to add more.'
            : 'Three quick steps, then AI does the heavy lifting.'}
        </p>
        {/* Progress bar */}
        <div className="mb-10">
          <div className="h-2 w-full bg-mystic-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cosmic-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span className={step >= 1 ? 'text-cosmic-500' : ''}>Birth Date</span>
            <span className={step >= 2 ? 'text-cosmic-500' : ''}>Hero Name</span>
            <span className={step >= 3 ? 'text-cosmic-500' : ''}>Preview</span>
          </div>
        </div>
        
        {/* Step 1: Birth Date */}
        {step === 1 && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="bg-mystic-800 p-8 rounded-xl shadow-mystic"
          >
            <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
              <Calendar className="text-cosmic-500" />
              <span>When were you born?</span>
            </h2>
            
            <p className="text-gray-300 mb-6">
              Your birth date determines your Western and Chinese zodiac signs, 
              which influence your hero's powers and appearance.
            </p>
            
            <DatePickerInput
              label="Birth Date"
              selected={birthdate}
              onChange={(date) => {
                setBirthdate(date);
                if (date) setBirthdateError('');
              }}
              error={birthdateError}
              helpText="Select month, day, and year"
            />
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleNextStep} icon={<ChevronRight size={18} />} iconPosition="right">
                Continue
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Hero Name */}
        {step === 2 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="bg-mystic-800 p-8 rounded-xl shadow-mystic"
          >
            <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
              <SparkleIcon className="text-cosmic-500" />
              <span>Name Your Cosmic Hero</span>
            </h2>
            
            <div className="bg-mystic-700/40 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-2">Your Zodiac Influence</h3>
              {zodiacInfo ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cosmic-500 font-medium">{zodiacInfo.western.sign}</p>
                    <p className="text-sm text-gray-300">{zodiacInfo.western.element} Element</p>
                  </div>
                  <div>
                    <p className="text-cosmic-500 font-medium">{zodiacInfo.chinese.sign}</p>
                    <p className="text-sm text-gray-300">{zodiacInfo.chinese.element}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300">Loading your cosmic influence...</p>
              )}
            </div>
            
            <Input
              label="Hero Name"
              placeholder="Enter a mythical name for your hero"
              value={heroName}
              onChange={(e) => {
                setHeroName(e.target.value);
                if (e.target.value.trim()) setHeroNameError('');
              }}
              error={heroNameError}
              helpText="Choose a name that reflects your cosmic persona"
            />
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={handlePreviousStep}
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep} 
                icon={<ChevronRight size={18} />} 
                iconPosition="right"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Step 3: Preview */}
        {step === 3 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="bg-mystic-800 p-8 rounded-xl shadow-mystic"
          >
            <h2 className="text-2xl font-display font-semibold mb-6">Preview Your Hero</h2>
            
            <div className="space-y-6">
              <div className="bg-mystic-700/40 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Hero Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-cosmic-500 font-medium">{heroName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Birth Date</p>
                    <p className="text-white">
                      {birthdate ? birthdate.toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  {zodiacInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-400">Western Sign</p>
                        <p className="text-cosmic-500">{zodiacInfo.western.sign}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Chinese Sign</p>
                        <p className="text-cosmic-500">{zodiacInfo.chinese.sign}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-gray-300 mb-4">
                  We'll generate three unique images of your hero from different angles, along with a personalized backstory based on your zodiac influences.
                </p>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousStep}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateHero} 
                    icon={<SparkleIcon size={18} />}
                    isLoading={loading}
                  >
                    Generate My Hero
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CreatorPage;