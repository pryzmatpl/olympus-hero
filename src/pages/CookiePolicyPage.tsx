import React from 'react';
import { motion } from 'framer-motion';

const CookiePolicyPage: React.FC = () => {
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
        Cookie Policy
      </motion.h1>
      
      <div className="prose prose-invert prose-lg max-w-none">
        <p>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          This Cookie Policy explains how Cosmic Heroes ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. What Are Cookies?</h2>
        <p>
          Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
        </p>
        <p>
          Cookies set by the website owner (in this case, Cosmic Heroes) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Why Do We Use Cookies?</h2>
        <p>
          We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve cookies through our website for analytics, personalization, and advertising purposes.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Types of Cookies We Use</h2>
        <p>
          The specific types of first- and third-party cookies served through our website and the purposes they perform include:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.</li>
          <li><strong>Performance/Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.</li>
          <li><strong>Functionality Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.</li>
          <li><strong>Targeting/Advertising Cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are based on your interests.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. How Can You Control Cookies?</h2>
        <p>
          You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by adjusting the settings in your browser.
        </p>
        <p>
          Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.allaboutcookies.org" className="text-cosmic-500 hover:underline">www.allaboutcookies.org</a>.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. What About Other Tracking Technologies?</h2>
        <p>
          Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our website or opened an email that we have sent them.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. How Often Will We Update This Cookie Policy?</h2>
        <p>
          We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
        <p>
          If you have any questions about our use of cookies or other technologies, please email us at cookies@cosmicheroes.com.
        </p>
      </div>
    </motion.div>
  );
};

export default CookiePolicyPage; 