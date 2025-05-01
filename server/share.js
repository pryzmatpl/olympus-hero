import { v4 as uuidv4 } from 'uuid';

// In-memory storage for shared links (would be a database in production)
const sharedLinks = new Map();

/**
 * Create a shared link for a hero
 * @param {string} heroId - The hero ID to share
 * @param {string} userId - The user ID who is sharing
 * @param {object} options - Optional configuration for the shared link
 * @returns {object} The shared link details
 */
export const createSharedLink = (heroId, userId, options = {}) => {
  // Generate a unique share ID
  const shareId = uuidv4();
  
  // Create the shared link object
  const sharedLink = {
    id: shareId,
    heroId,
    userId,
    createdAt: new Date(),
    expiresAt: options.expiresAt || null, // null means never expires
    accessCount: 0,
    maxAccesses: options.maxAccesses || null, // null means unlimited
    lastAccessedAt: null,
    isActive: true
  };
  
  // Store the shared link
  sharedLinks.set(shareId, sharedLink);
  
  return {
    shareId,
    shareUrl: `/share/${shareId}`,
    ...sharedLink
  };
};

/**
 * Get a shared link by ID
 * @param {string} shareId - The ID of the shared link
 * @returns {object|null} The shared link or null if not found
 */
export const getSharedLink = (shareId) => {
  if (!sharedLinks.has(shareId)) {
    return null;
  }
  
  return sharedLinks.get(shareId);
};

/**
 * Access a shared hero
 * @param {string} shareId - The ID of the shared link
 * @returns {object} The result of the access attempt
 */
export const accessSharedHero = (shareId) => {
  // Get the shared link
  const sharedLink = getSharedLink(shareId);
  
  // Check if the link exists
  if (!sharedLink) {
    return { success: false, error: 'Shared link not found' };
  }
  
  // Check if the link is active
  if (!sharedLink.isActive) {
    return { success: false, error: 'Shared link is inactive' };
  }
  
  // Check if the link has expired
  if (sharedLink.expiresAt && new Date() > new Date(sharedLink.expiresAt)) {
    sharedLink.isActive = false;
    sharedLinks.set(shareId, sharedLink);
    return { success: false, error: 'Shared link has expired' };
  }
  
  // Check if max accesses has been reached
  if (sharedLink.maxAccesses && sharedLink.accessCount >= sharedLink.maxAccesses) {
    return { success: false, error: 'Maximum access count reached' };
  }
  
  // Update access information
  sharedLink.accessCount += 1;
  sharedLink.lastAccessedAt = new Date();
  sharedLinks.set(shareId, sharedLink);
  
  return { 
    success: true, 
    heroId: sharedLink.heroId,
    userId: sharedLink.userId,
    accessCount: sharedLink.accessCount
  };
};

/**
 * Get all shared links created by a user
 * @param {string} userId - The user ID
 * @returns {Array} Array of shared links
 */
export const getSharedLinksByUser = (userId) => {
  return [...sharedLinks.values()].filter(link => link.userId === userId);
};

/**
 * Deactivate a shared link
 * @param {string} shareId - The ID of the shared link
 * @param {string} userId - The user ID (for authorization)
 * @returns {boolean} Success status
 */
export const deactivateSharedLink = (shareId, userId) => {
  const sharedLink = getSharedLink(shareId);
  
  if (!sharedLink) {
    return false;
  }
  
  // Authorization check - only the creator can deactivate
  if (sharedLink.userId !== userId) {
    return false;
  }
  
  // Deactivate the link
  sharedLink.isActive = false;
  sharedLinks.set(shareId, sharedLink);
  
  return true;
};

// Export the shared links Map for use in other modules
export const getSharedLinksMap = () => sharedLinks; 