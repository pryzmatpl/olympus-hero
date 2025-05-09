import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userDb } from './db.js';
import bcrypt from 'bcrypt';

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Register a new user
 */
export const registerUser = async (email, password, name) => {
  // Check if user already exists
  const existingUser = await userDb.findUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create a new user
  const userId = uuidv4();
  const user = {
    id: userId,
    email,
    password: hashedPassword,
    name,
    heroes: [],
    created: new Date()
  };

  // Store the user
  await userDb.createUser(user);
  return { userId, email, name };
};

/**
 * Log in a user
 */
export const loginUser = async (email, password) => {
  // Find the user
  const user = await userDb.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if the password is in the old plaintext format
  // This helps with migrating existing users
  if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
    // If it's plaintext and matches, migrate to hashed password
    if (user.password === password) {
      // Update to hashed password
      const hashedPassword = await hashPassword(password);
      await userDb.updateUser(user.id, { password: hashedPassword });
    } else {
      throw new Error('Invalid credentials');
    }
  } else {
    // Password is already hashed, verify it
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
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
export const getUserById = async (userId) => {
  const user = await userDb.findUserById(userId);
  if (!user) {
    return null;
  }
  
  // Don't return the password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Associate a hero with a user
 */
export const addHeroToUser = async (userId, heroId) => {
  try {
    return await userDb.addHeroToUser(userId, heroId);
  } catch (error) {
    throw new Error('User not found');
  }
}; 