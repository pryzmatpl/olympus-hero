import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  ShoppingCart,
  BadgeCheck,
  CreditCard,
  Lock,
  Users,
  RefreshCw,
  Bot,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useHeroStore } from '../store/heroStore';
import HeroChapters from '../components/hero/HeroChapters';
import MetaTags from '../components/ui/MetaTags';
import api from '../utils/api';
import { formatLiteraryBackstory } from '../utils/literaryFormatter';
import { useNotification } from '../context/NotificationContext';
import { track } from '../utils/analytics';
import { getPaywallCopyVariant } from '../utils/growthExperiments';
import HeroLoreJournal from '../components/hero/HeroLoreJournal';

const HERO_POLL_INTERVAL_MS = 2500;
const HERO_MAX_POLLS = 52;

/** Poll until API reports completed or error (in-flight generation). Returns false if max wait exceeded. */
async function pollHeroUntilTerminal(
  heroId: string,
  loadHero: (data: unknown) => void
): Promise<boolean> {
  for (let i = 0; i < HERO_MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, HERO_POLL_INTERVAL_MS));
    const r = await api.get(`/api/heroes/${heroId}`);
    loadHero(r.data);
    if (r.data.status === 'completed' || r.data.status === 'error') return true;
  }
  return false;
}

const HeroPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingHero, setRegeneratingHero] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const paywallVariant = useMemo(() => getPaywallCopyVariant(), []);
  const paywallImpressionRef = useRef<HTMLDivElement | null>(null);
  
  // Get hero data from the store
  const { 
    heroId,
    heroName, 
    zodiacInfo, 
    images, 
    backstory, 
    status,
    paymentStatus,
    loadHeroFromAPI,
    setStatus,
    setStoryBook,
    setChapters,
    setIsLoadingChapters,
    isLoadingChapters,
    chapters,
  } = useHeroStore();
  
  // Check for payment success and chapter purchase
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get('payment');
    const paymentType = searchParams.get('type');
    
    if (paymentStatus === 'success') {
      if (paymentType === 'chapters') {
        // Show specific message for chapter purchase
        showNotification(
          'success',
          'Chapters Purchase Successful',
          'Your chapters will become available soon. The cosmic energies are aligning to craft your continued journey.',
          true,
          6000
        );
      } else {
        // General success message for other purchases
        showNotification(
          'success',
          'Purchase Successful',
          'Your purchase was completed successfully!',
          true,
          4000
        );
      }
      
      // Clean up the URL to prevent showing notification on refresh
      const newUrl = location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, showNotification]);
  
  useEffect(() => {
    const fetchHero = async () => {
      if (!id) return;

      const rawId = id.replace('preview-', '');

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/api/heroes/${rawId}`);
        const data = response.data;
        loadHeroFromAPI(data);

        const isPreview = id.startsWith('preview-');
        const noGeneratedContent =
          (!data.images || data.images.length === 0) &&
          !String(data.backstory || '').trim();

        if (!isPreview && noGeneratedContent) {
          if (data.status === 'processing') {
            const ok = await pollHeroUntilTerminal(rawId, loadHeroFromAPI);
            if (!ok) {
              showNotification(
                'warning',
                'Still processing',
                'Generation is taking longer than expected. Refresh the page or use Regenerate content.',
                true,
                8000
              );
            }
          } else {
            try {
              const genRes = await api.post(`/api/heroes/generate/${rawId}`, {});
              if (genRes.status === 202) {
                const ok = await pollHeroUntilTerminal(rawId, loadHeroFromAPI);
                if (!ok) {
                  showNotification(
                    'warning',
                    'Still processing',
                    'Generation is taking longer than expected. Refresh or try Regenerate content.',
                    true,
                    8000
                  );
                }
              } else if (genRes.data?.hero) {
                loadHeroFromAPI(genRes.data.hero);
              }
            } catch (genErr: unknown) {
              loadHeroFromAPI({ ...data, status: 'error' });
              setStatus('error');
              const ax = genErr as { response?: { data?: { message?: string; error?: string } } };
              showNotification(
                'error',
                'Could not generate hero',
                ax.response?.data?.message ||
                  ax.response?.data?.error ||
                  'Use “Regenerate content” below or try again later.',
                true,
                6000
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching hero:', error);
        setError('Failed to load hero data. Please try again.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    void fetchHero();
  }, [id, loadHeroFromAPI, setStatus, showNotification]);
  
  // Fetch storybook and chapters data
  useEffect(() => {
    const fetchStoryBook = async () => {
      if (!heroId || id?.startsWith('preview-')) return;
      
      try {
        setIsLoadingChapters(true);
        
        const response = await api.get(`/api/heroes/${heroId}/storybook`);
        
        setStoryBook(response.data.storyBook);
        setChapters(response.data.chapters);
      } catch (error) {
        console.error('Error fetching storybook:', error);
        // Don't set an error state, just quietly fail as this is an enhancement
      } finally {
        setIsLoadingChapters(false);
      }
    };
    
    fetchStoryBook();
  }, [heroId, id, setStoryBook, setChapters, setIsLoadingChapters]);
  
  const isPreview = id?.startsWith('preview-');
  /** Full-page loader only while fetchHero is running (GET + generate + poll). Do not key off `status === 'generating'` alone — that stayed true for stale `pending` heroes with old clients and could loop forever after poll timeout. */
  const isLoading = loading;
  const isPaid = paymentStatus === 'paid';

  useEffect(() => {
    if (isPreview || isPaid || !id) return;
    const el = paywallImpressionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          track('paywall_view', { heroId: id.replace('preview-', '') });
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id, isPaid, isPreview]);
  
  // Derive hero traits from zodiac info
  const heroTraits = zodiacInfo ? [
    ...zodiacInfo.western.traits,
    ...zodiacInfo.chinese.traits
  ] : [];
  
  // Prepare images for display
  const displayImages = images && images.length > 0 
    ? images.map(img => ({ url: img.url }))
    : [];

  // Handle share and download clicks
  const handleShareClick = async () => {
    const rawId = id?.replace('preview-', '');
    if (!rawId) return;
    if (!isPaid) {
      track('checkout_open', { from: 'share_cta', heroId: rawId });
      navigate(`/checkout/${rawId}`);
      return;
    }
    try {
      const res = await api.post(`/api/heroes/${rawId}/share`, {});
      const shareUrlPath = res.data?.sharedLink?.shareUrl as string | undefined;
      const shareId = res.data?.sharedLink?.shareId as string | undefined;
      if (!shareUrlPath) throw new Error('No share URL');
      const fullUrl = `${window.location.origin}${shareUrlPath}`;
      await navigator.clipboard.writeText(fullUrl);
      track('share_create', { heroId: rawId, shareId: shareId ?? '' });
      showNotification('success', 'Share link copied', fullUrl, true, 5000);
    } catch (e) {
      console.error(e);
      showNotification('error', 'Could not share', 'Please try again in a moment.', true, 4000);
    }
  };
  
  const handleDownloadClick = () => {
    if (isPaid) {
      const storedToken = localStorage.getItem('authToken');
      // Start download of hero assets
      api.get(`/api/heroes/${id}/download`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        responseType: 'blob',
      }).then((response)=>{
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hero_${id}_assets.zip`; // Set the default file name
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }).catch((error) => {
            console.error('Download failed:', error);
            // Handle errors (e.g., show a notification to the user)
            if (error.response?.status === 403) {
              alert('You do not have permission to download this hero or payment is required.');
            } else if (error.response?.status === 404) {
              alert('Hero not found.');
            } else {
              alert('Failed to download the file. Please try again later.');
            }
          });
    } else {
      navigate(`/checkout/${id}`);
    }
  };

  const handleJoinClick = () => {
    if (isPaid) {
      navigate(`/shared-story`);
    } else {
      navigate(`/checkout/${id}`);
    }
  };
  
  // Handle refreshing chapters after unlock
  const handleChaptersUnlocked = () => {
    // No specific action needed as the component will re-render with updated data
  };
  
  // Ensure backstory is a string
  const safeBackstory = typeof backstory === 'string' ? backstory : '';

  const missingStoryChapters =
    !isPreview &&
    heroId &&
    !isLoadingChapters &&
    Array.isArray(chapters) &&
    chapters.length === 0;

  const showRegenerateHeroContent =
    !isPreview &&
    heroId &&
    !loading &&
    (status === 'error' ||
      !safeBackstory.trim() ||
      (status === 'complete' && missingStoryChapters));

  const handleRegenerateHeroContent = async () => {
    const rawId = id?.replace('preview-', '');
    if (!rawId || !heroId) return;
    setRegeneratingHero(true);
    try {
      const response = await api.post(`/api/heroes/generate/${rawId}`, {});
      if (response.status === 202) {
        await pollHeroUntilTerminal(rawId, loadHeroFromAPI);
      } else if (response.data?.hero) {
        loadHeroFromAPI(response.data.hero);
      }
      try {
        const sbRes = await api.get(`/api/heroes/${rawId}/storybook`);
        setStoryBook(sbRes.data.storyBook);
        setChapters(sbRes.data.chapters ?? []);
      } catch {
        /* storybook refetch optional */
      }
      showNotification(
        'success',
        'Content updated',
        'Images, backstory, and story chapters were refreshed.'
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        ax.response?.data?.message ||
        ax.response?.data?.error ||
        'Regeneration failed. Try again in a moment.';
      showNotification('error', 'Regeneration failed', msg);
    } finally {
      setRegeneratingHero(false);
    }
  };
  
  // Format backstory preview for unpaid users
  const backstoryPreview = safeBackstory && safeBackstory.length > 300
    ? safeBackstory.substring(0, 300) + '...'
    : safeBackstory;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-stone-200 min-h-[60vh] flex items-center justify-center px-4 pt-28 pb-20"
      >
        <div className="relative text-center max-w-md w-full border border-stone-700/90 bg-stone-950/80 backdrop-blur-sm p-8 rounded-sm shadow-2xl shadow-black/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(180,83,9,0.12),transparent_55%)] rounded-sm pointer-events-none" />
          <div className="relative mx-auto mb-8 flex min-h-[14rem] w-full max-w-xs items-center justify-center">
            <div className="absolute top-1/2 left-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/90 shadow-lg shadow-amber-900/40 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-24 w-24 animate-spin" style={{ animationDuration: '8s' }}>
                <div className="relative h-full w-full rounded-full border border-dashed border-amber-600/25">
                  <div className="absolute top-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/80" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-48 w-48 animate-spin" style={{ animationDuration: '15s' }}>
                <div className="relative h-full w-full rounded-full border border-dashed border-stone-600/40">
                  <div className="absolute top-0 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mystic-500/80" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-amber-500/95 font-display text-xs tracking-[0.25em] uppercase mb-2">Mythical Hero</p>
          <h2 className="text-xl font-display font-semibold text-stone-100 mb-3">The forge is working…</h2>
          <div className="h-10 mb-4 flex items-center justify-center">
            <motion.p
              key={Math.floor(Date.now() / 3000)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-stone-400 text-sm"
            >
              {[
                'Gathering celestial threads…',
                'Shaping your legend’s silhouette…',
                'Inscribing the first verses…',
                'Tempering art and lore…',
                'Almost ready to unveil…',
              ][Math.floor(Date.now() / 3000) % 5]}
            </motion.p>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-1.5 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-800 via-amber-500 to-amber-200 h-full rounded-full animate-pulse w-3/5" />
          </div>
          <p className="text-stone-500 text-xs leading-relaxed">
            Portrait and story are being forged. Usually under a minute.
          </p>
        </div>
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-stone-200 container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center max-w-lg">
          <div className="border border-red-900/50 bg-red-950/40 backdrop-blur-sm p-8 rounded-sm mb-6 shadow-xl shadow-black/30">
            <h2 className="font-display text-2xl text-stone-100 mb-2">Could not load this hero</h2>
            <p className="text-red-200/90 text-sm">{error}</p>
          </div>
          <Button
            className="border border-stone-600"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </motion.div>
    );
  }
  
  // Display data if we have a hero name (minimal validation that data is loaded)
  if (!heroName) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-stone-200 container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-amber-500/60 border-t-transparent mx-auto mb-5" />
          <p className="font-display text-amber-500/90 text-xs tracking-[0.2em] uppercase mb-2">Mythical Hero</p>
          <h2 className="font-display text-xl text-stone-100">Gathering hero data…</h2>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-stone-200"
    >
      {/* Add dynamic meta tags for hero page */}
      {!isLoading && !error && heroName && (
        <MetaTags
          title={`${heroName} | Mythical Hero`}
          description={`Discover the cosmic journey of ${heroName}, a mythical hero with ${zodiacInfo?.western.sign} and ${zodiacInfo?.chinese.sign} zodiac influences.`}
          image={images && images.length > 0 ? images[0].url : '/logo.jpg'}
          type="profile"
          robots="noindex,nofollow"
        />
      )}

      <div className="relative border-b border-stone-800/80 bg-gradient-to-b from-stone-950 via-mystic-950/90 to-mystic-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(180,83,9,0.12),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(88,28,135,0.2),transparent_50%)] pointer-events-none" />
        <div className="container mx-auto px-4 pt-28 pb-10 max-w-6xl relative z-10">
          <p className="text-amber-500/95 font-display text-xs md:text-sm tracking-[0.2em] uppercase mb-3">
            Mythical Hero · Your legend
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-stone-100 leading-tight mb-4">
                {heroName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-stone-600/80 bg-stone-950/60 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wide text-stone-300">
                  {zodiacInfo?.western.sign}
                  <span className="text-amber-600/90"> · </span>
                  {zodiacInfo?.western.element}
                </span>
                <span className="border border-stone-600/80 bg-stone-950/60 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wide text-stone-300">
                  {zodiacInfo?.chinese.sign}
                  <span className="text-amber-600/90"> · </span>
                  {zodiacInfo?.chinese.element}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-stone-600 text-stone-200 hover:bg-stone-900/80"
                icon={<Share2 size={16} />}
                onClick={handleShareClick}
              >
                {!isPaid && 'Unlock to '}Share
              </Button>

              {isPreview ? (
                <Link to={`/checkout/${id}`}>
                  <Button
                    size="sm"
                    className="border border-amber-800/40 shadow-lg shadow-amber-950/20"
                    variant="secondary"
                    icon={<ShoppingCart size={16} />}
                  >
                    {paywallVariant === 'explicit_price' ? 'Unlock premium ($3.99)' : 'Unlock premium'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="border border-amber-800/40"
                    variant="secondary"
                    icon={<Download size={16} />}
                    onClick={handleDownloadClick}
                  >
                    {!isPaid && 'Unlock to '}Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-stone-600 text-stone-200 hover:bg-stone-900/80"
                    icon={<Users size={16} />}
                    onClick={handleJoinClick}
                  >
                    {!isPaid && 'Unlock to '}Shared story
                  </Button>
                </>
              )}
            </div>
            {isPaid && !isPreview ? (
              <div className="mt-5 flex gap-3 rounded-sm border border-amber-900/35 bg-gradient-to-r from-stone-950/90 to-amber-950/25 px-4 py-3 shadow-inner shadow-black/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-amber-800/35 bg-stone-950/90">
                  <Bot className="h-5 w-5 text-amber-400/95" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-amber-100/95 tracking-wide">
                    Agent Drive — drive this hero from your own AI agent
                  </p>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mt-1">
                    In Shared Story, open or host a session: enable Agent Drive, mint a token, and plug it into
                    Cursor or any MCP-compatible client. Your automation proposes moves;{' '}
                    <strong className="text-stone-300 font-medium">you approve each post</strong> in the room
                    before it goes live.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl">

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left: Hero Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative overflow-hidden rounded-sm border border-stone-700/80 bg-stone-950/50 shadow-2xl shadow-black/40">
              <div className="aspect-square md:aspect-[4/3] relative bg-stone-950">
                {displayImages.length > 0 ? (
                  <img
                    src={displayImages[activeImage]?.url}
                    alt={`${heroName} illustration`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-8 border border-dashed border-stone-700 m-4 rounded-sm">
                    <p className="font-display text-stone-400 text-sm">Portrait in the forge…</p>
                    <p className="text-stone-600 text-xs">Check back shortly.</p>
                  </div>
                )}

                {(isPreview || !isPaid) && displayImages.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-stone-950/85 text-amber-100/95 px-5 py-2 border border-amber-800/40 -rotate-[18deg] text-sm font-display font-semibold tracking-wide uppercase shadow-lg">
                      {isPreview ? 'Preview' : 'Unlock full fidelity'}
                    </span>
                  </div>
                )}
              </div>

              {displayImages.length > 0 && (
                <div className="absolute top-3 right-3 border border-stone-600 bg-stone-950/90 px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider text-stone-400">
                  {activeImage + 1} / {displayImages.length}
                </div>
              )}
            </div>

            {displayImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => (isPaid ? setActiveImage(index) : setActiveImage(0))}
                    className={`
                      aspect-square rounded-sm overflow-hidden border transition-all relative
                      ${activeImage === index
                        ? 'border-amber-500/90 ring-1 ring-amber-500/30 shadow-lg shadow-black/50'
                        : 'border-stone-700 hover:border-stone-500 opacity-85 hover:opacity-100'}
                    `}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-full h-full object-cover ${index > 0 && !isPaid ? 'blur-sm scale-105' : ''}`}
                    />
                    {index > 0 && !isPaid && (
                      <div className="absolute inset-0 flex items-center justify-center bg-stone-950/55">
                        <Lock size={20} className="text-amber-500/85" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!isPaid && (
              <div
                ref={paywallImpressionRef}
                className="border border-amber-900/45 bg-gradient-to-br from-amber-950/25 to-stone-950 p-5 rounded-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-amber-800/40 bg-stone-950/80">
                    <CreditCard className="h-5 w-5 text-amber-500/90" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-stone-100 mb-1">
                      {paywallVariant === 'explicit_price'
                        ? 'Unlock full-quality art ($3.99)'
                        : 'Unlock full-quality images'}
                    </h3>
                    <p className="text-stone-400 text-sm leading-relaxed">
                      {paywallVariant === 'explicit_price'
                        ? 'One-time upgrade for this hero: all angles, full resolution, full story, download, shared story access & Agent Drive (drive your hero from your own agent with in-app approval).'
                        : 'Get high-resolution images and access to all views'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      to={`/checkout/${id}`}
                      onClick={() =>
                        track('checkout_open', {
                          from: 'paywall_strip',
                          heroId: String(id).replace('preview-', ''),
                        })
                      }
                    >
                      <Button size="sm" className="border border-amber-900/40">
                        {paywallVariant === 'explicit_price' ? 'Unlock — $3.99' : 'Unlock now'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <div className="hidden lg:block pt-2">
              {!isPreview && heroId && (
                <div className="rounded-sm border border-stone-700/85 bg-stone-950/35 p-5 shadow-lg shadow-black/30">
                  <HeroChapters heroId={heroId} onUnlockBundle={handleChaptersUnlocked} />
                </div>
              )}
            </div>
          </div>
          
          {/* Right: Hero Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-stone-700/90 bg-stone-950/60 backdrop-blur-sm rounded-sm p-6 shadow-xl shadow-black/35">
              <h2 className="font-display text-lg text-stone-100 mb-1">Hero traits</h2>
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-5">Forged from your signs</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {heroTraits.map((trait, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <BadgeCheck size={18} className="text-amber-500/85 shrink-0 mt-0.5" />
                    <span className="capitalize text-stone-300 text-sm leading-snug">{trait}</span>
                  </div>
                ))}
              </div>

              {zodiacInfo?.western?.strengths && (
                <div className="mt-8">
                  <h3 className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Strengths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {zodiacInfo.western.strengths.map((strength, idx) => (
                      <span
                        key={idx}
                        className="border border-amber-900/35 bg-amber-950/30 text-amber-100/90 px-2.5 py-1 rounded-sm text-xs capitalize"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {zodiacInfo?.western?.weaknesses && (
                <div className="mt-4">
                  <h3 className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Weaknesses
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {zodiacInfo.western.weaknesses.map((weakness, idx) => (
                      <span
                        key={idx}
                        className="border border-stone-600 bg-stone-900/80 text-stone-300 px-2.5 py-1 rounded-sm text-xs capitalize"
                      >
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {zodiacInfo?.chinese?.compatibility && (
                <div className="mt-6">
                  <h3 className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Compatible with
                  </h3>
                  <p className="text-stone-300 text-sm">{zodiacInfo.chinese.compatibility.join(', ')}</p>
                </div>
              )}

              {!isPaid && (
                <div className="mt-8 pt-6 border-t border-stone-700/90">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-amber-200/90 font-medium text-sm font-display">
                      Legend access
                    </span>
                    <Link to={`/checkout/${id}`}>
                      <Button
                        icon={<ShoppingCart className="h-4 w-4" />}
                        className="border border-amber-900/40"
                      >
                        Unlock
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-stone-700/90 bg-stone-950/60 backdrop-blur-sm rounded-sm p-6 shadow-xl shadow-black/35">
              <h2 className="font-display text-lg text-stone-100 mb-4">Backstory</h2>

              {showRegenerateHeroContent && (
                <div className="mb-4 p-4 rounded-sm bg-amber-950/35 border border-amber-900/35">
                  <p className="text-amber-100/90 text-sm mb-3">
                    {status === 'error'
                      ? 'Generation failed or was interrupted.'
                      : !safeBackstory.trim()
                        ? 'Backstory is missing.'
                        : 'Your first story chapter has not been created yet.'}{' '}
                    Regenerate to rebuild portraits, backstory, and the opening chapter (uses AI credits).
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="border border-amber-900/30"
                    icon={<RefreshCw size={16} />}
                    isLoading={regeneratingHero}
                    disabled={regeneratingHero}
                    onClick={handleRegenerateHeroContent}
                  >
                    Regenerate backstory &amp; images
                  </Button>
                </div>
              )}

              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-stone-100 prose-p:text-stone-400 prose-li:text-stone-400 prose-strong:text-stone-200">
                {!safeBackstory && status !== 'error' && !showRegenerateHeroContent ? (
                  <p className="text-amber-200/75 text-sm">Backstory is being woven…</p>
                ) : !safeBackstory && showRegenerateHeroContent ? (
                  <p className="text-stone-500 text-sm">Use the button above to generate your backstory.</p>
                ) : !isPaid && safeBackstory.length > 300 ? (
                  <>
                    <div
                      className="literary-content backstory-content"
                      dangerouslySetInnerHTML={{ __html: formatLiteraryBackstory(backstoryPreview) }}
                    />
                    <div className="relative pt-12 mt-2">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-950/40 to-stone-950 flex items-end justify-center pb-3">
                        <Link to={`/checkout/${id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-stone-500 text-stone-100"
                            icon={<Lock size={16} />}
                          >
                            Unlock full backstory
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="literary-content backstory-content"
                    dangerouslySetInnerHTML={{ __html: formatLiteraryBackstory(safeBackstory) }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero Chapters (mobile/tablet view) */}
        <div className="lg:hidden mt-10">
          {!isPreview && heroId && (
            <div className="rounded-sm border border-stone-700/85 bg-stone-950/35 p-5 shadow-lg shadow-black/30">
              <HeroChapters heroId={heroId} onUnlockBundle={handleChaptersUnlocked} />
            </div>
          )}
        </div>

        {!isPreview && heroId && <HeroLoreJournal heroId={heroId} />}
      </div>
    </motion.div>
  );
};

export default HeroPage;