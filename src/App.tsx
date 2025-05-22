import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import HeroPage from './pages/HeroPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import SharedHeroPage from './pages/SharedHeroPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HeroesListPage from './pages/HeroesListPage';
import SharedStoryPage from './pages/SharedStoryPage';
import StarBackground from './components/ui/StarBackground';
// Import new pages
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import ZodiacGuidePage from './pages/ZodiacGuidePage';
import NFTBasicsPage from './pages/NFTBasicsPage';
import FAQsPage from './pages/FAQsPage';
import SupportPage from './pages/SupportPage';
// Import blog pages
import BlogPage from './pages/BlogPage';
import BlogZodiacArchetypesPage from './pages/BlogZodiacArchetypesPage';
import BlogAIMythicalJourneysPage from './pages/BlogAIMythicalJourneysPage';
// Import backlink strategy page
import BacklinkStrategyPage from './pages/BacklinkStrategyPage';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import ApiErrorHandler from './components/ApiErrorHandler';

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {}
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Check for token on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);
  
  // Auth functions
  const login = (token: string, user: any) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    // Login success notification will be handled in the LoginPage component
  };
  
  const logout = () => {
    const userName = user?.name || 'Hero';
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Logout notification will be shown by the component that calls logout
  };
  
  const authContextValue = {
    isAuthenticated,
    user,
    token,
    login,
    logout
  };

  return (
    <NotificationProvider>
      <AuthContext.Provider value={authContextValue}>
        <ApiErrorHandler />
        <Router>
          <div className="flex flex-col min-h-screen bg-gradient-to-b from-mystic-900 to-mystic-800 text-white relative overflow-hidden">
            <StarBackground />
            <Header />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route 
                    path="/create" 
                    element={
                      <ProtectedRoute>
                        <CreatorPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/hero/:id" 
                    element={
                      <ProtectedRoute>
                        <HeroPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/checkout/:id" 
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/heroes" 
                    element={
                      <ProtectedRoute>
                        <HeroesListPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/share/:shareId" element={<SharedHeroPage />} />
                  <Route 
                    path="/shared-story" 
                    element={
                      <ProtectedRoute>
                        <SharedStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/shared-story/:roomId" 
                    element={
                      <ProtectedRoute>
                        <SharedStoryPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* New pages */}
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                  <Route path="/zodiac-guide" element={<ZodiacGuidePage />} />
                  <Route path="/nft-basics" element={<NFTBasicsPage />} />
                  <Route path="/faqs" element={<FAQsPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  
                  {/* Blog routes */}
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/zodiac-hero-archetypes" element={<BlogZodiacArchetypesPage />} />
                  <Route path="/blog/ai-mythical-journeys" element={<BlogAIMythicalJourneysPage />} />
                  
                  {/* Marketing strategy */}
                  <Route path="/backlink-strategy" element={<BacklinkStrategyPage />} />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthContext.Provider>
    </NotificationProvider>
  );
}

export default App;