import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string from environment variables or default for local development
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/olympus-hero';

// Connection variable
let client;
let db;

/**
 * Connect to the MongoDB database
 */
export const connectDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      db = client.db();
      console.log('Connected to MongoDB');
      
      // Create indexes for common queries
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ id: 1 }, { unique: true });
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Close the MongoDB connection
 */
export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
};

/**
 * User operations
 */
export const userDb = {
  // Create a new user
  async createUser(user) {
    const db = await connectDB();

    await db.collection('users').insertOne(user);
    return user;
  },

  // Find a user by email
  async findUserByEmail(email) {
    const db = await connectDB();
    return db.collection('users').findOne({ email });
  },

  // Find a user by ID
  async findUserById(userId) {
    const db = await connectDB();
    return db.collection('users').findOne({ id: userId });
  },

  // Update a user
  async updateUser(userId, update) {
    const db = await connectDB();
    await db.collection('users').updateOne(
      { id: userId },
      { $set: update }
    );
    return this.findUserById(userId);
  },

  // Add a hero to a user
  async addHeroToUser(userId, heroId) {
    const db = await connectDB();
    await db.collection('users').updateOne(
      { id: userId },
      { $push: { heroes: heroId } }
    );
    const user = await this.findUserById(userId);
    return user.heroes;
  },

  // Get all users (for admin purposes)
  async getAllUsers() {
    const db = await connectDB();
    return db.collection('users').find({}).toArray();
  }
};

/**
 * Hero operations
 */
export const heroDb = {
  // Create a new hero
  async createHero(hero) {
    const db = await connectDB();
    await db.collection('heroes').insertOne(hero);
    return hero;
  },

  // Find a hero by ID
  async findHeroById(heroId) {
    const db = await connectDB();
    return db.collection('heroes').findOne({ id: heroId });
  },

  // Update a hero
  async updateHero(heroId, update) {
    const db = await connectDB();
    await db.collection('heroes').updateOne(
      { id: heroId },
      { $set: update }
    );
    return this.findHeroById(heroId);
  },

  // Update a hero
  async addStoryQuota(heroId, update) {
    const db = await connectDB();
    let story = db.collection('storybooks').findOne({ heroid: heroId });
    const storyId = story['id'];
    const totalCount = story['chatpers_total_count'];

    story['chatpers_total_count'] = totalCount + 10;

    await db.collection('storybooks').updateOne(
        { heroid: heroId },
        { id: storyId },
        { $set: story }
    );
    return this.findHeroById(heroId);
  },


  // Upgrade a hero to premium
  async upgradeHero(heroId, update) {
    const db = await connectDB();
    let upHero = db.collection('heroes').findOne({ id: heroId });
    upHero['paymentStatus'] = 'paid';
    await db.collection('heroes').updateOne(
        { id: heroId },
        { $set: upHero }
    );
    return this.findHeroById(heroId);
  },

  // Get all heroes for a user
  async getHeroesByUserId(userId) {
    const db = await connectDB();
    return db.collection('heroes').find({ userid: userId }).toArray();
  }
};

/**
 * StoryBook operations
 */
export const storyBookDb = {
  // Create a new storybook
  async createStoryBook(storyBook) {
    const db = await connectDB();
    await db.collection('storybooks').insertOne(storyBook);
    return storyBook;
  },

  // Find a storybook by ID
  async findStoryBookById(storyBookId) {
    const db = await connectDB();
    return db.collection('storybooks').findOne({ id: storyBookId });
  },

  // Find a storybook by hero ID
  async findStoryBookByHeroId(heroId) {
    const db = await connectDB();
    return db.collection('storybooks').findOne({ heroId });
  },

  // Update a storybook
  async updateStoryBook(storyBookId, update) {
    const db = await connectDB();
    await db.collection('storybooks').updateOne(
      { id: storyBookId },
      { $set: update }
    );
    return this.findStoryBookById(storyBookId);
  },

  // Increment chapters_unlocked_count
  async incrementUnlockedChapters(storyBookId, increment = 1) {
    const db = await connectDB();
    await db.collection('storybooks').updateOne(
      { id: storyBookId },
      { $inc: { chapters_unlocked_count: increment } }
    );
    return this.findStoryBookById(storyBookId);
  }
};

/**
 * Chapter operations
 */
export const chapterDb = {
  // Create a new chapter
  async createChapter(chapter) {
    const db = await connectDB();
    await db.collection('chapters').insertOne(chapter);
    return chapter;
  },

  // Find a chapter by ID
  async findChapterById(chapterId) {
    const db = await connectDB();
    return db.collection('chapters').findOne({ id: chapterId });
  },

  // Get all chapters for a storybook
  async getChaptersByStoryBookId(storyBookId) {
    const db = await connectDB();
    return db.collection('chapters')
      .find({ storyBookId })
      .sort({ chapter_number: 1 })
      .toArray();
  },

  // Update a chapter
  async updateChapter(chapterId, update) {
    const db = await connectDB();
    await db.collection('chapters').updateOne(
      { id: chapterId },
      { $set: update }
    );
    return this.findChapterById(chapterId);
  },

  // Mark chapters as unlocked
  async unlockChapters(storyBookId, chapterNumbers) {
    const db = await connectDB();
    await db.collection('chapters').updateMany(
      { 
        storyBookId, 
        chapter_number: { $in: chapterNumbers } 
      },
      { $set: { is_unlocked: true } }
    );
    return this.getChaptersByStoryBookId(storyBookId);
  }
};

/**
 * Shared link operations
 */
export const shareDb = {
  // Create a shared link
  async createSharedLink(link) {
    const db = await connectDB();
    await db.collection('sharedLinks').insertOne(link);
    return link;
  },

  // Find a shared link by ID
  async findSharedLinkById(linkId) {
    const db = await connectDB();
    return db.collection('sharedLinks').findOne({ id: linkId });
  },

  // Update a shared link
  async updateSharedLink(linkId, update) {
    const db = await connectDB();
    await db.collection('sharedLinks').updateOne(
      { id: linkId },
      { $set: update }
    );
    return this.findSharedLinkById(linkId);
  },

  // Get all shared links for a user
  async getSharedLinksByUserId(userId) {
    const db = await connectDB();
    return db.collection('sharedLinks').find({ userId }).toArray();
  },

  // Deactivate a shared link
  async deactivateSharedLink(linkId, userId) {
    const db = await connectDB();
    const result = await db.collection('sharedLinks').updateOne(
      { id: linkId, userId },
      { $set: { active: false } }
    );
    return result.modifiedCount > 0;
  }
};

/**
 * Initialize the database connection
 */
export const initializeDB = async () => {
  try {
    const db = await connectDB();
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}; 