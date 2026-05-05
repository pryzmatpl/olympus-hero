import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../App';
import Button from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';

type Hero = {
  id: string;
  name: string;
  status: string;
  images: Array<{ url: string }>;
  paymentStatus: 'unpaid' | 'processing' | 'paid';
  westernZodiac: {
    sign: string;
    element: string;
  };
  chineseZodiac: {
    sign: string;
    element: string;
  };
};

const HeroesListPage: React.FC = () => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recreatingId, setRecreatingId] = useState<string | null>(null);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchHeroes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/user/heroes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.heroes) {
        setHeroes(response.data.heroes);
      }
    } catch (err) {
      console.error('Error fetching heroes:', err);
      setError('Failed to load heroes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHeroes();
  }, [fetchHeroes]);

  const handleRecreate = async (e: React.MouseEvent, heroId: string) => {
    e.stopPropagation();
    setRecreatingId(heroId);
    try {
      const response = await api.post(`/api/heroes/generate/${heroId}`, {});
      const updated = response.data?.hero as Hero | undefined;
      if (updated) {
        setHeroes((prev) =>
          prev.map((h) => (h.id === heroId ? { ...h, ...updated } : h))
        );
        showNotification('success', 'Hero ready', 'Images and backstory were generated successfully.');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string }; status?: number } };
      const msg =
        ax.response?.data?.message ||
        ax.response?.data?.error ||
        'Could not regenerate this hero. Try again in a moment.';
      showNotification('error', 'Regeneration failed', msg);
    } finally {
      setRecreatingId(null);
    }
  };

  // Filter heroes based on search term
  const filteredHeroes = heroes.filter(hero => 
    hero.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-32 pb-20"
    >
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Your Cosmic Heroes
            </h1>
            <p className="text-gray-300">
              Browse and manage all your created heroes
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/create">
              <Button 
                variant="primary" 
                size="md"
                icon={<Plus size={16} />}
                disabled={heroes.some(hero => hero.paymentStatus !== 'paid')}
              >
                Create New Hero
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Non-premium hero limit notice */}
        {heroes.some(hero => hero.paymentStatus !== 'paid') && (
          <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <p className="text-amber-400 text-sm">
              <strong>Note:</strong> You can only have one non-premium hero at a time. 
              To create a new hero, please upgrade your existing non-premium hero to premium status.
            </p>
          </div>
        )}
        
        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search your heroes by name..."
            className="bg-mystic-800 w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-cosmic-500 focus:outline-none"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Heroes List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cosmic-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-mystic-800 rounded-xl">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">Failed to Load Heroes</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => fetchHeroes()}>Try Again</Button>
          </div>
        ) : filteredHeroes.length === 0 ? (
          <div className="text-center py-16 bg-mystic-800 rounded-xl">
            {searchTerm ? (
              <>
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-medium mb-2">No Heroes Found</h2>
                <p className="text-gray-400 mb-6">Try a different search term</p>
                <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
              </>
            ) : (
              <>
                <Sparkles size={48} className="mx-auto text-cosmic-500 mb-4" />
                <h2 className="text-xl font-medium mb-2">You Haven't Created Any Heroes Yet</h2>
                <p className="text-gray-400 mb-6">Create your first cosmic hero to get started</p>
                <Link to="/create">
                  <Button 
                    variant="primary" 
                    icon={<Plus size={16} />}
                  >
                    Create Your First Hero
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHeroes.map(hero => (
              <div 
                key={hero.id}
                className="bg-mystic-800 rounded-xl overflow-hidden hover:shadow-cosmic transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/hero/${hero.id}`)}
              >
                <div className="aspect-square relative">
                  {hero.images && hero.images.length > 0 ? (
                    <img 
                      src={hero.images[0].url} 
                      alt={hero.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-mystic-900 px-4 text-center">
                      <p className="text-gray-400 text-sm">
                        {hero.status === 'error'
                          ? 'Generation did not complete.'
                          : 'Image generating...'}
                      </p>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {hero.status === 'error' && (
                    <div className="absolute top-3 right-3 bg-red-900/90 text-red-200 px-2 py-1 rounded-md text-xs">
                      Failed
                    </div>
                  )}
                  {hero.status === 'pending' && (
                    <div className="absolute top-3 right-3 bg-yellow-800 text-yellow-200 px-2 py-1 rounded-md text-xs">
                      Generating
                    </div>
                  )}
                  {hero.paymentStatus === 'paid' && hero.status !== 'error' && (
                    <div className="absolute top-3 right-3 bg-green-800 text-green-200 px-2 py-1 rounded-md text-xs">
                      Premium
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-display font-medium text-lg">{hero.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {hero.westernZodiac?.sign} / {hero.chineseZodiac?.sign}
                  </p>
                  {hero.status === 'error' && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw size={14} />}
                        isLoading={recreatingId === hero.id}
                        disabled={recreatingId !== null}
                        className="w-full"
                        onClick={(e) => handleRecreate(e, hero.id)}
                      >
                        Recreate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HeroesListPage; 