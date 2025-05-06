# Architecture Overview

## Overview

This application is a soundboard web application that allows users to play various sound effects organized by categories. The system follows a modern full-stack architecture with a React frontend and Node.js/Express backend. It features user authentication, sound categorization, and additional game-like features.

Key features include:
- User authentication with role-based access control
- Sound management (upload, categorization, playback)
- Chat functionality
- Mini-games
- Admin dashboard for system management

## System Architecture

The application follows a client-server architecture with the following components:

1. **Frontend**: React-based single-page application using modern React practices (hooks, context)
2. **Backend**: Express.js REST API server
3. **Database**: PostgreSQL database accessed through Drizzle ORM
4. **Static Assets**: Served through the Express server

### Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI components
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite, ESBuild
- **Deployment**: Configured for Replit deployment

## Key Components

### Frontend Components

1. **Authentication Module**
   - Handles user login, session management
   - Implements role-based access control

2. **Sound Player**
   - Main soundboard interface for browsing and playing sounds
   - Organizes sounds by categories

3. **Chat System**
   - Real-time chat interface between users

4. **Games Module**
   - Includes simple browser games (e.g., Cookie Clicker)

5. **Admin Panel**
   - Management interface for administrators
   - Controls for user management, sound management, and system settings

### Backend Components

1. **Authentication Service**
   - User authentication and session management
   - Password hashing using scrypt
   - Role-based access control

2. **API Routes**
   - RESTful endpoints for all application features
   - Structured route handlers with appropriate middleware

3. **Storage Service**
   - Manages data persistence
   - Handles file uploads and storage
   - Interfaces with the database

4. **Session Management**
   - Maintains user sessions using Express sessions
   - Session storage in PostgreSQL

## Data Model

The application uses several key data entities:

1. **Users**
   - Contains user credentials and role information
   - Supports different access levels (basic, limited, full)
   - Supports different roles (user, admin)

2. **Sounds**
   - Stores metadata about sound files
   - References categories
   - Includes access level control

3. **Categories**
   - Organizes sounds into logical groups
   - Contains display and slug information

4. **Other Data**
   - Chat messages
   - Game data
   - Broadcast messages

## Authentication and Authorization

The application implements a session-based authentication system:

1. **Authentication**:
   - Password-based authentication using username/password
   - Password hashing with scrypt and salting for security
   - Session management using Express sessions

2. **Authorization**:
   - Role-based access control (admin vs regular users)
   - Access level restrictions for sounds and features
   - Protected API routes require authentication

## Data Flow

1. **Sound Playback Flow**:
   - User selects a category in the UI
   - Frontend fetches sounds for that category
   - User clicks a sound button
   - Client loads and plays the sound file

2. **Sound Management Flow**:
   - Admin uploads a sound file
   - Backend processes and stores the file
   - Sound metadata is saved to the database
   - Sound becomes available for playback

3. **Authentication Flow**:
   - User submits login credentials
   - Server validates credentials
   - On success, a session is created
   - Session cookie is returned to the client
   - Client includes cookie in subsequent requests

## External Dependencies

### Frontend Dependencies
- React and React ecosystem (React Query, React Router)
- Shadcn UI (based on Radix UI) for UI components
- TailwindCSS for styling
- Howler.js (implied) for sound playback

### Backend Dependencies
- Express.js for the web server
- Drizzle ORM for database access
- Multer for file uploads
- Passport.js for authentication

## Deployment Strategy

The application is configured for deployment on Replit:

1. **Build Process**:
   - Frontend build using Vite
   - Backend bundling using ESBuild
   - Combined deployment package

2. **Environment Configuration**:
   - Environment variables for database connection, etc.
   - Production vs development mode settings

3. **Database**:
   - Uses Neon Serverless PostgreSQL

4. **Replit-specific**:
   - Configured to use Replit's persistent storage
   - Includes Replit-specific development tools and plugins

## Development Workflow

1. **Local Development**:
   - Run with `npm run dev` for development mode
   - Vite handles hot module replacement for the frontend
   - Backend restarts on file changes

2. **Database Management**:
   - Drizzle Kit for schema management
   - Migration scripts for schema changes

3. **Production Build**:
   - `npm run build` creates optimized production build
   - `npm run start` runs the production server