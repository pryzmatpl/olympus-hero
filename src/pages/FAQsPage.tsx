import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const FAQsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // FAQ data
  const faqCategories = [
    {
      category: 'Getting Started',
      faqs: [
        {
          question: 'What is Cosmic Heroes?',
          answer: 'Cosmic Heroes is a platform where you can create, collect, and share unique NFT heroes based on zodiac mythology and cosmic elements. Each hero is a one-of-a-kind digital collectible with special attributes and abilities.'
        },
        {
          question: 'How do I create my own Cosmic Hero?',
          answer: 'To create your own Cosmic Hero, you need to sign up for an account, then navigate to the "Create Hero" page. There, you can customize your hero based on zodiac signs, elements, and various visual attributes. Once you\'re satisfied with your creation, you can mint it as an NFT by completing the purchase process.'
        },
        {
          question: 'Do I need cryptocurrency to use Cosmic Heroes?',
          answer: 'Yes, to mint NFTs on our platform, you\'ll need cryptocurrency (specifically Ethereum) to complete transactions. However, you can browse the platform, customize heroes, and explore shared stories without cryptocurrency.'
        }
      ]
    },
    {
      category: 'Account & Wallet',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'To create an account, click on the "Register" button in the top-right corner of the homepage. Fill in your details, verify your email address, and set up a secure password. You can also link your crypto wallet during this process or later in your profile settings.'
        },
        {
          question: 'Which wallets are supported?',
          answer: 'Cosmic Heroes currently supports several popular Ethereum wallets including MetaMask, WalletConnect, and Coinbase Wallet. We plan to add support for more wallet options in the future.'
        },
        {
          question: 'How do I connect my wallet?',
          answer: 'You can connect your wallet through your profile settings or during the checkout process when creating a hero. Click on "Connect Wallet" and select your preferred wallet provider. Follow the prompts in your wallet application to complete the connection.'
        }
      ]
    },
    {
      category: 'NFTs & Ownership',
      faqs: [
        {
          question: 'What rights do I have over my Cosmic Hero NFT?',
          answer: 'When you purchase a Cosmic Hero NFT, you own the digital asset as recorded on the blockchain. You can display, sell, or trade your NFT. You also gain access to use your hero in shared stories and other platform features. However, Cosmic Heroes retains the intellectual property rights to the underlying artwork and concept.'
        },
        {
          question: 'Can I sell my Cosmic Hero NFT?',
          answer: 'Yes, you can sell your Cosmic Hero NFT through our marketplace (coming soon) or transfer it to a third-party marketplace that supports the same blockchain standard. All sales and transfers will be recorded on the blockchain.'
        },
        {
          question: 'What happens if I lose access to my wallet?',
          answer: 'If you lose access to your wallet, you may lose access to your NFTs since they are tied to your wallet address. This is why it\'s crucial to secure your wallet\'s recovery phrase or private keys. Cosmic Heroes cannot recover lost wallets or NFTs on your behalf.'
        }
      ]
    },
    {
      category: 'Features & Gameplay',
      faqs: [
        {
          question: 'What are Shared Stories?',
          answer: 'Shared Stories is a feature that allows multiple hero owners to collaborate on interactive adventures. You can join existing story rooms or create your own, inviting other users to participate with their heroes. Each decision affects the story\'s outcome, creating a unique narrative experience.'
        },
        {
          question: 'Are there any benefits to owning multiple heroes?',
          answer: 'Yes! Owning multiple heroes allows you to participate in more stories simultaneously, access special events, and potentially unlock unique combinations and interactions between your heroes. Some heroes with complementary zodiac signs may also gain bonuses when used together.'
        },
        {
          question: 'Will there be updates and new features?',
          answer: 'Absolutely. We\'re constantly working on new features, events, and improvements for Cosmic Heroes. Our roadmap includes expanded story options, hero battles, seasonal events based on astrological movements, and much more. Stay tuned to our announcements for the latest updates!'
        }
      ]
    },
    {
      category: 'Technical Support',
      faqs: [
        {
          question: 'What should I do if a transaction fails?',
          answer: 'If your transaction fails, first check your wallet to ensure you have sufficient funds for both the purchase and gas fees. If the issue persists, wait a few minutes and try again, as blockchain networks can sometimes be congested. For ongoing issues, please contact our support team with details of the failed transaction.'
        },
        {
          question: 'My hero image isn\'t displaying correctly. What should I do?',
          answer: 'If your hero image isn\'t displaying correctly, try refreshing your browser or clearing your cache. If the problem continues, check if the issue occurs across different devices or browsers. If it does, please contact support with your hero ID and screenshots of the issue.'
        },
        {
          question: 'How can I report a bug or suggest a feature?',
          answer: 'We welcome your feedback! You can report bugs or suggest features through the "Support" page, or by emailing support@cosmicheroes.com. Please provide as much detail as possible, including steps to reproduce any bugs you encounter.'
        }
      ]
    }
  ];

  // Filter FAQs based on search term
  const filteredFAQs = searchTerm 
    ? faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq => 
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.faqs.length > 0)
    : faqCategories;

  // Toggle FAQ accordion
  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Track overall FAQ index for animations
  let globalFaqIndex = 0;

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
        Frequently Asked Questions
      </motion.h1>
      
      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-8">
        Get answers to common questions about Cosmic Heroes, NFTs, and how our platform works.
      </p>
      
      {/* Search bar */}
      <div className="relative mb-12 max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-mystic-700 rounded-md bg-mystic-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredFAQs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-mystic-800 border border-mystic-700 rounded-lg overflow-hidden">
            <h2 className="bg-mystic-700 text-white text-xl font-display font-semibold p-4">
              {category.category}
            </h2>
            <div className="p-4 space-y-2">
              {category.faqs.map((faq, index) => {
                const currentGlobalIndex = globalFaqIndex++;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: currentGlobalIndex * 0.05 }}
                    className="border-b border-mystic-700 last:border-b-0"
                  >
                    <button
                      onClick={() => toggleFAQ(currentGlobalIndex)}
                      className="w-full text-left py-4 px-2 flex justify-between items-center hover:bg-mystic-750 rounded transition-colors"
                    >
                      <h3 className="font-medium text-white pr-8">{faq.question}</h3>
                      {activeIndex === currentGlobalIndex ? (
                        <ChevronUp className="h-5 w-5 text-cosmic-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {activeIndex === currentGlobalIndex && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-2 pb-4 text-gray-300"
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFAQs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400">No FAQs found matching your search. Try different keywords.</p>
          </div>
        )}
      </div>
      
      {/* Still have questions section */}
      <div className="mt-16 bg-mystic-800 border border-mystic-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Still Have Questions?</h2>
        <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
          If you couldn't find the answer you were looking for, our support team is here to help.
        </p>
        <a 
          href="/support"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-cosmic-500 hover:bg-cosmic-600 transition"
        >
          Contact Support
        </a>
      </div>
    </motion.div>
  );
};

export default FAQsPage; 