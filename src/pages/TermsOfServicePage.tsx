import React from 'react';
import { motion } from 'framer-motion';

const TermsOfServicePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16 max-w-4xl"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8"
      >
        Terms of Service
      </motion.h1>
      
      <div className="prose prose-invert prose-lg max-w-none">
        <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          Welcome to Cosmic Heroes. By accessing or using our website, services, applications, and content (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). These Terms affect your legal rights and obligations, so if you do not agree to these Terms, do not access or use the Services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Services</h2>
        <p>
          Cosmic Heroes provides a platform for users to create, buy, sell, and collect digital assets based on zodiac mythology. Our Services may include the creation, purchase, and management of non-fungible tokens (NFTs) representing digital collectibles.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Eligibility</h2>
        <p>
          You must be at least 18 years old to use our Services. By agreeing to these Terms, you represent and warrant that you are at least 18 years of age.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Account Registration</h2>
        <p>
          To access certain features of the Services, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Digital Assets and NFTs</h2>
        <p>
          The Services may allow you to create or purchase digital assets in the form of NFTs. You acknowledge that:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>We do not guarantee the value of any NFT</li>
          <li>NFTs are intangible digital assets that exist only by virtue of the ownership record maintained in the blockchain network</li>
          <li>We cannot guarantee that any NFTs you purchase will continue to exist or be accessible indefinitely</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property Rights</h2>
        <p>
          When you purchase an NFT, you own the NFT itself, which is a digital record on the blockchain. Unless explicitly stated otherwise, you do not own the intellectual property rights in the underlying content that the NFT represents.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Cosmic Heroes shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
        <p>
          These Terms shall be governed by the laws of the jurisdiction in which Cosmic Heroes is established, without regard to its conflict of law principles.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. If we make changes to these Terms, we will provide notice of such changes by updating the date at the top of these Terms and by maintaining a current version of the Terms at our website. Your continued use of our Services confirms your acceptance of our Terms, as amended.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at support@cosmicheroes.com.
        </p>
      </div>
    </motion.div>
  );
};

export default TermsOfServicePage; 