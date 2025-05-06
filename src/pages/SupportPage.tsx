import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, Phone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Button from '../components/ui/Button';

const SupportPage: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general-inquiry'
  });

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');

    // Simulate API call
    try {
      // In a real application, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general-inquiry'
      });
    } catch (error) {
      // Error handling
      setSubmitStatus('error');
      setErrorMessage('There was a problem submitting your request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8 text-center"
      >
        Support Center
      </motion.h1>
      
      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-16">
        Need help with your Cosmic Heroes journey? Our support team is here to assist you with any 
        questions or issues you might encounter.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-mystic-800 border border-mystic-700 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Contact Options</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-cosmic-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Email Support</h3>
                  <p className="text-gray-300">support@mythicalhero.me</p>
                  <p className="text-sm text-gray-400">Responses within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-cosmic-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Live Chat</h3>
                  <p className="text-gray-300">Available on weekdays</p>
                  <p className="text-sm text-gray-400">9am - 5pm ET</p>
                </div>
              </div>
              
              {/*<div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-cosmic-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Phone Support</h3>
                  <p className="text-gray-300">+1 (888) 555-HERO</p>
                  <p className="text-sm text-gray-400">Premium users only</p>
                </div>
              </div>*/}
            </div>
          </div>
          
          <div className="bg-mystic-800 border border-mystic-700 rounded-lg p-6">
            <h2 className="text-xl font-display font-bold text-white mb-4">Support Hours</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Monday - Friday:</span>
                <span className="text-white">9:00 AM - 8:00 PM ET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Saturday:</span>
                <span className="text-white">10:00 AM - 6:00 PM ET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sunday:</span>
                <span className="text-white">Closed</span>
              </div>
            </div>
          </div>
          
          <div className="bg-cosmic-900 border border-cosmic-800 rounded-lg p-6">
            <h2 className="text-xl font-display font-bold text-white mb-2">Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <a href="/faqs" className="text-cosmic-400 hover:text-cosmic-300 transition flex items-center gap-2">
                  <span>→</span> Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="/nft-basics" className="text-cosmic-400 hover:text-cosmic-300 transition flex items-center gap-2">
                  <span>→</span> NFT Basics Guide
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="text-cosmic-400 hover:text-cosmic-300 transition flex items-center gap-2">
                  <span>→</span> Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-cosmic-400 hover:text-cosmic-300 transition flex items-center gap-2">
                  <span>→</span> Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Right column - Contact form */}
        <div className="lg:col-span-2">
          <div className="bg-mystic-800 border border-mystic-700 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Send a Message</h2>
            
            {submitStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-start gap-3 mb-4"
              >
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Message Sent Successfully!</h3>
                  <p className="text-gray-300">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3 mb-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-white">Error</h3>
                      <p className="text-gray-300">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-white font-medium mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-mystic-900 border border-mystic-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-white font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-mystic-900 border border-mystic-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-white font-medium mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-mystic-900 border border-mystic-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                  >
                    <option value="general-inquiry">General Inquiry</option>
                    <option value="technical-issue">Technical Issue</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="account">Account Management</option>
                    <option value="feature-request">Feature Request</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-white font-medium mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-mystic-900 border border-mystic-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                    placeholder="What's your message about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-white font-medium mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-2 bg-mystic-900 border border-mystic-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent"
                    placeholder="Describe your issue or question in detail..."
                    required
                  />
                </div>
                
                <div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                    icon={submitting ? <Loader className="animate-spin" size={18} /> : undefined}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SupportPage; 