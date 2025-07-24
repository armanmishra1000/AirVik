// Direct MongoDB unlock script
db = db.getSiblingDB('airvik');

// Unlock test user
const testResult = db.users.updateOne(
  { email: 'test@example.com' },
  { 
    $unset: { accountLockedUntil: 1 },
    $set: { failedLoginAttempts: 0 }
  }
);

print('Test user unlock result:', JSON.stringify(testResult));

// Unlock admin user
const adminResult = db.users.updateOne(
  { email: 'admin@example.com' },
  { 
    $unset: { accountLockedUntil: 1 },
    $set: { failedLoginAttempts: 0 }
  }
);

print('Admin user unlock result:', JSON.stringify(adminResult));

// Verify users are unlocked
const testUser = db.users.findOne({ email: 'test@example.com' }, { failedLoginAttempts: 1, accountLockedUntil: 1 });
const adminUser = db.users.findOne({ email: 'admin@example.com' }, { failedLoginAttempts: 1, accountLockedUntil: 1 });

print('Test user status:', JSON.stringify(testUser));
print('Admin user status:', JSON.stringify(adminUser));
