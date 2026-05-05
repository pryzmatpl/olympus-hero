import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../App';
import Button from '../components/ui/Button';
import {
  LandingStyleHero,
  LandingStyleMain,
  LandingStylePageRoot,
} from '../components/layout/LandingStyleLayout';

interface HeroItem {
  id: string;
  name: string;
  images: Array<{ angle: string; url: string }>;
  paymentStatus: string;
  westernZodiac: {
    sign: string;
  };
  chineseZodiac: {
    sign: string;
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

const cardShell =
  'border border-stone-700/90 bg-stone-950/50 rounded-sm p-6 shadow-lg shadow-black/30';

const ProfilePage = () => {
  const { user, token, logout } = useContext(AuthContext);
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const heroesResponse = await api.get('/api/user/heroes', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sharesResponse = await api.get('/api/user/shares', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHeroes(heroesResponse.data.heroes || []);
        setSharedLinks(sharesResponse.data.sharedLinks || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your hero data. We are working on it.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleCopyShareLink = (shareUrl: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
  };

  return (
    <LandingStylePageRoot>
      <LandingStyleHero
        eyebrow="Mythical Hero"
        title="Your profile"
        lead="Account, roster, and the links you have cast into the world — gathered in one hall."
      />

      <LandingStyleMain>
        <div className="max-w-5xl mx-auto space-y-10">
          {error && (
            <div className="border border-red-800/70 bg-red-950/35 rounded-sm p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className={`${cardShell} flex flex-wrap items-start justify-between gap-6`}>
            <div>
              <p className="text-amber-500/85 text-xs uppercase tracking-[0.2em] mb-2">Account</p>
              <h2 className="font-display text-xl md:text-2xl text-stone-100">{user?.name}</h2>
              <p className="text-stone-400 mt-1 text-sm">{user?.email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={logout}
              className="rounded-full border-stone-600 text-stone-200 hover:bg-stone-900/80"
            >
              Log out
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display font-bold text-xl text-stone-100 mb-6">Your heroes</h2>

              {loading ? (
                <div className={`${cardShell}`}>
                  <p className="text-center text-stone-400 text-sm">Loading heroes...</p>
                </div>
              ) : heroes.length === 0 ? (
                <div className={`${cardShell} text-center`}>
                  <p className="text-stone-400 text-sm mb-5">You have not created any heroes yet.</p>
                  <Link to="/create">
                    <Button
                      variant="primary"
                      size="md"
                      className="border border-amber-700/40 shadow-lg shadow-amber-950/30"
                    >
                      Create your first hero
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {heroes.map((hero) => (
                    <div
                      key={hero.id}
                      className="border border-stone-700/90 bg-stone-950/40 rounded-sm p-4 flex items-center gap-4"
                    >
                      {hero.images.length > 0 && (
                        <img
                          src={hero.images[0].url}
                          alt={hero.name}
                          className="w-16 h-16 object-cover rounded-sm border border-stone-800 shrink-0"
                        />
                      )}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-display font-medium text-stone-100 truncate">{hero.name}</h3>
                        <p className="text-sm text-stone-500">
                          {hero.westernZodiac?.sign || 'Unknown'} · {hero.chineseZodiac?.sign || 'Unknown'}
                        </p>
                      </div>
                      <Link to={`/hero/${hero.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full border-stone-600 shrink-0">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-display font-bold text-xl text-stone-100 mb-6">Shared links</h2>

              {loading ? (
                <div className={`${cardShell}`}>
                  <p className="text-center text-stone-400 text-sm">Loading shared links...</p>
                </div>
              ) : sharedLinks.length === 0 ? (
                <div className={`${cardShell}`}>
                  <p className="text-center text-stone-400 text-sm">You have not shared any heroes yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedLinks.map((link) => {
                    const hero = heroes.find((h) => h.id === link.heroId);
                    return (
                      <div key={link.id} className={`${cardShell} p-4`}>
                        <div className="flex items-start gap-3 mb-4">
                          {hero && hero.images.length > 0 && (
                            <img
                              src={hero.images[0].url}
                              alt={hero?.name}
                              className="w-12 h-12 object-cover rounded-sm border border-stone-800 shrink-0"
                            />
                          )}
                          <div className="flex-grow min-w-0">
                            <h3 className="font-medium text-stone-100 truncate">
                              {hero?.name || 'Unknown hero'}
                            </h3>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Shared {new Date(link.createdAt).toLocaleDateString()} · {link.accessCount} view
                              {link.accessCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-sm text-xs border ${
                              link.isActive
                                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                                : 'bg-red-950/50 text-red-300 border-red-800/60'
                            }`}
                          >
                            {link.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}${link.shareUrl}`}
                            className="flex-grow bg-stone-950/80 border border-stone-700/90 rounded-sm px-3 py-2 text-sm text-stone-300"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-stone-600 whitespace-nowrap"
                            onClick={() => handleCopyShareLink(link.shareUrl)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-10">
                <h2 className="font-display font-bold text-xl text-stone-100 mb-4">Forge</h2>
                <div className="border border-stone-800 bg-stone-900/50 rounded-sm p-6">
                  <Link to="/create" className="block">
                    <Button variant="primary" size="md" fullWidth className="border border-amber-700/40 shadow-lg shadow-amber-950/30">
                      Create new hero
                    </Button>
                  </Link>
                  <Link
                    to="/heroes"
                    className="block mt-3 text-center text-sm text-amber-200/90 hover:text-amber-100 transition-colors"
                  >
                    Browse all legends →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingStyleMain>
    </LandingStylePageRoot>
  );
};

export default ProfilePage;
