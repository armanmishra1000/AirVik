# AirVik - Hotel Booking System

## Overview
AirVik is a modern hotel booking and management system built with Next.js, Node.js, and MongoDB. This full-stack application provides a complete solution for hotel room booking, user management, and payment processing.

## Tech Stack

### Frontend
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS for styling
- React Hook Form for form handling
- Tanstack React Query for data fetching
- Zod for validation
- React Hot Toast for notifications
- Axios for API requests

### Backend
- Node.js with Express
- TypeScript
- MongoDB database with Mongoose ODM
- JWT for authentication with refresh tokens
- bcrypt for password hashing
- Email verification via SendGrid
- Stripe for payment processing

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18+)
- npm (v8+) or yarn
- MongoDB (v6+)
- Git

## Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/armanmishra1000/AirVik.git
cd AirVik/airvik
```

### 2. MongoDB Setup
Install MongoDB if you haven't already:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from [MongoDB official website](https://www.mongodb.com/try/download/community)

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Verify MongoDB Connection
```bash
# Connect to MongoDB and verify it's running
mongosh

# In the MongoDB shell, you can exit with
exit
```

Alternatively, you can use MongoDB Atlas as a cloud-hosted solution.

### 4. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
cat > .env << EOL
# Server Configuration
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/airvik

# Email Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@airvik.com

# Hotel Information
HOTEL_NAME=AirVik Hotel
SUPPORT_EMAIL=support@airvik.com

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
EOL

# Start development server
npm run dev
```

### 5. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file (if not exists)
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=AirVik" > .env.local

# Start development server
npm run dev
```

## Running the Application

### Backend
```bash
cd backend
npm run dev
```
The backend server will run on http://localhost:5000

### Frontend
```bash
cd frontend
npm run dev
```
The frontend application will run on http://localhost:3000

## Project Structure
```
AirVik/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── utils/          # Helpers
│   │   └── config/         # Configuration
│   ├── server.ts           # Express server setup
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
│
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── contexts/      # React contexts
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Frontend helpers
│   ├── next.config.js
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
│
├── shared/                 # Shared code between frontend and backend
│   └── types/              # Shared TypeScript types
│
├── docs/                   # Project documentation
│   └── features/           # Feature documentation
```

## Available Scripts

### Backend
- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

## API Endpoints

### Health Check
- `GET /api/health`: Check if API is running

### Authentication
- `POST /api/v1/auth/register`: Register new user
- `POST /api/v1/auth/verify-email`: Verify user email with token
- `POST /api/v1/auth/resend-verification`: Resend verification email
- `POST /api/v1/auth/login`: Login user
- `POST /api/v1/auth/refresh-token`: Refresh access token
- `POST /api/v1/auth/logout`: Logout user
- `GET /api/v1/auth/me`: Get current user

### User Management
- `GET /api/v1/user/profile`: Get user profile
- `PUT /api/v1/user/profile`: Update user profile

### Room Management
- `GET /api/v1/rooms`: Get all rooms
- `GET /api/v1/rooms/:id`: Get room by ID
- `POST /api/v1/rooms`: Create new room (admin)
- `PUT /api/v1/rooms/:id`: Update room (admin)
- `DELETE /api/v1/rooms/:id`: Delete room (admin)

### Booking Management
- `GET /api/v1/bookings`: Get user bookings
- `GET /api/v1/bookings/:id`: Get booking by ID
- `POST /api/v1/bookings`: Create new booking
- `PUT /api/v1/bookings/:id`: Update booking
- `DELETE /api/v1/bookings/:id`: Cancel booking

## Database Models

The application uses MongoDB with Mongoose for data modeling. Models are defined in the `backend/src/models` directory.

### Creating New Models

1. Create a new model file in the `backend/src/models` directory
2. Define your Mongoose schema and model
3. Export the model for use in your application

Example model structure:

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: string;
  verificationToken?: string;
  verificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['unverified', 'verified', 'suspended'],
      default: 'unverified'
    },
    verificationToken: String,
    verificationExpires: Date
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
```

### Sharing Database Data

For sharing database data between team members, you can use MongoDB's export and import functionality:

```bash
# Export a collection to a JSON file
mongodump --db airvik --collection users --out ./dump

# Share the dump folder with team members

# Import the data
mongorestore ./dump
```

## Contributing
1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## Database Synchronization

To ensure all team members have consistent database schemas, we use Mongoose schemas and models. MongoDB is schema-less by nature, but we enforce schemas through Mongoose.

### Schema Changes

When making schema changes:

1. Update the model file in `backend/src/models`
2. Document the changes in the commit message
3. Notify team members of the schema change

### Database Seeding

For populating the database with initial data:

1. Create seed scripts in `backend/src/seeds` directory
2. Run seed scripts to populate the database with test data

```bash
# Example seed script execution
node dist/seeds/seed-users.js
```

### Sharing Test Data

For sharing test data across the team:

1. **Export Data**: Use MongoDB's export functionality:
   ```bash
   mongoexport --db airvik --collection users --out users.json
   ```

2. **Import Data**: Import shared data:
   ```bash
   mongoimport --db airvik --collection users --file users.json
   ```

3. **Seed Scripts**: Create and share seed scripts that can be run to populate the database with consistent test data

## Features
- User Registration & Authentication with Email Verification
- Room Management and Search
- Booking System with Calendar Integration
- Payment Processing with Stripe
- Admin Dashboard for Hotel Management
- User Profile Management
- Responsive Design for Mobile and Desktop
- Email Notifications for Bookings and Account Activities

## Environment Variables

### Backend (.env)
```
# Server Configuration
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/airvik

# Email Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@airvik.com

# Hotel Information
HOTEL_NAME=AirVik Hotel
SUPPORT_EMAIL=support@airvik.com

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=AirVik
```

## Team
- Project Manager: Nirav Ramani
- Backend Developers: [Team Members]
- Frontend Developers: [Team Members]

## License
This project is licensed under the MIT License - see the LICENSE file for details.
