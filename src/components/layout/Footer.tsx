import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Facebook, Sparkles } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-mystic-900 border-t border-mystic-700 pt-12 pb-6 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="text-cosmic-500 h-6 w-6" />
              <span className="font-display text-xl font-semibold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent">
                Cosmic Heroes
              </span>
            </Link>
            <p className="text-gray-300 text-sm mb-4">
              Discover your mythical destiny through the power of zodiac influences.
            </p>
            <div className="flex space-x-4">
              <SocialIcon icon={<Twitter size={18} />} />
              <SocialIcon icon={<Instagram size={18} />} />
              <SocialIcon icon={<Facebook size={18} />} />
              <SocialIcon icon={<Github size={18} />} />
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/create">Create Hero</FooterLink>
              <FooterLink href="#">Gallery</FooterLink>
              <FooterLink href="#">About Us</FooterLink>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <FooterLink href="#">Zodiac Guide</FooterLink>
              <FooterLink href="#">NFT Basics</FooterLink>
              <FooterLink href="#">FAQs</FooterLink>
              <FooterLink href="#">Support</FooterLink>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <FooterLink href="#">Terms of Service</FooterLink>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Cookie Policy</FooterLink>
              <FooterLink href="#">Contact Us</FooterLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-mystic-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Cosmic Heroes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children }) => {
  return (
    <li>
      <Link
        to={href}
        className="text-gray-400 hover:text-cosmic-500 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
};

interface SocialIconProps {
  icon: React.ReactNode;
}

const SocialIcon: React.FC<SocialIconProps> = ({ icon }) => {
  return (
    <a
      href="#"
      className="text-gray-400 hover:text-cosmic-500 transition-colors p-2 rounded-full hover:bg-mystic-800"
    >
      {icon}
    </a>
  );
};

export default Footer;