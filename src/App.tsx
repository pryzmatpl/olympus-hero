import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import HeroPage from './pages/HeroPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import StarBackground from './components/ui/StarBackground';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-mystic-900 to-mystic-800 text-white relative overflow-hidden">
        <StarBackground />
        <Header />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreatorPage />} />
              <Route path="/hero/:id" element={<HeroPage />} />
              <Route path="/checkout/:id" element={<CheckoutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;