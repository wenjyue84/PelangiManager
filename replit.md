# Overview

This is a capsule hostel management system called "Pelangi Capsule Hostel" built as a full-stack web application. The system manages guest check-ins, check-outs, and provides a dashboard for monitoring occupancy across 24 capsules (A-01 to A-08, B-01 to B-08, C-01 to C-08). The application features a modern React frontend with TypeScript and a Node.js/Express backend, designed for real-time hostel operations management.

## Recent Updates (August 8, 2025)

### Global Error Boundary Implementation
- **Comprehensive Error Handling**: Implemented a global error boundary system to standardize error handling across the React application
- **Global Error Boundary**: Created `GlobalErrorBoundary` component that:
  - Catches JavaScript errors anywhere in the React component tree
  - Provides user-friendly fallback UI with recovery options
  - Logs errors with detailed context for debugging
  - Supports error severity classification (low/medium/high)
  - Includes retry mechanisms with automatic attempt limits
  - Handles different error types (network, chunk loading, validation, etc.)
- **Enhanced Query Client Error Handling**: Updated React Query configuration to:
  - Automatically handle and display API errors with appropriate toast messages
  - Differentiate between error types (401, 400, 500, network errors)
  - Implement smart retry logic based on error type
  - Provide user-friendly error messages for different scenarios
- **Error Utilities**: Created comprehensive error handling utilities including:
  - `AppError` interface for standardized error objects
  - Error parsing and classification functions
  - Async error wrapper utilities
  - Retry mechanisms with exponential backoff
  - Error reporting functionality
- **Server-Side Error Reporting**: Added `/api/errors/report` endpoint for client error reporting
- **Fallback Components**: Created reusable error fallback components for different UI sections
- **Development Tools**: Added error boundary testing utilities and detailed error logging

### Comprehensive Validation Rules Implementation
- **Enhanced Data Validation**: Added robust validation rules across all input fields with proper error messaging
- **Schema-Level Validation**: Comprehensive validation in `shared/schema.ts` including:
  - User validation: Password strength, email format, username constraints, name formatting
  - Guest validation: Name formatting, phone numbers, email, age limits, ID number formats
  - Payment validation: Amount formatting, valid payment methods, collector names
  - Date validation: Proper date ranges for checkout dates with business rule constraints
  - Contact validation: Emergency contacts, phone number international formatting
  - Identity validation: Malaysian IC and international passport number formats
- **Server-Side Security**: Added comprehensive server-side validation middleware including:
  - SQL injection prevention
  - XSS attack prevention 
  - Input sanitization and security validation
  - Rate limiting validation utilities
  - Password strength enforcement
- **Client-Side Validation**: Created real-time validation utilities for better UX:
  - Live validation feedback as users type
  - Input formatters for phone numbers, IC numbers, names
  - Password strength indicators
  - Custom validation hooks for forms
- **Enhanced API Security**: All API endpoints now include:
  - Input validation middleware
  - Security validation checks
  - Proper error handling with detailed validation messages
  - Sanitized data processing

### Pagination Implementation
- Added comprehensive pagination support for all data-heavy endpoints to improve performance with large datasets
- Implemented pagination types (PaginationParams, PaginatedResponse) in shared schema
- Updated storage layer (both MemStorage and DatabaseStorage) to support pagination
- Modified API endpoints to accept page and limit query parameters (defaults: page=1, limit=20)
- Updated all client components to handle paginated responses with backward compatibility
- Affected endpoints:
  - `/api/guests/checked-in` - Paginated guest listings
  - `/api/guests/history` - Paginated guest history
  - `/api/guest-tokens/active` - Paginated active tokens
  - `/api/problems` and `/api/problems/active` - Paginated problem reports
  - `/api/admin/notifications` and `/api/admin/notifications/unread` - Paginated notifications

### Page Visibility API Integration
- Implemented Page Visibility API to optimize performance and reduce unnecessary API calls
- Created custom hooks (`usePageVisibility`, `useVisibilityQuery`) for visibility-aware data fetching
- Configured React Query to pause/resume queries based on tab visibility
- Added automatic refresh intervals for real-time data components:
  - Guest table refreshes every 30 seconds when visible
  - Occupancy data refreshes every 30 seconds when visible
  - Notifications refresh every 30-60 seconds when visible
  - Available capsules refresh every 15 seconds on check-in page
- Added visual indicator showing when live updates are active or paused
- Benefits:
  - Reduced server load when tabs are inactive
  - Better battery life for mobile devices
  - Improved overall application performance
  - Automatic data refresh when users return to the tab

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
- **Data Validation**: Comprehensive client-side validation with real-time feedback, input formatters, and security checks
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The server-side uses Node.js with Express in a RESTful API pattern:

- **Framework**: Express.js with TypeScript for type safety
- **API Design**: RESTful endpoints under `/api` prefix for guest and occupancy management
- **Database Layer**: Currently uses in-memory storage (MemStorage) with interface abstraction for easy database migration
- **Data Validation**: Comprehensive server-side validation including:
  - Zod schema validation middleware
  - Security validation (SQL injection, XSS prevention)
  - Input sanitization and data formatting
  - Business rule validation
  - Rate limiting and abuse prevention
- **Development**: Hot-reload development server with comprehensive request logging
- **Error Handling**: Centralized error handling middleware with detailed validation error responses

## Data Storage Solutions
The application uses a flexible storage abstraction pattern:

- **Current Implementation**: In-memory storage for development/demonstration
- **Database Schema**: Designed for PostgreSQL using Drizzle ORM with defined tables for users and guests
- **Migration Ready**: Drizzle configuration is set up for PostgreSQL migration when database is provisioned
- **Type Safety**: Full TypeScript integration with comprehensive Zod schemas including:
  - Runtime validation with detailed error messages
  - Input sanitization and formatting
  - Business rule enforcement
  - Security validation patterns
  - International format support (phone numbers, IDs, etc.)

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
- **Zod**: Comprehensive schema validation library with:
  - Runtime type checking and form validation
  - Input sanitization and formatting
  - Security validation patterns
  - International format support
  - Business rule enforcement
  - Real-time validation feedback
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Validation Utilities**: Custom validation helpers for common patterns like phone numbers, emails, IDs, and names

## External Authentication Services
- **Google OAuth 2.0**: OAuth authentication provider for secure user sign-in
- **Google Identity Services**: Frontend integration for Google Sign-In button
- **Google Auth Library**: Backend token verification and user profile retrieval

## Development Experience
- **Replit Integration**: Custom plugins for development environment integration
- **Hot Reload**: Development server with automatic reloading
- **Error Overlay**: Runtime error modal for better development experience