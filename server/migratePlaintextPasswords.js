import { initializeDB, userDb } from './db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Migrates any plaintext passwords in the database to bcrypt hashed passwords
 */
const migratePasswords = async () => {
  console.log('Starting password migration...');
  
  try {
    // Initialize the database connection
    await initializeDB();
    
    // Get all users
    const users = await userDb.getAllUsers();
    console.log(`Found ${users.length} users to check for migration`);
    
    let migratedCount = 0;
    
    // Process each user
    for (const user of users) {
      // Check if the password is plaintext (not already hashed)
      // Bcrypt hashes start with $2b$ or $2a$
      if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        console.log(`Migrating password for user: ${user.email}`);
        
        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        // Update the user's password in the database
        await userDb.updateUser(user.id, { password: hashedPassword });
        
        migratedCount++;
      }
    }
    
    console.log(`Migration complete! ${migratedCount} passwords were migrated to bcrypt hashes.`);
  } catch (error) {
    console.error('Error during password migration:', error);
    process.exit(1); // Exit with error code
  }
  
  // Always exit the process when done
  process.exit(0);
};

// Run the migration
migratePasswords(); 