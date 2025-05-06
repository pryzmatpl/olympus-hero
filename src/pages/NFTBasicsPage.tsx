import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Shield, Wallet, Coins, ArrowRight, Layers } from 'lucide-react';
import Button from '../components/ui/Button';

const NFTBasicsPage: React.FC = () => {
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
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8 text-center"
      >
        NFT Basics
      </motion.h1>
      
      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-16">
        New to the world of NFTs? This guide will help you understand the basics of non-fungible tokens
        and how they work in the Cosmic Heroes universe.
      </p>
      
      <div className="space-y-12">
        <Section 
          title="What are NFTs?" 
          icon={<FileText className="w-8 h-8 text-cosmic-500" />}
        >
          <p>
            NFT stands for "Non-Fungible Token." Unlike cryptocurrencies such as Bitcoin or Ethereum, which are identical 
            and interchangeable (fungible), NFTs are unique digital assets with distinctive values and properties.
          </p>
          <p>
            Each NFT contains unique identification codes and metadata that distinguish it from any other token. 
            They can represent ownership of digital items such as art, collectibles, music, videos, or in our case—unique 
            cosmic heroes with special attributes and powers.
          </p>
        </Section>
        
        <Section 
          title="How do NFTs work?" 
          icon={<Layers className="w-8 h-8 text-cosmic-500" />}
        >
          <p>
            NFTs are created or "minted" from digital objects that represent both tangible and intangible items. 
            They are stored on a blockchain—a distributed public ledger that records transactions.
          </p>
          <p>
            The blockchain serves as a public certificate of authenticity and proof of ownership. When you purchase 
            an NFT from Cosmic Heroes, the transaction is recorded on the blockchain, providing you with verifiable 
            ownership of that unique digital asset.
          </p>
        </Section>
        
        <Section 
          title="NFTs in Cosmic Heroes" 
          icon={<Shield className="w-8 h-8 text-cosmic-500" />}
        >
          <p>
            In the Cosmic Heroes universe, each hero you create becomes a unique NFT with attributes influenced by 
            zodiac signs, cosmic elements, and your customization choices. These NFTs have special properties:
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>
              <strong className="text-white">Uniqueness:</strong> No two Cosmic Heroes are exactly alike. Each has its 
              own combination of traits, abilities, and visual appearance.
            </li>
            <li>
              <strong className="text-white">Verifiable Ownership:</strong> Your ownership of a Cosmic Hero is recorded 
              on the blockchain, providing indisputable proof that you own that hero.
            </li>
            <li>
              <strong className="text-white">Transferability:</strong> You can keep, trade, or sell your Cosmic Heroes 
              to other collectors.
            </li>
            <li>
              <strong className="text-white">Utility:</strong> Your Cosmic Heroes can be used in shared stories, special events, 
              and future platform features.
            </li>
          </ul>
        </Section>
        
        <Section 
          title="Getting Started with Wallets" 
          icon={<Wallet className="w-8 h-8 text-cosmic-500" />}
        >
          <p>
            To purchase, store, and manage NFTs, you need a digital wallet that supports the blockchain where our NFTs are minted. 
            Cosmic Heroes uses the Ethereum blockchain, so you'll need an Ethereum-compatible wallet.
          </p>
          <p>
            Popular options include MetaMask, Trust Wallet, and Coinbase Wallet. These wallets store your private keys and 
            allow you to interact with the blockchain.
          </p>
          <div className="mt-6">
            <h4 className="text-white font-semibold mb-2">Basic Wallet Setup Steps:</h4>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300">
              <li>Download a wallet application or browser extension</li>
              <li>Create a new wallet and secure your recovery phrase</li>
              <li>Connect your wallet to Cosmic Heroes when prompted</li>
              <li>Ensure you have enough cryptocurrency to cover the cost of the NFT and transaction fees</li>
            </ol>
          </div>
        </Section>
        
        <Section 
          title="Buying and Selling NFTs" 
          icon={<Coins className="w-8 h-8 text-cosmic-500" />}
        >
          <p>
            After setting up your wallet, you're ready to start collecting Cosmic Heroes:
          </p>
          <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-300">
            <li>Create your own custom Cosmic Hero on our platform</li>
            <li>Complete the purchase using cryptocurrency from your connected wallet</li>
            <li>Once the transaction is confirmed, the NFT will appear in your collection</li>
          </ol>
          <p>
            To sell your Cosmic Heroes, you can list them on our platform marketplace (coming soon) or transfer them 
            to compatible third-party NFT marketplaces.
          </p>
        </Section>
      </div>
      
      <div className="mt-16 bg-mystic-800 border border-mystic-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Ready to Create Your First Cosmic Hero?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Armed with your new knowledge of NFTs, dive into the Cosmic Heroes universe and create a unique character 
          that reflects your zodiac powers and cosmic destiny.
        </p>
        <Link to="/create">
          <Button icon={<ArrowRight size={18} />}>
            Start Creating Now
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-mystic-800 border border-mystic-700 rounded-lg p-8">
      <div className="flex items-center gap-4 mb-4">
        {icon}
        <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
      </div>
      <div className="text-gray-300 space-y-4">
        {children}
      </div>
    </div>
  );
};

export default NFTBasicsPage; 