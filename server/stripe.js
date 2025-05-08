import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { initializeDB, heroDb } from './db.js';
import { getOrCreateStoryBook, unlockChapters } from './storybook.js';

// Load environment variables
dotenv.config();

/**
 * Process a payment and create an NFT
 * @param {string} heroId - The ID of the hero
 * @param {object} paymentIntent - Payment details from Stripe
 * @returns {object} The created NFT
 */
export const processPaymentAndCreateNFT = async (heroId, paymentIntent) => {
  if (!heroId) {
    console.error('Missing hero ID for NFT creation');
    throw new Error('Hero ID is required');
  }

  console.log(`Creating NFT for hero ${heroId}`);
  
  const tokenId = uuidv4();
  
  // Check for chapter unlock in metadata
  const shouldUnlockChapters = 
    (paymentIntent.unlockChapters === true) || 
    (paymentIntent.metadata && paymentIntent.metadata.unlockChapters === 'true') || 
    (paymentIntent.metadata && paymentIntent.metadata.paymentType === 'chapter_unlock');
  
  // Get payment type from metadata
  const paymentType = paymentIntent.metadata && paymentIntent.metadata.paymentType 
    ? paymentIntent.metadata.paymentType 
    : 'premium_upgrade';
  
  console.log(`Payment type: ${paymentType}, Unlock chapters: ${shouldUnlockChapters}`);
  
  // Create the NFT object
  const nft = {
    id: tokenId,
    heroId,
    createdAt: new Date(),
    metadata: {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'confirmed',
      paymentType: paymentType
    },
    tokenURI: `/nft/${tokenId}`,
    ownerAddress: paymentIntent.walletAddress || '0x0000000000000000000000000000000000000000'
  };
  
  try {
    // Store the NFT in the database
    const db = await initializeDB();
    await db.collection('nfts').insertOne(nft);
    
    // Update hero with NFT ID and payment status
    await heroDb.updateHero(heroId, {
      nftId: tokenId,
      paymentStatus: 'paid'
    });
    
    // Create or update storybook as premium
    const hero = await heroDb.findHeroById(heroId);
    const storyBook = await getOrCreateStoryBook(heroId, true, hero.backstory.substring(0, 100));
    
    // Unlock chapters if specified in the payment intent
    if (shouldUnlockChapters) {
      console.log(`Unlocking chapters for storybook: ${storyBook.id}`);
      await unlockChapters(storyBook.id, 3);
    }
    
    console.log(`NFT created successfully: ${tokenId}`);
    return nft;
  } catch (error) {
    console.error('Error creating NFT:', error);
    throw error;
  }
};

/**
 * Get an NFT by ID
 * @param {string} nftId - The NFT ID
 * @returns {object|null} The NFT or null if not found
 */
export const getNFTById = async (nftId) => {
  const db = await initializeDB();
  return db.collection('nfts').findOne({ id: nftId });
};

/**
 * Get NFTs by hero ID
 * @param {string} heroId - The hero ID
 * @returns {Array} Array of NFTs associated with the hero
 */
export const getNFTsByHeroId = async (heroId) => {
  const db = await initializeDB();
  return db.collection('nfts').find({ heroId }).toArray();
};

/**
 * Get NFTs by owner address
 * @param {string} ownerAddress - The owner's wallet address
 * @returns {Array} Array of NFTs owned by the address
 */
export const getNFTsByOwner = async (ownerAddress) => {
  const db = await initializeDB();
  return db.collection('nfts').find({ ownerAddress }).toArray();
};

// Export the NFTs Map for use in other modules
export const getNFTsMap = () => nfts; 