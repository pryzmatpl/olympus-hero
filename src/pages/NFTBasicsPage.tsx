import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Shield, Wallet, ArrowRight, Layers } from 'lucide-react';
import Button from '../components/ui/Button';
import MetaTags from '../components/ui/MetaTags';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';

const NFTBasicsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16 max-w-4xl"
    >
      <MetaTags
        title={`NFT Basics | ${PRODUCT_NAME}`}
        description={`Educational guide to NFTs and how ${PRODUCT_NAME} on ${DOMAIN_LABEL} uses Stripe for premium digital goods today.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/nft-basics`}
      />

      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8 text-center"
      >
        NFT Basics
      </motion.h1>

      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-16">
        A plain-language overview of NFTs—and how {PRODUCT_NAME} delivers AI hero content today with card checkout, not
        crypto.
      </p>

      <div className="space-y-12">
        <Section title="What are NFTs?" icon={<FileText className="w-8 h-8 text-cosmic-500" />}>
          <p>
            NFT stands for &quot;Non-Fungible Token.&quot; Unlike interchangeable coins on a network, an NFT is a unique
            digital record that can be linked to art, collectibles, tickets, or game items.
          </p>
          <p>
            People talk about NFTs together with blockchains because the chain can act as a public ledger for who holds
            which token. That does not change the fact that most day-to-day products—including Cosmic Heroes—deliver
            value as normal digital goods in your account.
          </p>
        </Section>

        <Section title="How do NFTs work (high level)?" icon={<Layers className="w-8 h-8 text-cosmic-500" />}>
          <p>
            A blockchain is a shared database operated by many computers. &quot;Minting&quot; writes a new row of
            ownership into that database, and transfers move that row from wallet to wallet.
          </p>
          <p>
            NFTs can be useful when you truly need portable, public ownership on-chain. They also come with wallet
            security responsibilities and network fees—so we only recommend them when the product experience clearly
            benefits.
          </p>
        </Section>

        <Section title={`How ${PRODUCT_NAME} works today`} icon={<Shield className="w-8 h-8 text-cosmic-500" />}>
          <p>
            On {DOMAIN_LABEL}, you create a hero with AI-generated portraits and story content tied to your account.
            Premium unlocks are purchased with Stripe. You do not need a crypto wallet to use the core product.
          </p>
          <ul className="list-disc pl-6 my-4 space-y-2">
            <li>
              <strong className="text-white">Digital goods:</strong> You receive the features described at checkout
              (full images, full story, downloads, and shared-story access where applicable).
            </li>
            <li>
              <strong className="text-white">Account-based access:</strong> Your purchases are attached to your login,
              similar to other creative web apps.
            </li>
            <li>
              <strong className="text-white">Roadmap transparency:</strong> If we ship optional on-chain minting later,
              we will announce it clearly and make it opt-in—not a surprise requirement.
            </li>
          </ul>
        </Section>

        <Section title="Wallets and blockchains (optional future)" icon={<Wallet className="w-8 h-8 text-cosmic-500" />}>
          <p>
            Some collectors use wallets like MetaMask to hold tokens on Ethereum or other networks. Cosmic Heroes may
            explore optional wallet fields for future features, but you should assume the live product is{' '}
            <strong className="text-white">email + Stripe</strong> unless we publish otherwise.
          </p>
          <p>
            If you want to learn wallets for your own education, use official wallet documentation and never share your
            seed phrase with anyone—including support.
          </p>
        </Section>
      </div>

      <div className="mt-16 bg-mystic-800 border border-mystic-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Ready to create your hero?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Skip the complexity: sign up on {DOMAIN_LABEL}, run the creator flow, and upgrade only if you love the result.
        </p>
        <Link to="/register" state={{ from: { pathname: '/create' } }}>
          <Button icon={<ArrowRight size={18} />}>Create a free account</Button>
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
      <div className="text-gray-300 space-y-4">{children}</div>
    </div>
  );
};

export default NFTBasicsPage;
