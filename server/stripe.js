import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from './db.js';

// Load environment variables
dotenv.config();

/**
 * Process a payment and create an NFT
 * @param {string} heroId - The ID of the hero
 * @param {object} paymentIntent - Payment details from Stripe
 * @returns {object} The created NFT
 */
export const processPaymentAndCreateNFT = async (heroId, paymentIntent) => {
  const tokenId = uuidv4();
  
  // Create the NFT object
  const nft = {
    id: tokenId,
    heroId,
    createdAt: new Date(),
    metadata: {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'confirmed'
    },
    tokenURI: `/nft/${tokenId}`,
    ownerAddress: paymentIntent.walletAddress || '0x0000000000000000000000000000000000000000'
  };
  
  // Store the NFT in the database
  const db = await connectDB();
  await db.collection('nfts').insertOne(nft);
  
  return nft;
};

/**
 * Get an NFT by ID
 * @param {string} nftId - The NFT ID
 * @returns {object|null} The NFT or null if not found
 */
export const getNFTById = async (nftId) => {
  const db = await connectDB();
  return db.collection('nfts').findOne({ id: nftId });
};

/**
 * Get NFTs by hero ID
 * @param {string} heroId - The hero ID
 * @returns {Array} Array of NFTs associated with the hero
 */
export const getNFTsByHeroId = async (heroId) => {
  const db = await connectDB();
  return db.collection('nfts').find({ heroId }).toArray();
};

/**
 * Get NFTs by owner address
 * @param {string} ownerAddress - The owner's wallet address
 * @returns {Array} Array of NFTs owned by the address
 */
export const getNFTsByOwner = async (ownerAddress) => {
  const db = await connectDB();
  return db.collection('nfts').find({ ownerAddress }).toArray();
};

// Export the NFTs Map for use in other modules
export const getNFTsMap = () => nfts; 