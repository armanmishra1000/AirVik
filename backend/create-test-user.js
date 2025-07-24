const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'user',
      emailVerified: true,
      isActive: true,
      status: 'active'
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    // Create admin user
    const adminUser = new User({
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567891',
      role: 'admin',
      emailVerified: true,
      isActive: true,
      status: 'active'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️ Test users already exist');
    } else {
      console.error('❌ Error creating test users:', error);
    }
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
