import { v4 as uuidv4 } from 'uuid';
import { shareDb } from './db.js';

/**
 * Create a shared link for a hero
 * @param {string} heroId - The hero ID to share
 * @param {string} userId - The user ID who is sharing
 * @param {object} options - Optional configuration for the shared link
 * @returns {object} The shared link details
 */
export const createSharedLink = async (heroId, userId, options = {}) => {
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
  
  // Store the shared link in the database
  await shareDb.createSharedLink(sharedLink);
  
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
export const getSharedLink = async (shareId) => {
  return await shareDb.findSharedLinkById(shareId);
};

/**
 * Access a shared hero
 * @param {string} shareId - The ID of the shared link
 * @returns {object} The result of the access attempt
 */
export const accessSharedHero = async (shareId) => {
  // Get the shared link
  const sharedLink = await getSharedLink(shareId);
  
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
    // Update the link to inactive
    await shareDb.updateSharedLink(shareId, { isActive: false });
    return { success: false, error: 'Shared link has expired' };
  }
  
  // Check if max accesses has been reached
  if (sharedLink.maxAccesses && sharedLink.accessCount >= sharedLink.maxAccesses) {
    return { success: false, error: 'Maximum access count reached' };
  }
  
  // Update access information
  await shareDb.updateSharedLink(shareId, {
    accessCount: sharedLink.accessCount + 1,
    lastAccessedAt: new Date()
  });
  
  return { 
    success: true, 
    heroId: sharedLink.heroId,
    userId: sharedLink.userId,
    accessCount: sharedLink.accessCount + 1
  };
};

/**
 * Get all shared links created by a user
 * @param {string} userId - The user ID
 * @returns {Array} Array of shared links
 */
export const getSharedLinksByUser = async (userId) => {
  return await shareDb.getSharedLinksByUserId(userId);
};

/**
 * Deactivate a shared link
 * @param {string} shareId - The ID of the shared link
 * @param {string} userId - The user ID (for authorization)
 * @returns {boolean} Success status
 */
export const deactivateSharedLink = async (shareId, userId) => {
  return await shareDb.deactivateSharedLink(shareId, userId);
}; 