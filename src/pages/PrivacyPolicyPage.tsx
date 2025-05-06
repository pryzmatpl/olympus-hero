import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicyPage: React.FC = () => {
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
        Privacy Policy
      </motion.h1>
      
      <div className="prose prose-invert prose-lg max-w-none">
        <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At Cosmic Heroes, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>
          We may collect several types of information from and about users of our Services, including:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Personal identifiers such as name, email address, and crypto wallet addresses</li>
          <li>Usage data including how you interact with our Services</li>
          <li>Transaction data related to your purchases and sales on our platform</li>
          <li>Communications data from your interactions with our customer service</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Collect Your Information</h2>
        <p>
          Information may be collected in several ways, including:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Directly when you provide it to us (e.g., by filling in forms on our website)</li>
          <li>Automatically as you navigate through the site (e.g., usage details, IP addresses, cookies)</li>
          <li>From third parties that interact with us in connection with the Services we perform</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Your Information</h2>
        <p>
          We use your information to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Provide, maintain, and improve our Services</li>
          <li>Process your transactions and send transaction confirmations</li>
          <li>Personalize your user experience</li>
          <li>Communicate with you about products, services, and events</li>
          <li>Respond to your comments and questions</li>
          <li>Protect the security and integrity of our platform</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disclosure of Your Information</h2>
        <p>
          We may disclose personal information that we collect or you provide:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>To fulfill the purpose for which you provide it</li>
          <li>To contractors, service providers, and other third parties we use to support our business</li>
          <li>To comply with any court order, law, or legal process</li>
          <li>If we believe disclosure is necessary to protect the rights, property, or safety of Cosmic Heroes, our users, or others</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Blockchain Data</h2>
        <p>
          Please be aware that when you use our Services to conduct transactions on the blockchain, your public wallet address and transaction history are publicly viewable on the blockchain. We do not control and are not responsible for the processing of information on the blockchain.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Security</h2>
        <p>
          We implement measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, we cannot guarantee the absolute security of your information.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete the personal information we have about you.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
        <p>
          Our Services are not intended for children under 18 years of age, and we do not knowingly collect personal information from children under 18.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to Our Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice on our website.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Information</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at privacy@cosmicheroes.com.
        </p>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicyPage; 