# Airvik - Hotel Booking System

## Overview
Modern hotel booking and management system built with Next.js, Node.js, and PostgreSQL.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd airvik
```

### Setup Backend
```bash
cd backend
npm install
npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Create Database
```bash
createdb airvik
cd backend
psql -d airvik -f migrations/001_create_users_table.sql
```

## Development
- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:3000
- API health check: http://localhost:5000/api/health

## Project Structure
```
airvik/
├── backend/         # Node.js Express API
├── frontend/        # Next.js application
├── features/        # Feature documentation
└── docs/           # Project documentation
```

## Features
- User Registration & Authentication
- Room Management
- Booking System
- Payment Processing
- Admin Dashboard

## Team
- Project Manager: [Name]
- Backend Developers: [Names]
- Frontend Developers: [Names]
