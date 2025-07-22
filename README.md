# Airvik - Hotel Booking System

## Overview
Airvik is a modern hotel booking and management system built with Next.js, Node.js, and PostgreSQL. This full-stack application provides a complete solution for hotel room booking, user management, and payment processing.

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
- JWT for authentication
- bcrypt for password hashing
- UUID for secure IDs

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

### 4. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/airvik
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000" > .env

# Run database migrations
psql -d airvik -f migrations/001_create_users_table.sql

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
NEXT_PUBLIC_APP_NAME=Airvik" > .env.local

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
airvik/
├── backend/                # Node.js Express API
│   ├── api/                # API routes and controllers
│   ├── config/             # Configuration files
│   ├── migrations/         # Database migrations
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   ├── server.ts           # Express server setup
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
│
├── frontend/               # Next.js application
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── services/           # API services
│   ├── styles/             # Global styles
│   └── package.json        # Frontend dependencies
│
├── features/               # Feature documentation
└── docs/                   # Project documentation
```

## Available Scripts

### Backend
- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run migrate`: Run database migrations

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run lint`: Run ESLint

## API Endpoints

### Health Check
- `GET /api/health`: Check if API is running

### Authentication (to be implemented)
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login user
- `GET /api/auth/me`: Get current user

## Database Models

The application uses MongoDB with Mongoose for data modeling. Models are defined in the `backend/models` directory.

### Creating New Models

1. Create a new model file in the `backend/models` directory
2. Define your Mongoose schema and model
3. Export the model for use in your application

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

To ensure all team members have consistent database schemas, we use a migration system. Here's how it works:

### Creating a New Migration

1. Create a new SQL file in the `backend/migrations` directory with a sequential number prefix:
   ```
   002_create_rooms_table.sql
   003_create_bookings_table.sql
   ```

2. Write your SQL statements in the file:
   ```sql
   -- Create rooms table
   CREATE TABLE IF NOT EXISTS rooms (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(100) NOT NULL,
     description TEXT,
     price_per_night DECIMAL(10,2) NOT NULL,
     -- other fields
   );
   ```

### Running Migrations

After pulling the latest code with new migrations:

```bash
cd backend
npm run migrate
```

This will:
1. Create a `migrations` table in your database if it doesn't exist
2. Track which migrations have already been applied
3. Only run new migrations that haven't been applied yet

### Sharing Test Data

For sharing test data across the team:

1. **Seed Files**: Create seed files in `backend/seeds/` directory
2. **Data Exports**: Use `pg_dump` to export specific data:
   ```bash
   pg_dump -t table_name -a -f seed_data.sql airvik
   ```
3. **Data Imports**: Import shared data:
   ```bash
   psql -d airvik -f seed_data.sql
   ```

## Features
- User Registration & Authentication
- Room Management
- Booking System
- Payment Processing
- Admin Dashboard

## Team
- Project Manager: Arman Mishra
- Backend Developers: [Team Members]
- Frontend Developers: [Team Members]
