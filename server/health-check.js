import dotenv from 'dotenv';
import { initializeDB } from './db.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Performs a health check on various server components
 */
const healthCheck = async () => {
  console.log('💫 Starting Olympus Hero Health Check...');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  const requiredVars = ['JWT_SECRET', 'MONGO_URI'];
  const optionalVars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
  
  let missingRequired = false;
  
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Required: ${envVar} is missing`);
      missingRequired = true;
    } else {
      console.log(`✅ Required: ${envVar} is set`);
    }
  }
  
  for (const envVar of optionalVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ Optional: ${envVar} is missing`);
    } else {
      console.log(`✅ Optional: ${envVar} is set`);
    }
  }
  
  if (missingRequired) {
    console.error('❌ Missing required environment variables! See above for details.');
  }
  
  // Check MongoDB connection
  console.log('\n🗄️ Database Connection:');
  try {
    const db = await initializeDB();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test running a simple query
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database has ${collections.length} collections`);
    
    // Check users collection
    const userCount = await db.collection('users').countDocuments();
    console.log(`✅ Users collection contains ${userCount} documents`);
    
    // Test bcrypt
    console.log('\n🔐 Testing bcrypt functionality:');
    const testPassword = 'test-password';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('✅ Password hashing successful');
    
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    if (isMatch) {
      console.log('✅ Password verification successful');
    } else {
      console.error('❌ Password verification failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  
  // Check storage directories
  console.log('\n📁 Storage Directories:');
  const storagePath = path.join(process.cwd(), 'storage');
  
  try {
    if (fs.existsSync(storagePath)) {
      console.log(`✅ Storage directory exists at: ${storagePath}`);
      
      // Check permissions
      try {
        const testFile = path.join(storagePath, '.healthcheck-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✅ Storage directory is writable');
      } catch (error) {
        console.error('❌ Storage directory is not writable:', error);
      }
      
      // Check subdirectories
      const requiredDirs = ['heroes', 'avatars', 'downloads'];
      for (const dir of requiredDirs) {
        const dirPath = path.join(storagePath, dir);
        if (fs.existsSync(dirPath)) {
          console.log(`✅ Required directory exists: ${dir}`);
        } else {
          console.error(`❌ Required directory missing: ${dir}`);
        }
      }
    } else {
      console.error(`❌ Storage directory does not exist at: ${storagePath}`);
    }
  } catch (error) {
    console.error('❌ Error checking storage directories:', error);
  }
  
  console.log('\n🎭 Health check complete!');
  process.exit(0);
};

// Run the health check
healthCheck(); 