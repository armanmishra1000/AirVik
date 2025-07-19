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
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing
- UUID for secure IDs

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18+)
- npm (v8+) or yarn
- PostgreSQL (v14+)
- Git

## Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/armanmishra1000/AirVik.git
cd AirVik/airvik
```

### 2. PostgreSQL Setup
Install PostgreSQL if you haven't already:

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database
```bash
# For macOS/Linux
createdb airvik

# For Windows (using psql)
# First access psql
psql -U postgres
# Then in the psql shell
CREATE DATABASE airvik;
\q
```

### 4. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
echo "PORT=5000
DATABASE_URL=postgresql://localhost:5432/airvik
JWT_SECRET=your_jwt_secret_key_here
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

## Database Schema

### Users Table
- `id`: UUID (Primary Key)
- `first_name`: VARCHAR(100)
- `last_name`: VARCHAR(100)
- `email`: VARCHAR(255) (Unique)
- `phone`: VARCHAR(50)
- `password_hash`: VARCHAR(255)
- `country`: VARCHAR(2)
- `email_verified`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

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
