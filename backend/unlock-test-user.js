const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/airvik', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema (simplified for test)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, {
  timestamps: true,
  collection: 'users'
});

const User = mongoose.model('User', userSchema);

async function unlockTestUser() {
  try {
    // Reset failed login attempts and unlock account for test user
    const result = await User.updateOne(
      { email: 'test@example.com' },
      { 
        $unset: { accountLockedUntil: 1 },
        $set: { failedLoginAttempts: 0 }
      }
    );

    console.log('Test user update result:', result);
    
    // Check current status
    const testUser = await User.findOne({ email: 'test@example.com' });
    console.log('Test user current status:');
    console.log('- failedLoginAttempts:', testUser?.failedLoginAttempts);
    console.log('- accountLockedUntil:', testUser?.accountLockedUntil);
    console.log('- isActive:', testUser?.isActive);

    if (result.matchedCount > 0) {
      console.log('✅ Test user account unlocked successfully!');
      console.log('Email: test@example.com');
      console.log('Password: password123');
    } else {
      console.log('❌ Test user not found');
    }
    
    // Also unlock admin user
    const adminResult = await User.updateOne(
      { email: 'admin@example.com' },
      { 
        $unset: { accountLockedUntil: 1 },
        $set: { failedLoginAttempts: 0 }
      }
    );

    if (adminResult.matchedCount > 0) {
      console.log('✅ Admin user account unlocked successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
    }
    
  } catch (error) {
    console.error('❌ Error unlocking test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

unlockTestUser();
