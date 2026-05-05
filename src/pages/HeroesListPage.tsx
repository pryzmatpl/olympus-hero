import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../App';
import Button from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';
import {
  LandingStyleHero,
  LandingStyleMain,
  LandingStylePageRoot,
} from '../components/layout/LandingStyleLayout';

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

const panelClass =
  'border border-stone-800 bg-stone-900/50 rounded-sm p-8 md:p-10 text-center';

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
        headers: { Authorization: `Bearer ${token}` },
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
        setHeroes((prev) => prev.map((h) => (h.id === heroId ? { ...h, ...updated } : h)));
        showNotification('success', 'Hero ready', 'Images and backstory were generated successfully.');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        ax.response?.data?.message ||
        ax.response?.data?.error ||
        'Could not regenerate this hero. Try again in a moment.';
      showNotification('error', 'Regeneration failed', msg);
    } finally {
      setRecreatingId(null);
    }
  };

  const filteredHeroes = heroes.filter((hero) =>
    hero.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const createBlocked = heroes.some((hero) => hero.paymentStatus !== 'paid');

  return (
    <LandingStylePageRoot>
      <LandingStyleHero
        eyebrow="Mythical Hero"
        title="Your legends"
        lead="Every portrait and tale you have forged lives here. Open a card to continue the story."
        actions={
          <Link to="/create">
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              disabled={createBlocked}
              className="border border-amber-700/40 shadow-lg shadow-amber-950/30 rounded-full"
            >
              Create new hero
            </Button>
          </Link>
        }
      />

      <LandingStyleMain>
        <div className="max-w-6xl mx-auto">
          {createBlocked && (
            <div className="mb-8 p-4 border border-amber-800/50 bg-amber-950/25 rounded-sm">
              <p className="text-amber-200/90 text-sm leading-relaxed">
                <span className="font-semibold text-amber-100">Note:</span> You can only have one
                non-premium hero at a time. To create a new hero, upgrade your existing hero to premium.
              </p>
            </div>
          )}

          <div className="relative mb-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-stone-500" />
            </div>
            <input
              type="text"
              placeholder="Search your heroes by name..."
              className="w-full bg-stone-950/70 border border-stone-700/90 text-stone-200 placeholder:text-stone-500 pl-10 pr-4 py-3 rounded-sm focus:ring-2 focus:ring-amber-600/35 focus:border-amber-700/50 focus:outline-none transition-shadow"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-stone-700 border-t-amber-500/90" />
            </div>
          ) : error ? (
            <div className={panelClass}>
              <AlertCircle size={44} className="mx-auto text-red-400/95 mb-4" />
              <h2 className="font-display text-xl text-stone-100 mb-2">Failed to load heroes</h2>
              <p className="text-stone-400 mb-6 text-sm">{error}</p>
              <Button onClick={() => fetchHeroes()}>Try again</Button>
            </div>
          ) : filteredHeroes.length === 0 ? (
            <div className={panelClass}>
              {searchTerm ? (
                <>
                  <Search size={44} className="mx-auto text-stone-500 mb-4" />
                  <h2 className="font-display text-xl text-stone-100 mb-2">No heroes match</h2>
                  <p className="text-stone-400 mb-6 text-sm">Try a different name or clear the search.</p>
                  <Button onClick={() => setSearchTerm('')}>Clear search</Button>
                </>
              ) : (
                <>
                  <Sparkles size={44} className="mx-auto text-amber-500/85 mb-4" />
                  <h2 className="font-display text-xl text-stone-100 mb-2">No heroes yet</h2>
                  <p className="text-stone-400 mb-6 text-sm">Step into the forge and summon your first legend.</p>
                  <Link to="/create">
                    <Button variant="primary" icon={<Plus size={16} />} className="border border-amber-700/40 shadow-lg shadow-amber-950/30">
                      Create your first hero
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHeroes.map((hero) => (
                <motion.div
                  key={hero.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className="group border border-stone-700/90 bg-stone-950/60 overflow-hidden rounded-sm shadow-xl shadow-black/40 cursor-pointer hover:border-amber-900/35 transition-colors"
                  onClick={() => navigate(`/hero/${hero.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    {hero.images && hero.images.length > 0 ? (
                      <img
                        src={hero.images[0].url}
                        alt={hero.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 px-4 text-center">
                        <p className="text-stone-500 text-sm">
                          {hero.status === 'error'
                            ? 'Generation did not complete.'
                            : 'Image generating...'}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />

                    {hero.status === 'error' && (
                      <div className="absolute top-3 right-3 bg-red-950/90 text-red-200 border border-red-800/80 px-2 py-1 rounded-sm text-xs">
                        Failed
                      </div>
                    )}
                    {hero.status === 'pending' && (
                      <div className="absolute top-3 right-3 bg-amber-950/90 text-amber-100 border border-amber-800/60 px-2 py-1 rounded-sm text-xs">
                        Generating
                      </div>
                    )}
                    {hero.paymentStatus === 'paid' && hero.status !== 'error' && (
                      <div className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-200 border border-emerald-800/60 px-2 py-1 rounded-sm text-xs">
                        Premium
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-stone-800">
                    <h3 className="font-display text-lg text-stone-100">{hero.name}</h3>
                    <p className="text-stone-500 text-sm mt-1">
                      {hero.westernZodiac?.sign} / {hero.chineseZodiac?.sign}
                    </p>
                    {hero.status === 'error' && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<RefreshCw size={14} />}
                          isLoading={recreatingId === hero.id}
                          disabled={recreatingId !== null}
                          className="w-full rounded-full"
                          onClick={(e) => handleRecreate(e, hero.id)}
                        >
                          Recreate
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </LandingStyleMain>
    </LandingStylePageRoot>
  );
};

export default HeroesListPage;
