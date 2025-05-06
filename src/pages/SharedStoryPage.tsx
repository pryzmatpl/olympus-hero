import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../App';
import { useHeroStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import api from '../utils/api';
import { formatMarkdown } from '../utils/markdownHelper';
import { Plus, Send, Share2, User, Users, ArrowLeft, Copy, Sparkles, Sun, Moon, Star, Loader2 } from 'lucide-react';

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
      className="absolute w-60 h-60 rounded-full bg-cosmic-500/10 blur-xl"
      variants={glowVariants}
      initial="initial"
      animate="animate"
    />
    
    {/* Main cosmic orb */}
    <motion.div 
      className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-cosmic-900 via-cosmic-700 to-cosmic-500 blur-md"
      variants={cosmicPulseVariants}
      initial="initial"
      animate="animate"
    />
    
    {/* Divine rays */}
    <motion.div 
      className="absolute w-56 h-56 bg-gradient-to-tr from-cosmic-500/0 via-cosmic-400/10 to-cosmic-300/30"
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
          i % 2 === 0 ? 'bg-purple-400' : 'bg-cosmic-300'
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
        className="absolute w-1 h-1 bg-white rounded-full shadow-lg shadow-cosmic-300"
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
    <div className="z-10 text-center backdrop-blur-sm bg-mystic-900/30 rounded-lg p-3 border border-cosmic-800/50">
      <div className="flex items-center justify-center mb-2">
        <Sparkles className="text-cosmic-300 w-6 h-6 mr-2" />
        <span className="text-cosmic-300 font-display font-semibold">Cosmic Narrator</span>
        <Sparkles className="text-cosmic-300 w-6 h-6 ml-2" />
      </div>
      <p className="text-cosmic-400 text-sm">Channeling cosmic wisdom...</p>
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

interface SharedRoom {
  roomId: string;
  title: string;
  participants: Participant[];
  created: Date;
}

// Interface for room list items
interface RoomListItem {
  id: string;
  title: string;
  participantCount: number;
  spectatorCount: number;
  created: Date;
  updated: Date;
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

const SharedStoryPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { heroId, heroName, images, status, westernZodiac, chineseZodiac, loadHeroFromAPI } = useHeroStore();
  
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
  const [heroDetails, setHeroDetails] = useState<{westernZodiac?: string, chineseZodiac?: string}>({});
  const [fetchingZodiac, setFetchingZodiac] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Set premium status when hero is loaded
  useEffect(() => {
    if (heroId) {
      const fetchHeroStatus = async () => {
        try {
          setFetchingZodiac(true);
          const response = await api.get(`/api/heroes/${heroId}`);
          setIsPremium(response.data.paymentStatus === 'paid');
          
          // Also load the complete hero data to ensure we have zodiac signs
          if (!westernZodiac || !chineseZodiac) {
            setHeroDetails({
              westernZodiac: response.data.westernZodiac,
              chineseZodiac: response.data.chineseZodiac
            });
            
            // Load into store for future reference
            if (response.data.westernZodiac && response.data.chineseZodiac) {
              loadHeroFromAPI(heroId);
            }
          }
        } catch (error) {
          console.error('Error fetching hero payment status:', error);
        } finally {
          setFetchingZodiac(false);
        }
      };
      
      fetchHeroStatus();
    } else {
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
    
    // Connect to socket
    const socketIo = io(`${api.defaults.baseURL}`);
    socketRef.current = socketIo;
    setSocket(socketIo);
    
    // Socket event handlers
    socketIo.on('connect', () => {
      console.log('Connected to socket.io server');
      setIsConnected(true);
      
      // Authenticate
      if (token && heroId) {
        socketIo.emit('authenticate', { token, heroId });
      }
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
      
      // Parse message timestamps
      const parsedMessages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(parsedMessages);
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
        setRoom(response.data);
      } catch (error) {
        console.error('Error fetching room details:', error);
        setError('Failed to load room details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomDetails();
  }, [roomId]);
  
  // Fetch active rooms when no roomId is provided
  useEffect(() => {
    const fetchActiveRooms = async () => {
      if (roomId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/api/shared-story');
        
        // Parse dates from strings to Date objects
        const roomsWithParsedDates = response.data.map((room: any) => ({
          ...room,
          created: new Date(room.created),
          updated: new Date(room.updated)
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
      
      const response = await api.post('/api/shared-story/create', { heroId });
      console.log('Room created successfully:', response.data);
      
      // Navigate to the new room
      navigate(`/shared-story/${response.data.roomId}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create room';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  // Handler for joining an existing room
  const handleJoinRoom = (roomId: string) => {
    navigate(`/shared-story/${roomId}`);
  };
  
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
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (!sign) return 'text-cosmic-300';
    const zodiacInfo = westernZodiacIcons[sign];
    return zodiacInfo?.color || 'text-cosmic-300';
  };
  
  // Loading state
  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto px-4 pt-20 pb-10"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">
            {roomId ? 'Joining shared story...' : 'Creating new shared story...'}
          </h2>
          <p className="text-gray-400 mt-2">Please wait as we align the cosmic forces.</p>
        </div>
      </motion.div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <motion.div
        className="container mx-auto px-4 pt-20 pb-10"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="bg-red-900/30 p-6 rounded-xl border border-red-800 mb-4 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-red-200 mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
            
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
      </motion.div>
    );
  }
  
  // New room creation screen (no roomId)
  if (!roomId) {
    return (
      <motion.div
        className="container mx-auto px-4 pt-20 pb-10"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-4xl mx-auto">
          <Link to="/heroes" className="inline-flex items-center gap-2 text-cosmic-400 mb-6 hover:text-cosmic-300 transition-colors">
            <ArrowLeft size={16} />
            Back to Heroes
          </Link>
          
          <PageTitle>Shared Story Adventures</PageTitle>
          
          <div className="mt-8 bg-mystic-900/60 rounded-xl p-6 border border-mystic-700">
            <h2 className="text-2xl font-semibold mb-4">Selected Hero</h2>
            
            {heroId && heroName ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-mystic-800 rounded-full overflow-hidden">
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
                  <h3 className="text-xl font-medium">{heroName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      isPremium 
                        ? 'bg-cosmic-900/60 text-cosmic-400 border border-cosmic-800' 
                        : 'bg-mystic-800/60 text-gray-400 border border-mystic-700'
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
              <div className="bg-mystic-800/60 p-4 rounded-lg">
                <p className="text-gray-400">
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
              <p className="mb-4">
                Create a new shared story room where your hero can embark on a grand adventure with other heroes. Premium heroes can actively participate, while non-premium heroes can spectate.
              </p>
              
              <Button 
                onClick={handleCreateRoom}
                disabled={!heroId || !isPremium}
                icon={<Plus size={16} />}
                className={`w-full md:w-auto ${!isPremium ? 'opacity-50' : ''}`}
              >
                {isPremium ? 'Create New Shared Story' : 'Premium Required'}
              </Button>
              
              {!isPremium && heroId && (
                <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
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
          <div className="mt-8 bg-mystic-900/60 rounded-xl p-6 border border-mystic-700">
            <h2 className="text-2xl font-semibold mb-4">Join Active Adventures</h2>
            
            {activeRooms.length > 0 ? (
              <div className="space-y-4">
                {activeRooms.map(room => (
                  <div key={room.id} className="bg-mystic-800/60 p-4 rounded-lg border border-mystic-700 hover:border-cosmic-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium">{room.title}</h3>
                        <p className="text-cosmic-400 text-sm">
                          Created {new Date(room.created).toLocaleDateString()} • 
                          Last activity {new Date(room.updated).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-400">
                            <Users size={14} />
                            <span>{room.participantCount} Heroes</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-400">
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
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading active adventures...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No active shared stories found. Create a new one!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Room view (with roomId)
  return (
    <motion.div
      className="container mx-auto px-4 pt-20 pb-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-6xl mx-auto">
        {/* Dynamic background element that appears when narrator is typing */}
        <AnimatePresence>
          {isNarratorTyping && (
            <motion.div 
              className="fixed inset-0 bg-gradient-radial from-transparent via-transparent to-cosmic-900/40 pointer-events-none z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          )}
        </AnimatePresence>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <div>
            <Link to="/shared-story" className="inline-flex items-center gap-2 text-cosmic-400 hover:text-cosmic-300 transition-colors">
              <ArrowLeft size={16} />
              Back to Stories
            </Link>
            
            <h1 className="text-2xl md:text-3xl font-display font-semibold mt-2">
              {room?.title || 'Shared Cosmic Adventure'}
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
              {room?.participants.length || 0} Heroes
            </Button>
          </div>
        </div>
        
        {/* Share dialog */}
        {showShareDialog && (
          <div className="bg-mystic-800 border border-mystic-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-2">Invite Other Heroes</h3>
            <p className="text-sm text-gray-400 mb-4">
              Share this link with other users to let them join this adventure:
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/shared-story/${roomId}`}
                className="flex-grow bg-mystic-900 border border-mystic-700 rounded-md px-3 py-2 text-sm"
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
              ? 'bg-cosmic-900/60 text-cosmic-400 border border-cosmic-800' 
              : 'bg-mystic-800/60 text-gray-400 border border-mystic-700'
          }`}>
            {userRole === 'participant' ? 'Participating Hero' : 'Spectating Hero'}
          </div>
        )}
        
        {/* Main chat area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Messages */}
          <div className="lg:col-span-3 bg-mystic-900/30 rounded-xl border border-mystic-800 flex flex-col h-[600px]">
            {/* Messages container */}
            <div className="flex-grow overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-400">
                    No messages yet. Be the first to start this cosmic adventure!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender.id === 'system' 
                          ? 'bg-cosmic-900/30 border border-cosmic-800/60 p-4 rounded-lg relative overflow-hidden' 
                          : ''
                      }`}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                    >
                      {/* Cosmic background for narrator messages */}
                      {msg.sender.id === 'system' && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-cosmic-900/0 via-cosmic-600/30 to-cosmic-900/0"></div>
                          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-cosmic-900/0 via-cosmic-500/50 to-cosmic-900/0"></div>
                          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cosmic-900/0 via-cosmic-500/30 to-cosmic-900/0"></div>
                        </div>
                      )}
                      
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                          msg.sender.id === 'system' 
                            ? 'bg-cosmic-900 border border-cosmic-600 relative' 
                            : 'bg-mystic-800'
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
                                  <div className="absolute inset-0 bg-cosmic-800 opacity-50"></div>
                                  <Sparkles size={18} className="text-cosmic-300 z-10" />
                                </>
                              ) : (
                                <User size={18} className="text-gray-400" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            msg.sender.id === 'system' ? 'text-cosmic-300' : 'text-white'
                          }`}>
                            {msg.sender.name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div 
                          className={`prose prose-sm prose-invert max-w-none ${
                            msg.sender.id === 'system' ? 'prose-cosmic' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                        />
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
                        className="py-2 relative z-10 bg-cosmic-900/10 rounded-xl overflow-hidden"
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
            <div className="p-3 border-t border-mystic-800">
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
                  className="flex-grow bg-mystic-800 border border-mystic-700 rounded-lg px-4 py-2"
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
            <div className="bg-mystic-900/30 rounded-xl border border-mystic-800 overflow-hidden">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-mystic-900 via-mystic-900/70 to-transparent"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-mystic-800 to-cosmic-900/50"></div>
                )}
                
                {/* Hero name */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-cosmic-500 overflow-hidden bg-mystic-800">
                      {images && images.length > 0 ? (
                        <img 
                          src={images[0]?.url} 
                          alt={heroName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{heroName}</h3>
                      <div className="flex items-center gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          isPremium 
                            ? 'bg-cosmic-900/60 text-cosmic-400 border border-cosmic-800' 
                            : 'bg-mystic-800/60 text-gray-400 border border-mystic-700'
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
                <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>Cosmic Traits</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    className="p-3 rounded-lg bg-mystic-800/50 border border-cosmic-800/30"
                    whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(24, 24, 43, 0.3)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sun size={16} className="text-amber-400" />
                      <span className="text-xs uppercase tracking-wider text-gray-400">Western Sign</span>
                    </div>
                    {fetchingZodiac ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-cosmic-400" />
                        <span className="text-gray-400 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className={`font-medium ${getZodiacColor(westernZodiac || heroDetails.westernZodiac)} text-lg`}>
                        {westernZodiac || heroDetails.westernZodiac || 'Unknown'}
                      </p>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="p-3 rounded-lg bg-mystic-800/50 border border-cosmic-800/30"
                    whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(24, 24, 43, 0.3)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Moon size={16} className="text-cosmic-400" />
                      <span className="text-xs uppercase tracking-wider text-gray-400">Chinese Sign</span>
                    </div>
                    {fetchingZodiac ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-cosmic-400" />
                        <span className="text-gray-400 text-sm">Loading...</span>
                      </div>
                    ) : (
                      <p className="font-medium text-cosmic-400 text-lg">
                        {chineseZodiac || heroDetails.chineseZodiac || 'Unknown'}
                      </p>
                    )}
                  </motion.div>
                </div>
                
                {userRole === 'participant' && (
                  <div className="mt-3 p-2 rounded-lg bg-cosmic-900/20 border border-cosmic-800/30">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-400" />
                      <p className="text-sm text-cosmic-300">Your hero can actively shape this cosmic journey.</p>
                    </div>
                  </div>
                )}
                
                {userRole === 'spectator' && (
                  <div className="mt-3 p-2 rounded-lg bg-mystic-800/50 border border-mystic-700/30">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-500">
                        <User size={16} />
                      </div>
                      <p className="text-sm text-gray-400">Your hero is watching the adventure unfold.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Participants list */}
            <div className="bg-mystic-900/30 rounded-xl border border-mystic-800 p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users size={18} />
                <span>Heroes</span>
              </h2>
              
              <div className="space-y-4">
                {room?.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mystic-800 rounded-full overflow-hidden">
                      {participant.avatar ? (
                        <img 
                          src={participant.avatar} 
                          alt={participant.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={18} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-cosmic-400 text-xs">
                        {participant.isPremium ? 'Participating' : 'Spectating'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!room?.participants || room.participants.length === 0) && (
                  <p className="text-gray-500 text-sm">No heroes have joined yet</p>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};

export default SharedStoryPage; 