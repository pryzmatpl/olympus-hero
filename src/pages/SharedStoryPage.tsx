import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../App';
import { useHeroStore } from '../store/heroStore';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import api from '../utils/api';
import { formatMarkdown } from '../utils/markdownHelper';
import { Plus, Send, Share2, User, Users, ArrowLeft, Copy } from 'lucide-react';

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

const SharedStoryPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { heroId, heroName, images, status, loadHeroFromAPI } = useHeroStore();
  
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Set premium status when hero is loaded
  useEffect(() => {
    if (heroId) {
      const fetchHeroStatus = async () => {
        try {
          const response = await api.get(`/api/heroes/${heroId}`);
          setIsPremium(response.data.paymentStatus === 'paid');
        } catch (error) {
          console.error('Error fetching hero payment status:', error);
        }
      };
      
      fetchHeroStatus();
    } else {
      setIsPremium(false);
    }
  }, [heroId]);
  
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
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          ...newMessage,
          timestamp: new Date(newMessage.timestamp)
        }
      ]);
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
                      className={`flex gap-3 ${msg.sender.id === 'system' ? 'bg-cosmic-900/20 border border-cosmic-800/50 p-3 rounded-lg' : ''}`}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                          msg.sender.id === 'system' 
                            ? 'bg-cosmic-900 border border-cosmic-700' 
                            : 'bg-mystic-800'
                        }`}>
                          {msg.sender.avatar ? (
                            <img 
                              src={msg.sender.avatar} 
                              alt={msg.sender.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            msg.sender.id === 'system' ? 'text-cosmic-400' : 'text-white'
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
    </motion.div>
  );
};

export default SharedStoryPage; 