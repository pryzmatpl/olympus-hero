import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { AuthContext } from '../App';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

interface Hero {
  id: string;
  name: string;
  images: Array<{ angle: string; url: string }>;
  paymentStatus: string;
  westernZodiac: string;
  chineseZodiac: string;
}

interface NFT {
  id: string;
  heroId: string;
  createdAt: string;
  tokenURI: string;
  metadata: {
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

interface SharedLink {
  id: string;
  shareUrl: string;
  heroId: string;
  createdAt: string;
  accessCount: number;
  isActive: boolean;
}

const ProfilePage = () => {
  const { user, token, logout } = useContext(AuthContext);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get heroes from API
        const heroesResponse = await api.get('/api/user/heroes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get NFTs from API
        const nftsResponse = await api.get('/api/user/nfts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get shared links from API
        const sharesResponse = await api.get('/api/user/shares', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setHeroes(heroesResponse.data.heroes || []);
        setNfts(nftsResponse.data.nfts || []);
        setSharedLinks(sharesResponse.data.sharedLinks || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [token]);
  
  const handleCopyShareLink = (shareUrl: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    // In a real app, you might want to show a notification here
  };
  
  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700 mb-8">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-cosmic-400">{user?.email}</p>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-mystic-700 hover:bg-mystic-600 rounded-lg mt-4 sm:mt-0"
            >
              Log Out
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Mythical Heroes</h2>
            
            {loading ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center">Loading heroes...</p>
              </div>
            ) : heroes.length === 0 ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center mb-4">You haven't created any heroes yet.</p>
                <div className="text-center">
                  <Link
                    to="/create"
                    className="inline-block px-4 py-2 bg-cosmic-600 hover:bg-cosmic-500 rounded-lg transition-colors"
                  >
                    Create Your First Hero
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {heroes.map((hero) => (
                  <div
                    key={hero.id}
                    className="bg-mystic-800/60 rounded-lg p-4 border border-mystic-700 flex items-center gap-4"
                  >
                    {hero.images.length > 0 && (
                      <img
                        src={hero.images[0].url}
                        alt={hero.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-grow">
                      <h3 className="font-semibold">{hero.name}</h3>
                      <p className="text-sm text-cosmic-400">
                        {hero.westernZodiac} • {hero.chineseZodiac}
                      </p>
                    </div>
                    <Link
                      to={`/hero/${hero.id}`}
                      className="px-3 py-1 bg-mystic-700 hover:bg-mystic-600 rounded-lg text-sm"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Your NFTs</h2>
            
            {loading ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center">Loading NFTs...</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center">You don't have any NFTs yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {nfts.map((nft) => {
                  const hero = heroes.find(h => h.id === nft.heroId);
                  return (
                    <div
                      key={nft.id}
                      className="bg-mystic-800/60 rounded-lg p-4 border border-mystic-700"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        {hero && hero.images.length > 0 && (
                          <img
                            src={hero.images[0].url}
                            alt={hero?.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{hero?.name || 'Unknown Hero'} NFT</h3>
                          <p className="text-xs text-cosmic-400">Created {new Date(nft.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-mystic-900/60 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                        <p>Token ID: {nft.id}</p>
                        <p>Token URI: {nft.tokenURI}</p>
                        <p>Payment: {(nft.metadata.amount / 100).toFixed(2)} {nft.metadata.currency.toUpperCase()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Shared Links</h2>
            
            {loading ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center">Loading shared links...</p>
              </div>
            ) : sharedLinks.length === 0 ? (
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
                <p className="text-center">You haven't shared any heroes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedLinks.map((link) => {
                  const hero = heroes.find(h => h.id === link.heroId);
                  return (
                    <div
                      key={link.id}
                      className="bg-mystic-800/60 rounded-lg p-4 border border-mystic-700"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        {hero && hero.images.length > 0 && (
                          <img
                            src={hero.images[0].url}
                            alt={hero?.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-grow">
                          <h3 className="font-semibold">{hero?.name || 'Unknown Hero'}</h3>
                          <p className="text-xs text-cosmic-400">
                            Shared {new Date(link.createdAt).toLocaleDateString()} • 
                            {link.accessCount} view{link.accessCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            link.isActive
                              ? 'bg-green-900/30 text-green-400 border border-green-700'
                              : 'bg-red-900/30 text-red-400 border border-red-700'
                          }`}
                        >
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}${link.shareUrl}`}
                          className="flex-grow bg-mystic-900 border border-mystic-700 rounded-lg p-2 text-sm"
                        />
                        <button
                          onClick={() => handleCopyShareLink(link.shareUrl)}
                          className="px-3 py-2 bg-mystic-700 hover:bg-mystic-600 rounded-lg"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Actions</h2>
              <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700 space-y-4">
                <Link
                  to="/create"
                  className="block w-full py-3 bg-cosmic-600 hover:bg-cosmic-500 rounded-lg text-center transition-colors"
                >
                  Create New Hero
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage; 