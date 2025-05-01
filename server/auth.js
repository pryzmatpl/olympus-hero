import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for users (would be a database in production)
const users = new Map();

/**
 * Register a new user
 */
export const registerUser = (email, password, name) => {
  // Check if user already exists
  const existingUser = [...users.values()].find(user => user.email === email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create a new user
  const userId = uuidv4();
  const user = {
    id: userId,
    email,
    password, // In a real app, this would be hashed
    name,
    heroes: [],
    created: new Date()
  };

  // Store the user
  users.set(userId, user);
  return { userId, email, name };
};

/**
 * Log in a user
 */
export const loginUser = (email, password) => {
  // Find the user
  const user = [...users.values()].find(user => user.email === email);
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }

  // Generate a JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, email: user.email, name: user.name } };
};

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    
    // Add the user data to the request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get a user by ID
 */
export const getUserById = (userId) => {
  if (!users.has(userId)) {
    return null;
  }
  
  const user = users.get(userId);
  // Don't return the password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Associate a hero with a user
 */
export const addHeroToUser = (userId, heroId) => {
  if (!users.has(userId)) {
    throw new Error('User not found');
  }
  
  const user = users.get(userId);
  user.heroes.push(heroId);
  users.set(userId, user);
  
  return user.heroes;
};

// Export the users Map for use in other modules
export const getUsersMap = () => users; 