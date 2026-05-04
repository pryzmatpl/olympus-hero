import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import MetaTags from '../components/ui/MetaTags';
import JsonLd from '../components/seo/JsonLd';
import { faqCategories } from '../content/faqData';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';

const FAQsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredFAQs = searchTerm
    ? faqCategories
        .map((category) => ({
          ...category,
          faqs: category.faqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.faqs.length > 0)
    : faqCategories;

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  let globalFaqIndex = 0;

  const faqJsonLd = useMemo(() => {
    const mainEntity = faqCategories.flatMap((c) =>
      c.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      }))
    );
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity,
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16 max-w-4xl"
    >
      <MetaTags
        title={`FAQs | ${PRODUCT_NAME} (${DOMAIN_LABEL})`}
        description="Answers about creating AI fantasy heroes, zodiac-inspired stories, premium unlocks, billing with Stripe, and shared adventures."
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/faqs`}
      />
      <JsonLd id="jsonld-faq-page" data={faqJsonLd} />

      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8 text-center"
      >
        Frequently Asked Questions
      </motion.h1>

      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-8">
        Help for {PRODUCT_NAME} on {DOMAIN_LABEL}: AI heroes, premium unlocks, and shared stories.
      </p>

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

      <div className="space-y-8">
        {filteredFAQs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-mystic-800 border border-mystic-700 rounded-lg overflow-hidden">
            <h2 className="bg-mystic-700 text-white text-xl font-display font-semibold p-4">
              {category.category}
            </h2>
            <div className="p-4 space-y-2">
              {category.faqs.map((faq) => {
                const currentGlobalIndex = globalFaqIndex++;
                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: currentGlobalIndex * 0.05 }}
                    className="border-b border-mystic-700 last:border-b-0"
                  >
                    <button
                      type="button"
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
                        animate={{ opacity: 1, height: 'auto' }}
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

      <div className="mt-16 bg-mystic-800 border border-mystic-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Still Have Questions?</h2>
        <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
          If you couldn&apos;t find the answer you were looking for, our support team is here to help.
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
