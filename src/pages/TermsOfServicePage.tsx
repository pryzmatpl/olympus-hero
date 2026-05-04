import React from 'react';
import { motion } from 'framer-motion';
import MetaTags from '../components/ui/MetaTags';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN, SUPPORT_EMAIL } from '../constants/brand';

const TermsOfServicePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16 max-w-4xl"
    >
      <MetaTags
        title={`Terms of Service | ${PRODUCT_NAME}`}
        description={`Terms for using ${PRODUCT_NAME} on ${DOMAIN_LABEL}: accounts, digital goods, optional future on-chain features, and limitations of liability.`}
        image="/logo.jpg"
        canonical={`${SITE_ORIGIN}/terms-of-service`}
      />

      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8"
      >
        Terms of Service
      </motion.h1>

      <div className="prose prose-invert prose-lg max-w-none">
        <p>
          Last Updated:{' '}
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          Welcome to {PRODUCT_NAME}. By accessing or using our website, services, applications, and content
          (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service
          (&quot;Terms&quot;). These Terms affect your legal rights and obligations, so if you do not agree to these
          Terms, do not access or use the Services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Services</h2>
        <p>
          {PRODUCT_NAME} (operated at {DOMAIN_LABEL}) provides tools to create AI-assisted fantasy hero profiles,
          including generated images and narrative content, account-based storage, optional premium upgrades processed
          via Stripe, collaborative story features, and related educational content. The Services may evolve over time.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Eligibility</h2>
        <p>
          You must be at least 18 years old to use our Services. By agreeing to these Terms, you represent and warrant
          that you are at least 18 years of age.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Account Registration</h2>
        <p>
          To access certain features of the Services, you may be required to register for an account. You agree to
          provide accurate, current, and complete information during the registration process and to update such
          information to keep it accurate, current, and complete.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Purchases, digital goods, and optional blockchain features</h2>
        <p>
          Premium features and add-ons are offered as digital goods or entitlements tied to your account, unless we
          expressly describe a different delivery mechanism at checkout. Payments are processed by our payment
          processor; we do not store your full card number on our servers.
        </p>
        <p>
          We may explore optional on-chain features in the future (for example, voluntary minting). Unless and until a
          feature is clearly offered and accepted by you at checkout, you should not assume any blockchain transaction
          is required to use the Services.
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>We do not guarantee that any generated content will meet every expectation or use case.</li>
          <li>Digital goods may depend on continued operation of the Services and third-party providers (including AI vendors).</li>
          <li>If optional blockchain features are offered later, they may involve network fees and wallet security risks that you must evaluate independently.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property Rights</h2>
        <p>
          The Services, including software, branding, prompts, layouts, and aggregated improvements, are owned by us
          and our licensors. Subject to these Terms and any additional terms presented at purchase, we grant you a
          limited, non-exclusive, non-transferable license to use the outputs made available to you through the
          Services for personal, non-commercial uses unless we expressly allow broader use in writing.
        </p>
        <p>
          You may not scrape, resell, or systematically redistribute the Services or generated outputs in a way that
          competes with the Services or violates applicable law or third-party rights.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, {PRODUCT_NAME} shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including without limitation, loss of profits, data, use,
          goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use
          the Services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
        <p>
          These Terms shall be governed by the laws of the jurisdiction in which {PRODUCT_NAME} is established, without
          regard to its conflict of law principles.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. If we make changes to these Terms, we will provide
          notice of such changes by updating the date at the top of these Terms and by maintaining a current version of
          the Terms at our website. Your continued use of our Services confirms your acceptance of our Terms, as
          amended.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cosmic-400">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </motion.div>
  );
};

export default TermsOfServicePage;
