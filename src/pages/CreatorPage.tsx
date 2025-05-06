import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, SparkleIcon } from 'lucide-react';
import DatePickerInput from '../components/form/DatePickerInput';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useZodiac } from '../hooks/useZodiac';
import { useHeroStore } from '../store/heroStore';
import api from '../utils/api.ts';
import { Guid } from 'guid-typescript';
import { generateHeroBackstory } from '../utils/generateHeroPrompt';

const CreatorPage: React.FC = () => {
  const navigate = useNavigate();
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

    const user = localStorage.getItem('user');
    const userId = user["id"];
    console.log(user);

    try {
      const response = await api.post(`/api/heroes`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroName: heroName,
          birthdate: birthdate,
          zodiacInfo: zodiacInfo,
          heroId: heroId,
          userId: userId,
        }),
      });

      console.log(response);

      const data = response.data;

      if (data.hero) {
        try {
          const response = await api.post(`/api/heroes/generate/${heroId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            body: data
          });

          setImages(response.hero.images);
          setBackstory(response.hero.backstory);
          setStatus('complete');

        } catch (error) {
          console.error('Error generating hero content:', error);
        }

        // Navigate to the hero page with a preview ID
        navigate(`/hero/${heroId}`);
      } else {
        throw new Error('Failed to generate hero content');
      }
    } catch (error) {
      console.error('Error creating hero:', error);
      setStatus('error');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-32 pb-20"
    >
      <div className="max-w-2xl mx-auto">
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
              helpText="This will be used to calculate your zodiac signs"
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