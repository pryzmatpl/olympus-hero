import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Simple test function for bcrypt
const testBcrypt = async () => {
  console.log('Testing bcrypt functionality...');

  try {
    // Sample password
    const password = 'test-password123';
    
    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('Hashed password:', hashedPassword);
    
    // Verify the password works with the hash
    console.log('Verifying password...');
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification result:', isMatch);
    
    // Verify an incorrect password fails
    console.log('Testing incorrect password...');
    const wrongMatch = await bcrypt.compare('wrong-password', hashedPassword);
    console.log('Incorrect password verification result:', wrongMatch);
    
    console.log('Bcrypt test completed successfully!');
  } catch (error) {
    console.error('Error testing bcrypt:', error);
  }
  
  process.exit(0);
};

// Run the test
testBcrypt(); 