# PelangiManager Setup Guide

Your capsule hostel management system is now ready for development!

## What's Been Done

✅ **Dependencies Installed** - All npm packages installed successfully  
✅ **Windows Compatibility** - Fixed Windows-specific environment variable issues  
✅ **Development Configuration** - Set up in-memory storage for local development  
✅ **ES Module Support** - Fixed import.meta.dirname issues for Node.js compatibility  
✅ **Cross-Platform Scripts** - Added cross-env for consistent environment variables

## Running the Application

```bash
cd "C:\Users\Jyue\Desktop\PelangiManager"
npm run dev
```

The server will start on **http://localhost:5000** with:
- Backend API server running on Express
- Frontend React app with hot reload via Vite
- In-memory database with sample data preloaded

## Default Login Credentials

- **Email:** admin@pelangi.com
- **Password:** admin123

## Sample Data Included

The app comes with:
- 14 pre-loaded guest records
- 22 capsules (C1-C6, C11-C26) 
- Admin user account
- Default configuration settings

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema (for production with DATABASE_URL)

## Environment Configuration

Created `.env.example` with optional configurations:
- Database URL (uses in-memory storage if not set)
- Google OAuth credentials
- SendGrid email settings

For production, copy `.env.example` to `.env` and configure as needed.

## Technology Stack

- **Frontend:** React 18 + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** In-memory for dev, PostgreSQL for production (via Drizzle ORM)
- **Build Tools:** Vite + ESBuild

Your hostel management system is ready for development! 🏨