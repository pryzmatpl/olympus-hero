import React, { createContext, useState, useEffect } from 'react';
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
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);
  
  // Auth functions
  const login = (token: string, user: any) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const authContextValue = {
    isAuthenticated,
    user,
    token,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
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
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;