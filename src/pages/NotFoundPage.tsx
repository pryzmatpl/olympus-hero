import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
    >
      <motion.h1
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-8xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-6"
      >
        404
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-medium mb-4"
      >
        Lost in the Cosmic Void
      </motion.p>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 mb-8 max-w-md"
      >
        The celestial page you're looking for has drifted beyond our reach.
        Let's navigate back to a known constellation.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link to="/">
          <Button icon={<Home size={18} />}>
            Return to Homepage
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default NotFoundPage;