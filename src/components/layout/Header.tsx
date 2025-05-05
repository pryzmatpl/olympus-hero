import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-mystic-900 shadow-lg py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="text-cosmic-500 h-6 w-6" />
          <span className="font-display text-xl font-semibold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent">
            Cosmic Heroes
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <NavLink to="/" isActive={location.pathname === '/'}>
            Home
          </NavLink>
          <NavLink to="/create" isActive={location.pathname === '/create'}>
            Create Hero
          </NavLink>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={()=>{window.location.assign("/login")}}
            className="bg-gradient-to-r from-mystic-700 to-mystic-600 hover:from-mystic-600 hover:to-mystic-500 px-6 py-2 rounded-full text-white font-medium transition-all shadow-mystic"
          >
            Sign In
          </motion.button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-mystic-800 border-t border-mystic-700"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <NavLink
              to="/"
              isActive={location.pathname === '/'}
              isMobile={true}
            >
              Home
            </NavLink>
            <NavLink
              to="/create"
              isActive={location.pathname === '/create'}
              isMobile={true}
            >
              Create Hero
            </NavLink>
            <button className="bg-gradient-to-r from-mystic-700 to-mystic-600 hover:from-mystic-600 hover:to-mystic-500 px-6 py-3 rounded-full text-white font-medium w-full text-center transition-all shadow-mystic">
              Sign In
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  isMobile?: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({
  to,
  isActive,
  isMobile = false,
  children,
}) => {
  return (
    <Link
      to={to}
      className={`relative font-medium transition-all ${
        isMobile ? 'block w-full py-2' : ''
      } ${isActive ? 'text-cosmic-500' : 'text-white hover:text-cosmic-500'}`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className={`absolute bg-cosmic-500 ${
            isMobile ? 'w-1 h-full top-0 left-0' : 'h-0.5 w-full bottom-0 left-0'
          }`}
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

export default Header;