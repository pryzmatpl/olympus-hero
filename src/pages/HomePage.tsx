import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import MetaTags from '../components/ui/MetaTags';

const HomePage: React.FC = () => {
  // @ts-ignore
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-24 pb-16"
    >
      {/* Meta tags for home page */}
      <MetaTags
        title="Cosmic Heroes - Personalized Fantasy Story & AI-Generated Hero Journey"
        description="Discover your zodiac-powered mythical identity with Cosmic Heroes. Create a personalized fantasy story and embark on an AI-generated hero journey."
        image="/logo.jpg"
      />

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center relative">
        <div className="absolute inset-0 bg-cosmic-radial -z-10"></div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6"
        >
          <Sparkles className="h-12 w-12 text-cosmic-500 inline-block animate-pulse-slow" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight"
        >
          Your Personalized <br className="md:hidden" />
          <span className="bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent">
            Fantasy Story
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10"
        >
          Embark on a zodiac hero journey through AI-generated personalized storytelling.
          Create a unique mythical identity based on your cosmic destiny.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <Link to="/create">
            <Button 
              size="lg" 
              icon={<ArrowRight size={20} />} 
              iconPosition="right"
              className="group"
            >
              <span className="group-hover:mr-1 transition-all">
                Start Your Hero Journey
              </span>
            </Button>
          </Link>
        </motion.div>

        {/* Floating Hero Images */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {[{name:"Blazorus", id:1, url:"storage/aries.webp"}, {name:"Energus", id:2, url:"storage/capricorn.webp"}, {name:"Manakuanea", id:3, url:"storage/rooster.webp"}].map((elem) => (
            <motion.div
              key={elem.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 1 + (elem.id * 0.2),
                duration: 0.8,
                y: {
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 4 + (elem.id * 0.5),
                  ease: 'easeInOut'
                }
              }}
              className="relative w-64 h-64 md:w-72 md:h-72 rounded-lg overflow-hidden shadow-cosmic"
            >
              <img 
                src={elem.url}
                alt={`Zodiac Hero Example: ${elem.name}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mystic-900 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 w-full p-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-cosmic-500" />
                <span className="text-sm font-medium">{elem.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Your AI-Generated Hero Journey</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Create your unique zodiac-based character in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Calendar className="h-10 w-10 text-cosmic-500" />,
              title: "Connect With Your Zodiac",
              description: "Your birth date influences your hero's powers and mythical identity."
            },
            {
              icon: <User className="h-10 w-10 text-cosmic-500" />,
              title: "Personalize Your Hero",
              description: "Name and customize your character for a truly personalized fantasy story."
            },
            {
              icon: <Image className="h-10 w-10 text-cosmic-500" />,
              title: "AI-Powered Story Creation",
              description: "Our advanced AI creates unique artwork and backstory based on your cosmic influences."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="bg-gradient-to-b from-mystic-800 to-mystic-900 p-8 rounded-xl shadow-mystic"
            >
              <div className="bg-mystic-700/50 p-3 rounded-full w-fit mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-mystic-gradient p-10 md:p-16 rounded-2xl text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Begin Your Zodiac-Based Character Creation</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Experience AI-driven personalized storytelling that brings your unique cosmic essence to life.
          </p>
          <Link to="/create">
            <Button 
              size="lg" 
              variant="secondary"
              icon={<Sparkles size={18} />} 
            >
              Create Your Personalized Fantasy Story
            </Button>
          </Link>
        </motion.div>
      </section>
    </motion.div>
  );
};

// Import the icons for the features section
const Calendar = Sparkles;
const User = Sparkles;
const Image = Sparkles;

export default HomePage;