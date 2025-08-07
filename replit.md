# Overview

This is a capsule hostel management system called "Pelangi Capsule Hostel" built as a full-stack web application. The system manages guest check-ins, check-outs, and provides a dashboard for monitoring occupancy across 24 capsules (A-01 to A-08, B-01 to B-08, C-01 to C-08). The application features a modern React frontend with TypeScript and a Node.js/Express backend, designed for real-time hostel operations management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture:

- **UI Framework**: Utilizes shadcn/ui components built on Radix UI primitives for consistent, accessible interface elements
- **Styling**: TailwindCSS with custom CSS variables for theming, including hostel-specific color scheme
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The server-side uses Node.js with Express in a RESTful API pattern:

- **Framework**: Express.js with TypeScript for type safety
- **API Design**: RESTful endpoints under `/api` prefix for guest and occupancy management
- **Database Layer**: Currently uses in-memory storage (MemStorage) with interface abstraction for easy database migration
- **Development**: Hot-reload development server with comprehensive request logging
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions
The application uses a flexible storage abstraction pattern:

- **Current Implementation**: In-memory storage for development/demonstration
- **Database Schema**: Designed for PostgreSQL using Drizzle ORM with defined tables for users and guests
- **Migration Ready**: Drizzle configuration is set up for PostgreSQL migration when database is provisioned
- **Type Safety**: Full TypeScript integration with Zod schemas for runtime validation

## Authentication and Authorization
Google OAuth authentication system implemented with traditional email/password fallback:

- **Google OAuth Integration**: Full Google Sign-In implementation using Google Identity Services
- **User Schema**: Database schema includes users table with Google OAuth fields (googleId, email, firstName, lastName, profileImage)
- **Dual Authentication**: Supports both Google OAuth and traditional email/password authentication
- **Session Management**: Token-based session system with 24-hour expiration
- **Frontend Components**: Login form with Google Sign-In button and traditional login fields
- **Backend Routes**: Complete OAuth token verification and user management endpoints

# External Dependencies

## Database Services
- **PostgreSQL**: Configured with Drizzle ORM for production database (via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL provider integration (@neondatabase/serverless)

## UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives for building the interface
- **shadcn/ui**: Pre-built component library based on Radix UI with consistent design system
- **Lucide React**: Icon library providing consistent iconography throughout the application

## Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **ESBuild**: JavaScript bundler for production builds
- **TypeScript**: Static type checking across the entire application
- **TailwindCSS**: Utility-first CSS framework with PostCSS processing

## Data Management and Validation
- **Drizzle ORM**: Type-safe SQL toolkit for database operations
- **Zod**: Schema validation library for runtime type checking and form validation
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates

## External Authentication Services
- **Google OAuth 2.0**: OAuth authentication provider for secure user sign-in
- **Google Identity Services**: Frontend integration for Google Sign-In button
- **Google Auth Library**: Backend token verification and user profile retrieval

## Development Experience
- **Replit Integration**: Custom plugins for development environment integration
- **Hot Reload**: Development server with automatic reloading
- **Error Overlay**: Runtime error modal for better development experience