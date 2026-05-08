import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../App';
import { useHeroStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import MetaTags from '../components/ui/MetaTags';
import api from '../utils/api';
import { formatMarkdown } from '../utils/markdownHelper';
import { formatLiterarySharedStory } from '../utils/literaryFormatter';
import {
  Plus,
  Send,
  Share2,
  User,
  Users,
  ArrowLeft,
  Copy,
  Sparkles,
  Sun,
  Moon,
  Star,
  Loader2,
  Bot,
  Shield,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { getSocketUrl } from '../utils/api';

/** Agent Drive spotlight — amber/stone frame to match HomePage RPG marketing panels. */
const agentDriveSpotlightClass =
  'rounded-sm border-2 border-amber-700/45 bg-gradient-to-br from-stone-950/97 via-mystic-950/93 to-stone-900/85 p-6 md:p-7 shadow-2xl shadow-black/45 ring-1 ring-amber-500/20';

/** Full-page backdrop and content stack aligned with landing (`HomePage`). */
const sharedStoryPageMotionClass =
  'relative overflow-hidden min-h-[min(100dvh,1420px)] bg-gradient-to-b from-stone-950 via-mystic-950 to-mystic-900 border-b border-stone-800/80 text-stone-200';

const panelSurfaceClass =
  'border border-stone-700/85 bg-stone-950/55 shadow-lg shadow-black/30 rounded-sm';

const panelSurfaceMutedClass =
  'border border-stone-800/90 bg-stone-900/40 rounded-sm shadow-md shadow-black/20';

function SharedStoryChrome({
  children,
  mainClassName = 'container mx-auto px-4 pt-24 pb-16',
}: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-18%,rgba(180,83,9,0.11),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_58%,rgba(88,28,135,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className={`relative z-10 ${mainClassName}`}>{children}</div>
    </>
  );
}

function AgentDriveLobbyCallout() {
  return (
    <section
      className={agentDriveSpotlightClass + ' mb-8'}
      aria-labelledby="agent-drive-lobby-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-amber-900/35 border border-amber-600/45">
          <Bot className="h-8 w-8 text-amber-100" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-amber-500/95 font-display text-[11px] font-bold uppercase tracking-[0.22em]">
              Your hero, your agent
            </p>
            <h2
              id="agent-drive-lobby-heading"
              className="font-display text-2xl md:text-3xl font-bold text-stone-100 mt-1.5 tracking-tight"
            >
              Agent Drive
            </h2>
          </div>
          <p className="text-stone-200 text-base md:text-lg leading-relaxed font-medium">
            <strong className="text-stone-100">Drive this hero from your own AI agent.</strong> After you open a
            room as host, enable Agent Drive and mint a scoped token. Plug it into Cursor, an MCP client,
            or your scripts — your automation proposes what your hero says or does next,{' '}
            <em className="text-amber-200/95 not-italic font-semibold underline decoration-amber-600/55">
              and you approve every post in this app before it goes live
            </em>
            .
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-400">
            <li className="inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500/85 shrink-0" aria-hidden />
              Human-in-the-loop by design
            </li>
            <li className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500/85 shrink-0" aria-hidden />
              Works with MCP-compatible tooling
            </li>
          </ul>
          <p className="text-sm text-stone-500 border-t border-stone-700/80 pt-3">
            <span className="text-amber-400/95 font-medium">When you&apos;re in a session:</span> only the{' '}
            <strong className="text-stone-400">room owner</strong> can turn Agent Drive on and create tokens —
            scroll to Agent Drive controls at the top of the room once you&apos;ve launched an adventure.
          </p>
        </div>
      </div>
    </section>
  );
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

// Message animation variants
const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

// Cosmic animation variants
const cosmicPulseVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: [0.8, 1.2, 0.9, 1.1, 1],
    opacity: [0, 0.8, 0.6, 0.9, 1],
    transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
  }
};

const orbVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: (custom: number) => ({
    opacity: [0, 0.7, 0.9, 0.7, 0],
    scale: [0, 1, 1.5, 1, 0],
    transition: { 
      duration: 3,
      delay: custom * 0.5,
      repeat: Infinity,
    }
  })
};

const starVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: (custom: number) => ({
    opacity: [0, 0.9, 0],
    scale: [0, 1, 0],
    transition: { 
      duration: 1,
      delay: custom * 0.3,
      repeat: Infinity,
      repeatType: "reverse" 
    }
  })
};

const rayVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: { 
    opacity: [0, 0.6, 0],
    scale: [0.2, 1, 0.2],
    rotate: [0, 180],
    transition: { duration: 4, repeat: Infinity }
  }
};

const glowVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: [0.1, 0.8, 0.1],
    transition: { duration: 3, repeat: Infinity }
  }
};

const CosmicNarratorLoading = () => (
  <div className="relative p-10 flex items-center justify-center my-6">
    {/* Outer glow */}
    <motion.div 
      className="absolute w-60 h-60 rounded-full bg-amber-600/10 blur-xl"
      variants={glowVariants}
      initial="initial"
      animate="animate"
    />
    
    {/* Main orb */}
    <motion.div 
      className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-mystic-900 via-amber-900/80 to-amber-700/60 blur-md"
      variants={cosmicPulseVariants}
      initial="initial"
      animate="animate"
    />
    
    {/* Rays */}
    <motion.div 
      className="absolute w-56 h-56 bg-gradient-to-tr from-amber-500/0 via-amber-400/12 to-amber-300/25"
      style={{ 
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        transform: 'scale(1.5)'
      }}
      variants={rayVariants}
      initial="initial"
      animate="animate"
    />
    
    {/* Orbiting elements */}
    {[...Array(6)].map((_, i) => (
      <motion.div 
        key={`orb-${i}`}
        className={`absolute w-3 h-3 rounded-full ${
          i % 2 === 0 ? 'bg-amber-400/90' : 'bg-amber-200/80'
        }`}
        custom={i}
        variants={orbVariants}
        initial="initial"
        animate="animate"
        style={{
          top: `${50 + 35 * Math.sin(i * Math.PI * 2 / 6)}%`,
          left: `${50 + 35 * Math.cos(i * Math.PI * 2 / 6)}%`,
          boxShadow: '0 0 10px 2px rgba(176, 132, 255, 0.3)'
        }}
      />
    ))}
    
    {/* Random stars */}
    {[...Array(20)].map((_, i) => (
      <motion.div 
        key={`star-${i}`}
        className="absolute w-1 h-1 bg-amber-100 rounded-full shadow-lg shadow-amber-500/40"
        custom={i}
        variants={starVariants}
        initial="initial"
        animate="animate"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
    
    {/* Center content */}
    <div className="z-10 text-center backdrop-blur-sm bg-stone-950/55 rounded-sm p-3 border border-stone-700/80">
      <div className="flex items-center justify-center mb-2">
        <Sparkles className="text-amber-400/95 w-6 h-6 mr-2" />
        <span className="text-amber-100 font-display font-semibold">Cosmic Narrator</span>
        <Sparkles className="text-amber-400/95 w-6 h-6 ml-2" />
      </div>
      <p className="text-stone-400 text-sm">Channeling the tale...</p>
    </div>
  </div>
);

// Types
interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  content: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  isPremium: boolean;
}

interface StoryArcSummary {
  templateId: string;
  arcName: string;
  tagline: string;
  stepIndex: number;
  totalSteps: number;
  currentBeatTitle: string;
  currentBeatKey: string;
}

interface StoryArcChoice {
  id: string;
  name: string;
  tagline: string;
  beatCount: number;
}

interface SharedRoom {
  roomId: string;
  title: string;
  participants: Participant[];
  created: Date;
  mode?: string;
  agentDriveEnabled?: boolean;
  ownerUserId?: string;
  storyArc?: StoryArcSummary | null;
  voiceNarrationAvailable?: boolean;
}

type NarrationStatus = 'idle' | 'loading' | 'playing' | 'error';

interface NarrationState {
  messageId: string | null;
  status: NarrationStatus;
  error?: string;
}

// Interface for room list items
interface RoomListItem {
  id: string;
  title: string;
  participantCount: number;
  spectatorCount: number;
  created: Date;
  updated: Date;
  mode?: string;
}

// Zodiac icons and colors mapping
const westernZodiacIcons: Record<string, { color: string }> = {
  'Aries': { color: 'text-red-400' },
  'Taurus': { color: 'text-green-400' },
  'Gemini': { color: 'text-yellow-400' },
  'Cancer': { color: 'text-blue-400' },
  'Leo': { color: 'text-orange-400' },
  'Virgo': { color: 'text-green-300' },
  'Libra': { color: 'text-purple-300' },
  'Scorpio': { color: 'text-red-500' },
  'Sagittarius': { color: 'text-orange-300' },
  'Capricorn': { color: 'text-gray-400' },
  'Aquarius': { color: 'text-blue-300' },
  'Pisces': { color: 'text-purple-400' }
};

function NarratorPlayButton({
  messageId,
  narration,
  onToggle,
}: {
  messageId: string;
  narration: NarrationState;
  onToggle: (messageId: string) => void;
}) {
  const isActive = narration.messageId === messageId;
  const status: NarrationStatus = isActive ? narration.status : 'idle';
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  const label = isPlaying
    ? 'Pause narration'
    : isLoading
      ? 'Summoning the narrator…'
      : 'Listen to this passage';

  return (
    <button
      type="button"
      onClick={() => onToggle(messageId)}
      disabled={isLoading}
      aria-label={label}
      title={label}
      className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        isPlaying
          ? 'border-amber-500/65 bg-amber-900/45 text-amber-100 hover:bg-amber-900/60'
          : 'border-amber-700/50 bg-stone-950/70 text-amber-200/95 hover:border-amber-500/70 hover:text-amber-100'
      } disabled:cursor-wait disabled:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : isPlaying ? (
        <Pause className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Play className="h-3.5 w-3.5" aria-hidden />
      )}
      <Volume2 className="h-3.5 w-3.5 opacity-80" aria-hidden />
      <span>
        {isPlaying ? 'Pause' : isLoading ? 'Summoning' : 'Listen'}
      </span>
    </button>
  );
}

const SharedStoryPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const userId = user?.id as string | undefined;
  const navigate = useNavigate();
  const {
    heroId,
    heroName,
    images,
    westernZodiac,
    chineseZodiac,
    loadHeroFromAPI,
    level,
    xp,
    xpToNextLevel,
  } = useHeroStore();
  
  // State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<SharedRoom | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'participant' | 'spectator' | null>(null);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
  const [activeRooms, setActiveRooms] = useState<RoomListItem[]>([]);
  const [isNarratorTyping, setIsNarratorTyping] = useState<boolean>(false);
  const [heroDetails, setHeroDetails] = useState<{
    westernZodiac?: {
      sign: string;
      element: string;
      traits: string[];
      strengths?: string[];
      weaknesses?: string[];
    };
    chineseZodiac?: {
      sign: string;
      element: string;
      traits: string[];
      compatibility?: string[];
    };
  }>({});
  const [fetchingZodiac, setFetchingZodiac] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<'shared_story' | 'skirmish' | 'scripted_story'>('shared_story');
  const [storyArcChoices, setStoryArcChoices] = useState<StoryArcChoice[]>([]);
  /** Empty string = freeform shared story (no fixed arc). Non-empty = template id. */
  const [chosenStoryArcId, setChosenStoryArcId] = useState<string>('generic_arc');
  const heroIdRef = useRef<string | null>(heroId);
  const [pendingProposal, setPendingProposal] = useState<{
    roomId: string;
    proposal: { id: string; heroId: string; actionText: string; createdAt?: string };
  } | null>(null);
  const [agentTokenReveal, setAgentTokenReveal] = useState<string | null>(null);
  const [agentTokens, setAgentTokens] = useState<Array<{ id: string; revokedAt: string | null; expiresAt: string }>>([]);
  const [narration, setNarration] = useState<NarrationState>({ messageId: null, status: 'idle' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const narrationBlobUrlRef = useRef<string | null>(null);
  const narrationAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    heroIdRef.current = heroId;
  }, [heroId]);
  
  // Set premium status when hero is loaded - improved version to handle payment updates
  useEffect(() => {
    if (heroId) {
      const fetchHeroStatus = async () => {
        try {
          setFetchingZodiac(true);
          console.log(`Fetching hero data for hero ID: ${heroId}`);
          
          // Force a fresh API call to get the latest payment status
          const response = await api.get(`/api/heroes/${heroId}?t=${Date.now()}`);
          console.log('Hero data loaded from API:', response.data);
          
          // Check payment status from API response
          const isPaid = response.data.paymentStatus === 'paid';
          console.log(`Hero premium status: ${isPaid ? 'Premium' : 'Non-premium'}`);
          setIsPremium(isPaid);
          
          // Update the hero store with the latest data including payment status
          loadHeroFromAPI(response.data);
          
          // Also load the complete hero data to ensure we have zodiac signs
          if (!westernZodiac || !chineseZodiac) {
            setHeroDetails({
              westernZodiac: response.data.westernZodiac,
              chineseZodiac: response.data.chineseZodiac
            });
          }
        } catch (error) {
          console.error('Error fetching hero payment status:', error);
          // If the API call fails, try using the data from the hero store as a fallback
          const storePaymentStatus = useHeroStore.getState().paymentStatus;
          console.log(`Falling back to hero store payment status: ${storePaymentStatus}`);
          setIsPremium(storePaymentStatus === 'paid');
        } finally {
          setFetchingZodiac(false);
        }
      };
      
      fetchHeroStatus();
    } else {
      console.log('No hero ID available, setting premium status to false');
      setIsPremium(false);
    }
  }, [heroId, westernZodiac, chineseZodiac, loadHeroFromAPI]);
  
  // Connect to socket.io server
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // If no heroId is loaded yet (e.g., coming directly to this URL), 
    // redirect to heroes list to select a hero first
    if (!heroId && !roomId) {
      navigate('/heroes', { replace: true });
      return;
    }
    
    // Get the server URL from our secure socket helper
    const serverUrl = getSocketUrl();
    
    const socketIo = io(serverUrl, {
      path: '/socket.io/',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
    });
    
    socketRef.current = socketIo;
    setSocket(socketIo);
    
    // Socket event handlers
    socketIo.on('connect', () => {
      console.log('Connected to socket.io server');
      setIsConnected(true);
      setError((prev) =>
        prev?.includes('connect to') && prev?.includes('story server') ? null : prev
      );

      // Authenticate
      if (token && heroId) {
        socketIo.emit('authenticate', { token, heroId });
      }
    });

    socketIo.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // First attempts often fail while upgrading transport; surface only after retries give up.
    });

    socketIo.on('reconnect_failed', () => {
      setError(
        'Could not connect to the live story server (after several tries). Refresh the page, or try again without a VPN/ad-blocker blocking WebSockets.'
      );
      setIsLoading(false);
    });
    
    socketIo.on('authenticated', (data) => {
      console.log('Authenticated with socket.io server', data);
      
      // If we have a roomId, join the room
      if (roomId) {
        socketIo.emit('join_room', { roomId });
      }
    });
    
    socketIo.on('authentication_error', (error) => {
      console.error('Authentication error:', error);
      setError(error.message);
      setIsLoading(false);
    });
    
    socketIo.on('room_joined', (data) => {
      console.log('Joined room:', data);
      setIsLoading(false);
      setIsPremium(data.isPremium);
      setUserRole(data.role);
      setIsNarratorTyping(Boolean(data.initialNarratorPending));
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              mode: data.mode || prev.mode,
              agentDriveEnabled:
                data.agentDriveEnabled !== undefined
                  ? data.agentDriveEnabled
                  : prev.agentDriveEnabled,
              storyArc:
                data.storyArc !== undefined ? data.storyArc : prev.storyArc,
            }
          : prev
      );
      
      // Parse message timestamps
      const parsedMessages = data.messages.map(
        (msg: Message & { timestamp: string | Date }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })
      );
      
      setMessages(parsedMessages);
    });

    socketIo.on(
      'agent_action_pending',
      (payload: { roomId: string; proposal: { id: string; heroId: string; actionText: string } }) => {
        if (payload.roomId === roomId) {
          setPendingProposal(payload);
        }
      }
    );

    socketIo.on('agent_action_resolved', () => {
      setPendingProposal(null);
    });
    
    socketIo.on('message', (newMessage) => {
      console.log('New message:', newMessage);
      setIsNarratorTyping(false);
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          ...newMessage,
          timestamp: new Date(newMessage.timestamp)
        }
      ]);
    });
    
    socketIo.on('narrator_typing', () => {
      setIsNarratorTyping(true);
    });

    socketIo.on(
      'story_arc_updated',
      (summary: StoryArcSummary | null) => {
        setRoom((prev) =>
          prev ? { ...prev, storyArc: summary ?? prev.storyArc } : prev
        );
      }
    );

    socketIo.on(
      'hero_progression',
      (p: {
        heroId: string;
        level: number;
        xp: number;
        xpToNextLevel: number;
      }) => {
        if (p.heroId !== heroIdRef.current) return;
        const st = useHeroStore.getState();
        st.setLevel(p.level);
        st.setXp(p.xp);
        st.setXpToNextLevel(p.xpToNextLevel);
      }
    );
    
    socketIo.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });
    
    socketIo.on('disconnect', () => {
      console.log('Disconnected from socket.io server');
      setIsConnected(false);
    });
    
    // Clean up
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, heroId, roomId, isAuthenticated, navigate]);
  
  // Fetch room details if we have a roomId
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/api/shared-story/${roomId}`);
        const d = response.data;
        setRoom({
          roomId: d.roomId,
          title: d.title,
          participants: d.participants,
          created: new Date(d.created),
          mode: d.mode,
          agentDriveEnabled: d.agentDriveEnabled,
          ownerUserId: d.ownerUserId,
          storyArc: d.storyArc ?? null,
          voiceNarrationAvailable: Boolean(d.voiceNarrationAvailable),
        });
      } catch (error) {
        console.error('Error fetching room details:', error);
        setError('Failed to load room details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomDetails();
  }, [roomId]);
  
  useEffect(() => {
    const loadArcs = async () => {
      if (roomId) return;
      try {
        const r = await api.get<{ arcs: StoryArcChoice[] }>('/api/shared-story/story-arcs');
        setStoryArcChoices(r.data.arcs || []);
      } catch {
        setStoryArcChoices([]);
      }
    };
    void loadArcs();
  }, [roomId]);

  // Fetch active rooms when no roomId is provided
  useEffect(() => {
    const fetchActiveRooms = async () => {
      if (roomId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/api/shared-story');
        
        // Parse dates from strings to Date objects
        const roomsWithParsedDates = (
          response.data as Array<
            RoomListItem & { created: string | Date; updated: string | Date }
          >
        ).map((room) => ({
          ...room,
          created: new Date(room.created),
          updated: new Date(room.updated),
        }));
        
        setActiveRooms(roomsWithParsedDates);
      } catch (error) {
        console.error('Error fetching active rooms:', error);
        setError('Failed to load active shared story rooms');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActiveRooms();
  }, [roomId]);

  useEffect(() => {
    const loadTokens = async () => {
      if (!heroId || !roomId) return;
      try {
        const r = await api.get(`/api/heroes/${heroId}/agent-drive/tokens`);
        setAgentTokens(r.data.tokens || []);
      } catch {
        /* optional */
      }
    };
    void loadTokens();
  }, [heroId, roomId]);
  
  // If we're creating a new room, do that
  const handleCreateRoom = async () => {
    if (!heroId) {
      setError('Please select a hero first');
      return;
    }
    
    if (!isPremium) {
      setError('Only premium heroes can create shared story rooms');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Creating room with heroId:', heroId);
      
      const body: Record<string, unknown> = { heroId, mode: createMode };
      if (createMode === 'scripted_story') {
        body.storyArcId = chosenStoryArcId || 'generic_arc';
      } else if (createMode === 'shared_story' && chosenStoryArcId) {
        body.storyArcId = chosenStoryArcId;
      }
      const response = await api.post('/api/shared-story/create', body);
      console.log('Room created successfully:', response.data);

      try {
        const hres = await api.get(`/api/heroes/${heroId}`);
        loadHeroFromAPI(hres.data);
      } catch {
        /* optional */
      }

      // Navigate to the new room
      navigate(`/shared-story/${response.data.roomId}`);
    } catch (error: unknown) {
      console.error('Error creating room:', error);
      const ax = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const d = ax.response?.data;
      const errorMessage =
        d?.error === 'upstream_error' && d?.message
          ? d.message
          : d?.error || 'Failed to create room';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  // Handler for joining an existing room
  const handleJoinRoom = (roomId: string) => {
    navigate(`/shared-story/${roomId}`);
  };

  const handleCreateAgentToken = async () => {
    if (!heroId) return;
    try {
      const r = await api.post(`/api/heroes/${heroId}/agent-drive/tokens`, {
        roomId: roomId || undefined,
      });
      setAgentTokenReveal(r.data.token);
      const list = await api.get(`/api/heroes/${heroId}/agent-drive/tokens`);
      setAgentTokens(list.data.tokens || []);
    } catch (e) {
      console.error(e);
      setError('Could not create agent token');
    }
  };

  const handleToggleAgentDrive = async () => {
    if (!roomId || !room) return;
    try {
      const on = !room.agentDriveEnabled;
      await api.post(`/api/shared-story/${roomId}/agent-drive/${on ? 'enable' : 'disable'}`);
      setRoom((prev) => (prev ? { ...prev, agentDriveEnabled: on } : prev));
    } catch (e) {
      console.error(e);
      setError('Could not toggle Agent Drive');
    }
  };

  const handleProposalDecision = (decision: 'approve' | 'reject') => {
    if (!socket || !pendingProposal) return;
    socket.emit('agent_action_decision', {
      roomId: pendingProposal.roomId,
      proposalId: pendingProposal.proposal.id,
      decision,
      reason: '',
    });
    setPendingProposal(null);
  };

  const handleSkirmishResolve = async (outcome: 'win' | 'loss') => {
    if (!roomId || !heroId) return;
    try {
      await api.post(`/api/shared-story/${roomId}/skirmish/resolve`, {
        heroId,
        outcome,
      });
      const hres = await api.get(`/api/heroes/${heroId}`);
      loadHeroFromAPI(hres.data);
    } catch (e) {
      console.error(e);
      setError('Could not resolve skirmish');
    }
  };

  const handleScriptAdvance = async () => {
    if (!roomId || !heroId) return;
    try {
      await api.post(`/api/shared-story/${roomId}/scripted/advance`, { heroId });
      const hres = await api.get(`/api/heroes/${heroId}`);
      loadHeroFromAPI(hres.data);
      const rr = await api.get(`/api/shared-story/${roomId}`);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              storyArc: rr.data.storyArc ?? prev.storyArc,
              mode: rr.data.mode ?? prev.mode,
            }
          : prev
      );
    } catch (e) {
      console.error(e);
      setError('Could not advance script');
    }
  };
  
  const ensureAudioElement = useCallback((): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('ended', () => {
      setNarration((prev) =>
        prev.status === 'playing' ? { messageId: null, status: 'idle' } : prev
      );
    });
    audio.addEventListener('error', () => {
      setNarration((prev) => ({
        messageId: prev.messageId,
        status: 'error',
        error: 'Audio playback failed.',
      }));
    });
    audioRef.current = audio;
    return audio;
  }, []);

  const releaseNarrationBlob = useCallback(() => {
    if (narrationBlobUrlRef.current) {
      URL.revokeObjectURL(narrationBlobUrlRef.current);
      narrationBlobUrlRef.current = null;
    }
  }, []);

  const stopNarration = useCallback(() => {
    narrationAbortRef.current?.abort();
    narrationAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    releaseNarrationBlob();
    setNarration({ messageId: null, status: 'idle' });
  }, [releaseNarrationBlob]);

  const handleNarrationToggle = useCallback(
    async (messageId: string) => {
      if (!roomId) return;
      const audio = ensureAudioElement();

      if (narration.messageId === messageId) {
        if (narration.status === 'playing') {
          audio.pause();
          setNarration({ messageId, status: 'idle' });
          return;
        }
        if (narration.status === 'loading') {
          return;
        }
        if (narration.status === 'idle' && audio.src) {
          try {
            await audio.play();
            setNarration({ messageId, status: 'playing' });
          } catch (e) {
            console.error('Narration resume failed:', e);
            setNarration({ messageId, status: 'error', error: 'Could not resume playback.' });
          }
          return;
        }
      }

      audio.pause();
      releaseNarrationBlob();
      narrationAbortRef.current?.abort();
      const controller = new AbortController();
      narrationAbortRef.current = controller;
      setNarration({ messageId, status: 'loading' });

      try {
        const response = await api.get(
          `/api/shared-story/${roomId}/messages/${messageId}/narration`,
          { responseType: 'blob', signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(response.data as Blob);
        narrationBlobUrlRef.current = url;
        audio.src = url;
        await audio.play();
        if (controller.signal.aborted) return;
        setNarration({ messageId, status: 'playing' });
      } catch (e: unknown) {
        const ax = e as {
          code?: string;
          name?: string;
          response?: { status?: number; data?: Blob | { message?: string; error?: string } };
        };
        if (controller.signal.aborted || ax.code === 'ERR_CANCELED' || ax.name === 'CanceledError') {
          return;
        }
        let message = 'Could not voice this passage. Please try again.';
        const data = ax.response?.data;
        if (data instanceof Blob) {
          try {
            const parsed = JSON.parse(await data.text());
            if (parsed?.message || parsed?.error) {
              message = String(parsed.message || parsed.error);
            }
          } catch {
            /* opaque error payload — keep default copy */
          }
        } else if (data && typeof data === 'object') {
          message = data.message || data.error || message;
        }
        if (ax.response?.status === 503) {
          message = 'Voice narration is not configured on this server.';
        }
        console.error('Narration request failed:', e);
        releaseNarrationBlob();
        setNarration({ messageId, status: 'error', error: message });
      }
    },
    [roomId, narration.messageId, narration.status, ensureAudioElement, releaseNarrationBlob]
  );

  useEffect(() => {
    return () => {
      narrationAbortRef.current?.abort();
      narrationAbortRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      if (narrationBlobUrlRef.current) {
        URL.revokeObjectURL(narrationBlobUrlRef.current);
        narrationBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      stopNarration();
    }
  }, [roomId, stopNarration]);

  // Handler for sending messages
  const handleSendMessage = () => {
    if (!socket || !message.trim() || !isConnected) return;
    
    // Show the narrator typing animation after every third user message
    const userMessages = messages.filter(m => m.sender.id !== 'system').length;
    if ((userMessages + 1) % 3 === 0) {
      setIsNarratorTyping(true);
      
      // Add a slight artificial delay for better UX if the server response is too quick
      setTimeout(() => {
        if (isNarratorTyping && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
    
    // Emit the message
    socket.emit('send_message', { message: message.trim() });
    
    // Clear input
    setMessage('');
  };
  
  // Auto-scroll to bottom when new messages arrive but only if the user is at the bottom
  useEffect(() => {
    // Check if the user is near the bottom of the message container
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (scrollContainer) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      
      // Only auto-scroll if the user is already near the bottom or it's a system message
      const latestMessage = messages[messages.length - 1];
      const isSystemMessage = latestMessage?.sender.id === 'system';
      
      if (isNearBottom || isSystemMessage) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);
  
  // Open/close share dialog
  const toggleShareDialog = () => setShowShareDialog(prev => !prev);
  
  // Copy room link to clipboard
  const copyRoomLink = () => {
    if (!roomId) return;
    
    const link = `${window.location.origin}/shared-story/${roomId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };
  
  // Listen for narrator typing and automatically scroll
  useEffect(() => {
    if (isNarratorTyping && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNarratorTyping]);
  
  // Helper function to get the color for a zodiac sign
  const getZodiacColor = (sign: string | undefined): string => {
    if (!sign) return 'text-amber-200/95';
    const zodiacInfo = westernZodiacIcons[sign];
    return zodiacInfo?.color || 'text-amber-200/95';
  };
  
  // Loading state
  if (isLoading) {
    return (
      <motion.div
        className={sharedStoryPageMotionClass}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <SharedStoryChrome>
          <div className="flex flex-col items-center justify-center min-h-[55vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600/85 mx-auto mb-4"></div>
            <h2 className="text-2xl font-display font-semibold text-stone-100">
              {roomId ? 'Joining shared story...' : 'Creating new shared story...'}
            </h2>
            <p className="text-stone-400 mt-2">Please wait — connecting your session.</p>
          </div>
        </SharedStoryChrome>
      </motion.div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <motion.div
        className={sharedStoryPageMotionClass}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <SharedStoryChrome>
          <div className="flex flex-col items-center justify-center min-h-[55vh]">
          <div className="bg-red-950/40 p-6 rounded-sm border border-red-900/60 mb-4 max-w-md w-full shadow-lg shadow-black/30">
            <h2 className="text-2xl font-display font-semibold text-red-200 mb-2">Error</h2>
            <p className="text-red-300/95">{error}</p>
            
            <div className="mt-6 flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
              
              <Link to="/heroes">
                <Button>Select Different Hero</Button>
              </Link>
            </div>
          </div>
          </div>
        </SharedStoryChrome>
      </motion.div>
    );
  }
  
  // New room creation screen (no roomId)
  if (!roomId) {
    return (
      <motion.div
        className={sharedStoryPageMotionClass}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <SharedStoryChrome mainClassName="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/heroes"
            className="inline-flex items-center gap-2 text-amber-400/90 mb-8 hover:text-amber-300 transition-colors font-medium text-sm md:text-base"
          >
            <ArrowLeft size={16} />
            Back to Heroes
          </Link>

          <header className="mb-10">
            <p className="text-amber-500/95 font-display text-xs md:text-sm tracking-[0.2em] uppercase mb-3">
              Mythical Hero
            </p>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4 leading-tight">
              Shared story adventures
            </h1>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed max-w-2xl border-l-2 border-amber-600/55 pl-4">
              Create a room, pick a spine, and play with friends — Agent Drive hooks your hero to tooling you
              trust, with you approving every beat.
            </p>
          </header>

          <AgentDriveLobbyCallout />
          
          <div className={`mt-8 p-6 md:p-8 ${panelSurfaceClass}`}>
            <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6">Selected hero</h2>
            
            {heroId && heroName ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-900 rounded-full overflow-hidden border border-stone-700/80">
                  {images && images.length > 0 ? (
                    <img 
                      src={images[0]?.url} 
                      alt={heroName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} />
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-stone-100">{heroName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      isPremium 
                        ? 'bg-amber-950/50 text-amber-200/95 border border-amber-700/45' 
                        : 'bg-stone-800/70 text-stone-400 border border-stone-600/55'
                    }`}>
                      {isPremium ? 'Premium Hero' : 'Non-Premium Hero'}
                    </span>
                    {!isPremium && (
                      <Link to={`/checkout/${heroId}`} className="text-xs text-amber-400 underline">
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-900/55 p-4 rounded-sm border border-stone-700/70">
                <p className="text-stone-400">
                  No hero selected. Please choose a hero first.
                </p>
                
                <Link to="/heroes" className="mt-4 inline-block">
                  <Button>
                    Select a Hero
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-8">
              <p className="mb-4 text-stone-300 leading-relaxed">
                Create a new shared story room where your hero can embark on a grand adventure with other heroes.
                Premium heroes can actively participate, while non-premium heroes can spectate.{' '}
                <strong className="text-amber-200/95 font-semibold">
                  Premium hosts unlock Agent Drive: drive your hero from your own agent with full approval flow.
                </strong>
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {(['shared_story', 'skirmish', 'scripted_story'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setCreateMode(m);
                      if (m === 'scripted_story' && !chosenStoryArcId) {
                        setChosenStoryArcId('generic_arc');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-sm text-sm border transition-colors ${
                      createMode === m
                        ? 'border-amber-600/70 bg-amber-950/45 text-amber-100'
                        : 'border-stone-700 bg-stone-950/40 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    {m === 'shared_story'
                      ? 'Shared Story'
                      : m === 'skirmish'
                        ? 'Skirmish'
                        : 'Scripted Arc'}
                  </button>
                ))}
              </div>

              {(createMode === 'shared_story' || createMode === 'scripted_story') &&
                storyArcChoices.length > 0 && (
                  <div className="mb-4">
                    <label htmlFor="story-arc-select" className="block text-sm text-stone-400 mb-1">
                      {createMode === 'scripted_story' ? 'Scripted spine' : 'Story spine'}{' '}
                      <span className="text-xs text-stone-500">
                        (predefined arcs give each narrator beat a clearer goal)
                      </span>
                    </label>
                    <select
                      id="story-arc-select"
                      className="w-full max-w-xl bg-stone-900 border border-stone-700 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-600/45"
                      value={chosenStoryArcId}
                      onChange={(e) => setChosenStoryArcId(e.target.value)}
                    >
                      {createMode === 'shared_story' && (
                        <option value="">
                          Free improvisation (no scripted beats — narrator roams freely)
                        </option>
                      )}
                      {storyArcChoices.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.beatCount} beats)
                        </option>
                      ))}
                    </select>
                    {chosenStoryArcId ? (
                      <p className="text-xs text-stone-500 mt-2 max-w-xl">
                        {storyArcChoices.find((c) => c.id === chosenStoryArcId)?.tagline}
                      </p>
                    ) : null}
                  </div>
                )}
              
              <Button 
                onClick={handleCreateRoom}
                disabled={!heroId || !isPremium}
                icon={<Plus size={16} />}
                className={`w-full md:w-auto ${!isPremium ? 'opacity-50' : ''}`}
              >
                {isPremium ? 'Create New Shared Story' : 'Premium Required'}
              </Button>
              
              {!isPremium && heroId && (
                <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-sm">
                  <p className="text-amber-400 text-sm">
                    Only premium heroes can create and participate in shared stories.
                    <Link to={`/checkout/${heroId}`} className="ml-2 underline font-medium">
                      Upgrade this hero
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Shared Story Rooms */}
          <div className={`mt-8 p-6 md:p-8 ${panelSurfaceClass}`}>
            <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6">Join active adventures</h2>
            
            {activeRooms.length > 0 ? (
              <div className="space-y-4">
                {activeRooms.map(room => (
                  <div
                    key={room.id}
                    className="bg-stone-900/45 p-4 rounded-sm border border-stone-700/80 hover:border-amber-700/35 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium text-stone-100">{room.title}</h3>
                        <p className="text-stone-500 text-sm mt-1">
                          Created {new Date(room.created).toLocaleDateString()} • 
                          Last activity {new Date(room.updated).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-400/95">
                            <Users size={14} />
                            <span>{room.participantCount} Heroes</span>
                          </div>
                          <div className="flex items-center gap-1 text-sky-400/90">
                            <User size={14} />
                            <span>{room.spectatorCount} Spectators</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleJoinRoom(room.id)}
                          variant="outline"
                          size="sm"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600/85 mx-auto mb-4"></div>
                <p className="text-stone-400">Loading active adventures...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-stone-400">No active shared stories found. Create a new one!</p>
              </div>
            )}
          </div>
        </div>
        </SharedStoryChrome>
      </motion.div>
    );
  }
  
  // Room view (with roomId)
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={sharedStoryPageMotionClass}
    >
      <SharedStoryChrome>
      {/* Meta tags for shared story page */}
      {room ? (
        <MetaTags
          title={`${room.title} | Mythical Hero · Shared story`}
          description={`Collaborative cosmic RPG: play together, guided arcs — and Agent Drive lets the room owner connect their hero to their own AI agent (Cursor, MCP, automation) with in-app approval before each post.`}
          image="/logo.jpg"
          type="article"
        />
      ) : (
        <MetaTags
          title="Shared story | Mythical Hero"
          description="Shared Story RPG adventures with guided arcs — plus Agent Drive: drive your premium hero from your own AI agent, with human approval before every in-world post."
          image="/logo.jpg"
          type="website"
        />
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Dynamic background element that appears when narrator is typing */}
        <AnimatePresence>
          {isNarratorTyping && (
            <motion.div 
              className="fixed inset-0 bg-gradient-radial from-transparent via-transparent to-mystic-950/45 pointer-events-none z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          )}
        </AnimatePresence>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-amber-500/95 font-display text-xs uppercase tracking-[0.2em] mb-2">
              Mythical Hero
            </p>
            <Link
              to="/shared-story"
              className="inline-flex items-center gap-2 text-amber-400/90 hover:text-amber-300 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to stories
            </Link>
            
            <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-100 mt-3 leading-tight">
              {room?.title || 'Shared adventure'}
            </h1>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              icon={<Share2 size={16} />}
              onClick={toggleShareDialog}
            >
              Invite Heroes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              icon={<Users size={16} />}
            >
              {room?.participants?.length || 0} Heroes
            </Button>
          </div>
        </div>

        {/* Agent Drive — primary feature surface */}
        <section
          className={agentDriveSpotlightClass + ' mb-6'}
          aria-labelledby="agent-drive-room-heading"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-amber-900/35 border border-amber-600/45">
              <Bot className="h-8 w-8 text-amber-100" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-amber-500/95 font-display text-[11px] font-bold uppercase tracking-[0.22em]">
                  Featured capability
                </p>
                {room?.agentDriveEnabled ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Agent Drive on
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-800/80 text-stone-400 border border-stone-600/50">
                    Agent Drive off
                  </span>
                )}
              </div>
              <h2
                id="agent-drive-room-heading"
                className="font-display text-2xl md:text-4xl font-bold text-stone-100 tracking-tight"
              >
                Agent Drive
              </h2>
              <p className="text-stone-200 text-base md:text-lg leading-relaxed max-w-3xl">
                <strong className="text-stone-100 text-lg md:text-xl">Drive your hero with your own agent.</strong>{' '}
                Connect Claude, Cursor, or any MCP client using a scoped token. Your tooling proposes dialogue
                and actions for{' '}
                <em className="text-amber-200/95 font-semibold not-italic">{heroName || 'your hero'}</em>
                — you keep the reins: proposals appear here for your approval before they post to the shared
                chronicle.
              </p>

              {!isPremium ? (
                <div className="rounded-sm bg-stone-950/50 border border-amber-800/45 p-4 text-sm text-amber-200/95">
                  <strong className="text-amber-100">Premium required.</strong> Upgrade your hero to host rooms,
                  enable Agent Drive, and mint automation tokens.
                  {heroId ? (
                    <Link to={`/checkout/${heroId}`} className="ml-2 underline font-medium">
                      Unlock this hero
                    </Link>
                  ) : null}
                </div>
              ) : userId && room?.ownerUserId === userId ? (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-stone-300 font-medium flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-500/85" aria-hidden />
                    You are session host — only you can toggle Agent Drive and create tokens for this room.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant={room?.agentDriveEnabled ? 'secondary' : 'primary'}
                      type="button"
                      onClick={handleToggleAgentDrive}
                      className={
                        !room?.agentDriveEnabled
                          ? 'ring-2 ring-amber-600/50 ring-offset-2 ring-offset-stone-950'
                          : ''
                      }
                    >
                      {room?.agentDriveEnabled ? 'Turn off Agent Drive' : 'Turn on Agent Drive'}
                    </Button>
                    <Button size="sm" variant="outline" type="button" onClick={handleCreateAgentToken}>
                      Mint new agent token
                    </Button>
                  </div>
                  {agentTokenReveal && (
                    <p className="text-xs text-amber-300 break-all bg-black/30 rounded-md p-3 border border-amber-800/30">
                      <strong className="text-amber-200">Copy now — shown once:</strong> {agentTokenReveal}
                    </p>
                  )}
                  {agentTokens.length > 0 ? (
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Active tokens</p>
                      <ul className="text-xs text-stone-400 space-y-1.5">
                        {agentTokens.map((t) => (
                          <li key={t.id}>
                            {t.id.slice(0, 8)}… {t.revokedAt ? 'revoked' : 'active'}
                            {t.expiresAt ? ` · exp ${new Date(t.expiresAt).toLocaleDateString()}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">
                      No tokens yet. Turn Agent Drive on, then mint a token and configure your MCP client (see{' '}
                      <code className="text-stone-400 bg-stone-950/80 px-1 rounded-sm border border-stone-700/80">
                        agentDriveServer.mjs
                      </code>{' '}
                      in this project).
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-sm bg-stone-950/45 border border-stone-700/70 p-4 text-sm text-stone-300 leading-relaxed">
                  <strong className="text-stone-100">Watching or playing as guest?</strong>{' '}
                  Only this session&apos;s host can enable Agent Drive and issue tokens from their dashboard
                  section here. Invite them to toggle it on so their hero automation can propose turns —{' '}
                  <strong className="text-amber-200/95">nothing posts without host approval.</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        {pendingProposal && userId && room?.ownerUserId === userId && (
          <div className="bg-amber-950/35 border border-amber-700/55 rounded-sm p-4 mb-6">
            <p className="text-sm font-medium text-amber-200 mb-2">
              Agent Drive — proposed hero action (needs your approval)
            </p>
            <p className="text-stone-100 mb-4 whitespace-pre-wrap">{pendingProposal.proposal.actionText}</p>
            <div className="flex gap-2">
              <Button size="sm" type="button" onClick={() => handleProposalDecision('approve')}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => handleProposalDecision('reject')}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${panelSurfaceMutedClass} p-4 md:col-span-2`}>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Legend progress</p>
            <p className="text-amber-200/95 font-medium">
              Level {level} — {xp} / {xpToNextLevel} XP
            </p>
            <p className="text-stone-500 text-sm mt-1">
              Epic Legendary Book chapters unlock with level-ups (linked progression).
            </p>
          </div>
          <div className={`${panelSurfaceMutedClass} p-4`}>
            <p className="text-xs text-stone-500 uppercase mb-2">Session mode</p>
            <p className="text-sm capitalize text-stone-200">
              {(room?.mode || 'shared_story').replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {room?.storyArc ? (
          <div className="bg-stone-950/50 border border-amber-900/30 rounded-sm p-4 mb-6 shadow-md shadow-black/15">
            <p className="text-xs text-amber-500/90 uppercase tracking-wide mb-1 font-display">
              Guided arc — beat {room.storyArc.stepIndex + 1} / {room.storyArc.totalSteps}
            </p>
            <p className="text-lg font-medium text-stone-100 font-display">{room.storyArc.arcName}</p>
            <p className="text-stone-400 text-sm mt-1">{room.storyArc.tagline}</p>
            <p className="text-amber-200/90 text-sm mt-3">
              <span className="text-stone-500">Now playing: </span>
              <span className="font-medium">{room.storyArc.currentBeatTitle}</span>
              <span className="text-stone-600 text-xs ml-2">({room.storyArc.currentBeatKey})</span>
            </p>
            {room.mode === 'shared_story' ? (
              <p className="text-xs text-stone-500 mt-2">
                The arc advances automatically when the Cosmic Narrator speaks (every third hero post).
              </p>
            ) : null}
          </div>
        ) : null}

        {room?.mode === 'skirmish' && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => void handleSkirmishResolve('win')}
            >
              Record Skirmish Win
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => void handleSkirmishResolve('loss')}
            >
              Record Skirmish Loss
            </Button>
          </div>
        )}

        {room?.mode === 'scripted_story' && userId === room?.ownerUserId && (
          <div className="mb-4">
            <Button size="sm" type="button" onClick={() => void handleScriptAdvance()}>
              Advance scripted beat
            </Button>
          </div>
        )}
        
        {/* Share dialog */}
        {showShareDialog && (
          <div className={`p-4 md:p-5 mb-6 ${panelSurfaceClass}`}>
            <h3 className="text-lg font-display font-semibold text-stone-100 mb-2">Invite other heroes</h3>
            <p className="text-sm text-stone-400 mb-4">
              Share this link with other users to let them join this adventure:
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/shared-story/${roomId}`}
                className="flex-grow bg-stone-900 border border-stone-700 rounded-sm px-3 py-2 text-sm text-stone-200"
              />
              
              <Button
                size="sm"
                onClick={copyRoomLink}
                icon={<Copy size={16} />}
              >
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Role indicator */}
        {userRole && (
          <div className={`inline-block mb-4 px-3 py-1 rounded-full text-xs ${
            userRole === 'participant' 
              ? 'bg-amber-950/50 text-amber-200/95 border border-amber-700/45' 
              : 'bg-stone-900/65 text-stone-400 border border-stone-600/55'
          }`}>
            {userRole === 'participant' ? 'Participating Hero' : 'Spectating Hero'}
          </div>
        )}
        
        {/* Main chat area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Messages */}
          <div className="lg:col-span-3 bg-stone-950/40 rounded-sm border border-stone-700/85 flex flex-col h-[600px] md:h-[600px] h-[calc(100vh-220px)] shadow-lg shadow-black/25">
            {/* Messages container */}
            <div className="flex-grow overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-stone-400">
                    No messages yet. Be the first to start this adventure!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender.id === 'system' 
                          ? 'bg-stone-900/70 border border-amber-900/35 p-4 rounded-sm relative overflow-hidden' 
                          : ''
                      }`}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                    >
                      {/* Cosmic background for narrator messages */}
                      {msg.sender.id === 'system' && (
                        <div className="absolute inset-0 opacity-25 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/0 via-amber-900/20 to-stone-950/0"></div>
                          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-stone-950/0 via-amber-600/40 to-stone-950/0"></div>
                          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-stone-950/0 via-amber-700/25 to-stone-950/0"></div>
                        </div>
                      )}
                      
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                          msg.sender.id === 'system' 
                            ? 'bg-stone-950 border border-amber-700/50 relative' 
                            : 'bg-stone-900 border border-stone-700/70'
                        }`}>
                          {msg.sender.avatar ? (
                            <img 
                              src={msg.sender.avatar} 
                              alt={msg.sender.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              {msg.sender.id === 'system' ? (
                                <>
                                  <div className="absolute inset-0 bg-stone-900 opacity-50"></div>
                                  <Sparkles size={18} className="text-amber-400/95 z-10" />
                                </>
                              ) : (
                                <User size={18} className="text-stone-500" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`font-medium ${
                            msg.sender.id === 'system' ? 'text-amber-200/95' : 'text-stone-100'
                          }`}>
                            {msg.sender.name}
                          </span>
                          <span className="text-stone-500 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender.id === 'system' &&
                            msg.sender.name === 'Cosmic Narrator' &&
                            room?.voiceNarrationAvailable && (
                              <NarratorPlayButton
                                messageId={msg.id}
                                narration={narration}
                                onToggle={handleNarrationToggle}
                              />
                            )}
                        </div>

                        <div
                          className={`prose prose-sm prose-invert max-w-none ${
                            msg.sender.id === 'system' ? 'prose-cosmic shared-story-content' : ''
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: msg.sender.id === 'system'
                              ? formatLiterarySharedStory(msg.content)
                              : formatMarkdown(msg.content)
                          }}
                        />
                        {msg.sender.id === 'system' &&
                          msg.sender.name === 'Cosmic Narrator' &&
                          narration.messageId === msg.id &&
                          narration.status === 'error' &&
                          narration.error && (
                            <p className="mt-2 text-xs text-red-300/95" role="alert">
                              {narration.error}
                            </p>
                          )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Narrator typing animation */}
                  <AnimatePresence>
                    {isNarratorTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="py-2 relative z-10 bg-stone-950/30 rounded-sm overflow-hidden border border-stone-800/60"
                      >
                        <CosmicNarratorLoading />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="p-3 border-t border-stone-800/90">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!isPremium || userRole !== 'participant'}
                  placeholder={
                    !isPremium 
                      ? "Only premium heroes can send messages" 
                      : "Type your message..."
                  }
                  className="flex-grow bg-stone-900 border border-stone-700 rounded-sm px-4 py-2 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-600/40"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                
                <Button
                  icon={<Send size={16} />}
                  onClick={handleSendMessage}
                  disabled={!isPremium || !message.trim() || userRole !== 'participant'}
                >
                  Send
                </Button>
              </div>
              
              {!isPremium && (
                <div className="mt-2 text-amber-400 text-xs">
                  Only premium heroes can participate in the adventure.
                  <Link to={`/checkout/${heroId}`} className="ml-1 underline">
                    Upgrade your hero
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Hero Trait Card */}
            <div className="bg-stone-950/45 rounded-sm border border-stone-700/85 overflow-hidden shadow-lg shadow-black/25">
              {/* Hero image background with gradient overlay */}
              <div className="relative h-48">
                {images && images.length >= 3 ? (
                  <>
                    <div className="absolute inset-0">
                      <img 
                        src={images[2]?.url} 
                        alt={`${heroName} - Action Shot`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-mystic-950/90 to-stone-950"></div>
                )}
                
                {/* Hero name */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-amber-600/60 overflow-hidden bg-stone-900">
                      {images && images.length > 0 ? (
                        <img 
                          src={images[0]?.url} 
                          alt={heroName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={24} className="text-stone-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-stone-100 font-display">{heroName}</h3>
                      <div className="flex items-center gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          isPremium 
                            ? 'bg-amber-950/50 text-amber-200/95 border border-amber-700/45' 
                            : 'bg-stone-800/70 text-stone-400 border border-stone-600/55'
                        }`}>
                          {isPremium ? 'Premium' : 'Spectator'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Traits section */}
              <div className="p-4">
                <h4 className="text-sm uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500/85 shrink-0" />
                  <span>Legend traits</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    className="p-3 rounded-sm bg-stone-900/55 border border-stone-700/75"
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sun size={16} className="text-amber-400" />
                      <span className="text-xs uppercase tracking-wider text-stone-500">Western sign</span>
                    </div>
                    {fetchingZodiac ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-amber-500/80" />
                        <span className="text-stone-400 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className={`font-medium ${getZodiacColor(westernZodiac?.sign || heroDetails.westernZodiac?.sign)} text-lg`}>
                        {westernZodiac?.sign || heroDetails.westernZodiac?.sign || 'Unknown'}
                      </p>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="p-3 rounded-sm bg-stone-900/55 border border-stone-700/75"
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Moon size={16} className="text-amber-400/75" />
                      <span className="text-xs uppercase tracking-wider text-stone-500">Chinese sign</span>
                    </div>
                    {fetchingZodiac ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-amber-500/80" />
                        <span className="text-stone-400 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="font-medium text-amber-300/95 text-lg">
                        {chineseZodiac?.sign || heroDetails.chineseZodiac?.sign || 'Unknown'}
                      </p>
                    )}
                  </motion.div>
                </div>
                
                {userRole === 'participant' && (
                  <div className="mt-3 p-2 rounded-sm bg-amber-950/25 border border-amber-800/35">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-400" />
                      <p className="text-sm text-amber-200/90">
                        Your hero can actively shape this journey.
                      </p>
                    </div>
                  </div>
                )}
                
                {userRole === 'spectator' && (
                  <div className="mt-3 p-2 rounded-sm bg-stone-900/50 border border-stone-700/50">
                    <div className="flex items-center gap-2">
                      <div className="text-stone-500">
                        <User size={16} />
                      </div>
                      <p className="text-sm text-stone-400">Your hero is watching the adventure unfold.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Participants list */}
            <div className={`p-4 overflow-y-auto max-h-[300px] lg:max-h-[400px] ${panelSurfaceClass}`}>
              <h2 className="text-lg font-display font-semibold text-stone-100 mb-3 flex items-center gap-2 sticky top-0 bg-stone-950/90 backdrop-blur-sm py-1 z-[1] -mx-1 px-1">
                <Users size={18} className="text-amber-500/85 shrink-0" />
                <span>Heroes</span>
                {room?.participants?.length > 0 && (
                  <span className="ml-auto text-sm text-stone-500">
                    {room.participants.length} {room.participants.length === 1 ? 'Hero' : 'Heroes'}
                  </span>
                )}
              </h2>
              
              <div className="space-y-4">
                {room?.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-900 rounded-full overflow-hidden border border-stone-700/75">
                      {participant.avatar ? (
                        <img 
                          src={participant.avatar} 
                          alt={participant.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={18} className="text-stone-500" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-stone-100">{participant.name}</div>
                      <div className="text-amber-200/85 text-xs">
                        {participant.isPremium ? 'Participating' : 'Spectating'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!room?.participants || room.participants.length === 0) && (
                  <p className="text-stone-500 text-sm">No heroes have joined yet</p>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
      </SharedStoryChrome>
    </motion.div>
  );
};

export default SharedStoryPage; 