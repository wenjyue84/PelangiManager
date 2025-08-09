# System Architecture Document
# PelangiManager - Capsule Hostel Management System

**Document Version:** 2.0  
**Date:** August 9, 2025  
**Author:** System Analyst  
**Project:** Pelangi Capsule Hostel Management System  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Data Architecture](#4-data-architecture)
5. [API Architecture](#5-api-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Security](#7-authentication--security)
8. [Core Features](#8-core-features)
9. [Development Environment](#9-development-environment)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Performance & Scalability](#11-performance--scalability)
12. [Error Handling & Monitoring](#12-error-handling--monitoring)

---

## 1. System Overview

### 1.1 Purpose
PelangiManager is a comprehensive capsule hostel management system designed specifically for Pelangi Capsule Hostel. The system provides real-time management of guest check-ins/check-outs, capsule occupancy tracking, maintenance management, and administrative operations.

### 1.2 System Scope
The system manages **24 capsules** organized in three physical sections:
- **Back Section:** C1-C6 (6 capsules)
- **Front Section:** C11-C24 (14 capsules) 
- **Middle Section:** C25-C26 (2 capsules)

### 1.3 Key Capabilities
- **Real-time Guest Management**: Complete guest lifecycle from check-in to check-out
- **Occupancy Monitoring**: Live capsule availability and occupancy statistics
- **Maintenance Tracking**: Problem reporting and resolution workflow
- **Self-Service Check-in**: Token-based guest self check-in system
- **User Management**: Role-based access control (admin/staff)
- **Configuration Management**: Flexible system settings
- **Multi-language Support**: Internationalization ready
- **Emergency Access**: Unauthenticated dashboard access for emergency situations

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Dashboard     │ │   Check-in/out  │ │   Maintenance   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Settings      │ │   History       │ │   User Mgmt     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                               HTTPS/REST API
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Node.js)                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   API Routes    │ │   Auth Service  │ │   Validation    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Storage Layer │ │   Config Mgmt   │ │   Error Handler │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                        Storage Interface
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                               │
│  ┌─────────────────┐                   ┌─────────────────┐     │
│  │   In-Memory     │ ←─── Dev Mode ────│   PostgreSQL    │     │
│  │   Storage       │                   │   (Production)  │     │
│  └─────────────────┘                   └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Patterns
- **Layered Architecture**: Clear separation between presentation, business logic, and data layers
- **RESTful API**: Standard HTTP methods for CRUD operations
- **Repository Pattern**: Abstract storage interface for database-agnostic operations
- **Component-Based UI**: Modular React components with shadcn/ui
- **Service Layer**: Business logic encapsulation in backend services
- **Configuration Management**: Centralized configuration with hot-reload capabilities

---

## 3. Technology Stack

### 3.1 Frontend Technologies
```typescript
{
  "runtime": "React 18",
  "language": "TypeScript",
  "buildTool": "Vite",
  "uiFramework": "shadcn/ui (Radix UI)",
  "styling": "TailwindCSS",
  "stateManagement": "TanStack Query (React Query)",
  "routing": "Wouter",
  "formHandling": "React Hook Form",
  "validation": "Zod",
  "icons": "Lucide React",
  "themes": "next-themes"
}
```

### 3.2 Backend Technologies
```typescript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "language": "TypeScript",
  "orm": "Drizzle ORM",
  "database": "PostgreSQL (prod) / In-Memory (dev)",
  "validation": "Zod",
  "authentication": "Google OAuth 2.0 + Traditional",
  "testing": "Jest",
  "buildTool": "ESBuild"
}
```

### 3.3 Development Tools
```typescript
{
  "packageManager": "npm",
  "versionControl": "Git",
  "linting": "ESLint",
  "formatting": "Prettier",
  "typeChecking": "TypeScript",
  "testing": "Jest + React Testing Library",
  "devServer": "Vite (frontend) + tsx (backend)",
  "environmentVariables": "cross-env"
}
```

---

## 4. Data Architecture

### 4.1 Database Schema

#### Core Tables
```sql
-- Users table (authentication)
users {
  id: varchar (PK, UUID)
  email: text (unique)
  username: text
  password: text (nullable for OAuth)
  googleId: text (unique, nullable)
  firstName: text
  lastName: text
  profileImage: text
  role: text ('admin' | 'staff')
  createdAt: timestamp
  updatedAt: timestamp
}

-- Guests table (core business entity)
guests {
  id: varchar (PK, UUID)
  name: text
  capsuleNumber: text
  checkinTime: timestamp
  checkoutTime: timestamp (nullable)
  expectedCheckoutDate: date
  isCheckedIn: boolean
  paymentAmount: text
  paymentMethod: text
  paymentCollector: text
  isPaid: boolean
  notes: text
  gender: text
  nationality: text
  phoneNumber: text
  email: text
  idNumber: text (Passport/IC)
  emergencyContact: text
  emergencyPhone: text
  age: text
  profilePhotoUrl: text
  selfCheckinToken: text (nullable)
}

-- Capsules table
capsules {
  id: varchar (PK, UUID)
  number: text (unique)
  section: text ('back' | 'middle' | 'front')
  isAvailable: boolean
  cleaningStatus: text ('cleaned' | 'to_be_cleaned')
  lastCleanedAt: timestamp
  lastCleanedBy: text
}

-- Sessions table (authentication)
sessions {
  id: varchar (PK, UUID)
  userId: varchar (FK -> users.id)
  token: text (unique)
  expiresAt: timestamp
  createdAt: timestamp
}
```

#### Supporting Tables
```sql
-- Guest check-in tokens
guestTokens {
  id: varchar (PK, UUID)
  token: text (unique)
  capsuleNumber: text (nullable)
  autoAssign: boolean
  guestName: text (nullable)
  phoneNumber: text (nullable)
  email: text (nullable)
  expectedCheckoutDate: text
  createdBy: varchar (FK -> users.id)
  isUsed: boolean
  usedAt: timestamp (nullable)
  expiresAt: timestamp
  createdAt: timestamp
}

-- Capsule maintenance problems
capsuleProblems {
  id: varchar (PK, UUID)
  capsuleNumber: text
  description: text
  reportedBy: text
  reportedAt: timestamp
  isResolved: boolean
  resolvedBy: text (nullable)
  resolvedAt: timestamp (nullable)
  notes: text (nullable)
}

-- Admin notifications
adminNotifications {
  id: varchar (PK, UUID)
  title: text
  message: text
  type: text ('info' | 'warning' | 'error')
  isRead: boolean
  metadata: text (JSON)
  createdAt: timestamp
}

-- Application settings
appSettings {
  id: varchar (PK, UUID)
  key: text (unique)
  value: text
  description: text
  updatedAt: timestamp
  updatedBy: varchar (FK -> users.id)
}
```

### 4.2 Storage Abstraction Layer

The system implements a flexible storage interface (`IStorage`) that allows switching between different storage backends:

```typescript
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Guest management
  createGuest(guest: InsertGuest): Promise<Guest>;
  getCheckedInGuests(pagination?: PaginationParams): Promise<PaginatedResponse<Guest>>;
  checkoutGuest(id: string): Promise<Guest | undefined>;
  
  // Capsule management
  getAvailableCapsules(): Promise<Capsule[]>;
  updateCapsuleCleaningStatus(updates: MarkCapsuleCleaned): Promise<boolean>;
  
  // Problem tracking
  createCapsuleProblem(problem: InsertCapsuleProblem): Promise<CapsuleProblem>;
  getActiveProblems(pagination?: PaginationParams): Promise<PaginatedResponse<CapsuleProblem>>;
  
  // Token management
  createGuestToken(token: InsertGuestToken): Promise<GuestToken>;
  getGuestToken(token: string): Promise<GuestToken | undefined>;
  
  // Configuration
  getGuestTokenExpirationHours(): Promise<number>;
  updateGuestTokenExpirationHours(hours: number): Promise<void>;
}
```

**Current Implementations:**
- **MemStorage**: In-memory storage for development and testing
- **DatabaseStorage**: PostgreSQL storage for production (prepared but requires `DATABASE_URL`)

---

## 5. API Architecture

### 5.1 API Design Principles
- **RESTful**: Standard HTTP methods (GET, POST, PATCH, DELETE)
- **JSON Communication**: All request/response bodies use JSON
- **Consistent Error Handling**: Standardized error responses
- **Validation**: Comprehensive input validation using Zod schemas
- **Security**: Authentication, authorization, and input sanitization
- **Pagination**: Large datasets use page-based pagination

### 5.2 API Endpoints Structure

#### Authentication Endpoints
```
POST   /api/auth/login           - User login with email/password
POST   /api/auth/google          - Google OAuth authentication
GET    /api/auth/me              - Get current user info
POST   /api/auth/logout          - User logout
```

#### Guest Management Endpoints
```
GET    /api/guests               - Get all guests (paginated)
POST   /api/guests/checkin       - Create new guest check-in
GET    /api/guests/checked-in    - Get currently checked-in guests
GET    /api/guests/history       - Get guest history (paginated)
PATCH  /api/guests/:id/checkout  - Check out a guest
PUT    /api/guests/:id           - Update guest information
DELETE /api/guests/:id           - Delete guest record
```

#### Capsule Management Endpoints
```
GET    /api/capsules             - Get all capsules
GET    /api/capsules/available   - Get available capsules
PATCH  /api/capsules/clean       - Mark capsule as cleaned
GET    /api/capsules/:number/problems - Get problems for specific capsule
```

#### Maintenance Management Endpoints
```
GET    /api/problems             - Get all problems (paginated)
GET    /api/problems/active      - Get active problems (paginated)
POST   /api/problems             - Report new problem
PATCH  /api/problems/:id/resolve - Resolve a problem
DELETE /api/problems/:id         - Delete problem record
```

#### Token Management Endpoints
```
GET    /api/guest-tokens/active  - Get active tokens (paginated)
POST   /api/guest-tokens         - Create new guest token
DELETE /api/guest-tokens/:token  - Cancel/delete token
POST   /api/guest-checkin/:token - Guest self check-in using token
```

#### Admin & Configuration Endpoints
```
GET    /api/users                - Get all users
POST   /api/users                - Create new user
DELETE /api/users/:id           - Delete user
GET    /api/settings             - Get system settings
PATCH  /api/settings             - Update system settings
GET    /api/admin/notifications  - Get admin notifications
PATCH  /api/admin/notifications/:id/read - Mark notification as read
```

### 5.3 Authentication & Authorization

#### Authentication Flow
1. **Traditional Login**: Email/password with bcrypt hashing
2. **Google OAuth**: Full OAuth 2.0 flow with token verification
3. **Session Management**: JWT-like tokens with 24-hour expiration
4. **Token Storage**: Secure storage in localStorage with automatic cleanup

#### Authorization Levels
- **Public Routes**: Guest self check-in, basic dashboard viewing
- **Staff Routes**: Guest management, maintenance reporting
- **Admin Routes**: User management, system configuration
- **Emergency Access**: Dashboard accessible without authentication

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── auth-provider.tsx      # Authentication context
│   ├── global-error-boundary.tsx # Error handling
│   ├── guest-table.tsx        # Main guest table
│   ├── navigation.tsx         # Main navigation
│   ├── occupancy-calendar.tsx # Calendar view
│   └── user-management.tsx    # User admin panel
├── pages/
│   ├── dashboard.tsx          # Main dashboard
│   ├── check-in.tsx          # Guest check-in form
│   ├── check-out.tsx         # Guest check-out
│   ├── maintenance.tsx       # Maintenance management
│   ├── settings.tsx          # System settings
│   └── history.tsx           # Guest history
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   ├── useToast.ts           # Toast notifications
│   └── usePageVisibility.ts  # Performance optimization
├── lib/
│   ├── auth.ts               # Auth utilities
│   ├── queryClient.ts        # React Query config
│   ├── validation.ts         # Form validation
│   └── utils.ts              # General utilities
└── App.tsx                   # Root application
```

### 6.2 State Management Strategy

**Server State**: Managed by TanStack Query (React Query)
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling and retry logic
- Pagination support for large datasets

**Client State**: React hooks and context
- Authentication state via AuthProvider
- UI state (modals, forms) via useState
- Theme state via next-themes

**Form State**: React Hook Form with Zod validation
- Type-safe form handling
- Real-time validation feedback
- Integration with backend validation

### 6.3 Performance Optimizations

**Page Visibility API**: Pauses data fetching when tab is inactive
- Guest table: Refreshes every 30 seconds when visible
- Occupancy data: Updates every 30 seconds when visible
- Notifications: Updates every 60 seconds when visible

**Code Splitting**: Lazy loading of routes and heavy components
**Caching**: Aggressive caching with React Query
**Optimization**: Memoization of expensive computations

---

## 7. Authentication & Security

### 7.1 Authentication Methods

#### 1. Traditional Email/Password
```typescript
// Login flow
POST /api/auth/login
{
  "email": "admin@pelangi.com",
  "password": "admin123"
}

// Response
{
  "token": "session_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@pelangi.com",
    "role": "admin"
  }
}
```

#### 2. Google OAuth 2.0
```typescript
// OAuth flow
POST /api/auth/google
{
  "token": "google_oauth_token"
}

// Creates/updates user with Google profile
// Returns same session token format
```

### 7.2 Security Measures

#### Input Validation & Sanitization
- **Zod Schemas**: Comprehensive validation for all inputs
- **XSS Prevention**: Input sanitization and output encoding
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **CSRF Protection**: Token-based request validation

#### Authentication Security
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure token generation and storage
- **Token Expiration**: 24-hour session timeouts
- **Rate Limiting**: API endpoint protection

#### API Security
```typescript
// Security middleware stack
app.use(securityValidationMiddleware);
app.use(authenticateToken);
app.use(validateData(schema, 'body'));
```

### 7.3 Role-Based Access Control

#### User Roles
- **Admin**: Full system access, user management, configuration
- **Staff**: Guest management, maintenance reporting, basic operations
- **Guest** (Self-check-in): Limited access via tokens

#### Permission Matrix
| Feature | Admin | Staff | Guest | Public |
|---------|-------|-------|--------|--------|
| Dashboard View | ✓ | ✓ | ✗ | ✓ (Emergency) |
| Guest Check-in | ✓ | ✓ | ✗ | ✗ |
| Guest Check-out | ✓ | ✓ | ✗ | ✗ |
| Maintenance | ✓ | ✓ | ✗ | ✗ |
| User Management | ✓ | ✗ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ | ✗ |
| Self Check-in | ✗ | ✗ | ✓ | ✓ (Token) |

---

## 8. Core Features

### 8.1 Guest Management System

#### Check-in Process
1. **Smart Guest Creation**: Auto-incrementing guest names (Guest1, Guest2...)
2. **Gender-Based Assignment**: Automatic capsule assignment based on gender preferences
3. **Payment Integration**: Quick presets (RM45, RM48, RM650 monthly)
4. **Validation**: Comprehensive guest data validation
5. **Real-time Updates**: Immediate capsule availability updates

#### Check-out Process
1. **Guest Selection**: Search and select checked-in guests
2. **Cleaning Status**: Automatic capsule status update to "to_be_cleaned"
3. **Payment Verification**: Payment status confirmation
4. **History Recording**: Complete guest stay history

#### Guest Data Management
```typescript
interface Guest {
  id: string;
  name: string;
  capsuleNumber: string;
  checkinTime: Date;
  checkoutTime?: Date;
  expectedCheckoutDate?: string;
  isCheckedIn: boolean;
  paymentAmount?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentCollector?: string;
  isPaid: boolean;
  notes?: string;
  gender?: string;
  nationality?: string;
  phoneNumber?: string;
  email?: string;
  idNumber?: string; // Passport/IC
  emergencyContact?: string;
  emergencyPhone?: string;
  age?: string;
  profilePhotoUrl?: string;
}
```

### 8.2 Capsule Management System

#### Capsule Configuration
- **24 Total Capsules**: C1-C6 (Back), C11-C24 (Front), C25-C26 (Middle)
- **Gender Assignment Logic**: Front section for males, Back section for females
- **Availability Tracking**: Real-time occupancy status
- **Cleaning Status**: "cleaned" | "to_be_cleaned"

#### Occupancy Features
- **Real-time Dashboard**: Live occupancy statistics
- **Calendar View**: Visual occupancy calendar
- **Availability Cards**: Quick capsule status overview
- **Section-based Organization**: Logical grouping by physical location

### 8.3 Maintenance Management System

#### Problem Reporting Workflow
1. **Problem Detection**: Staff reports maintenance issues
2. **Capsule Unavailability**: Automatic capsule marking as unavailable
3. **Problem Tracking**: Detailed problem lifecycle management
4. **Resolution Process**: Structured resolution with notes
5. **Availability Restoration**: Automatic capsule re-availability

#### Maintenance Features
```typescript
interface CapsuleProblem {
  id: string;
  capsuleNumber: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}
```

### 8.4 Token-Based Self Check-in System

#### Token Generation
- **Admin Creation**: Staff/admin generates check-in tokens
- **Flexible Assignment**: Specific capsule or auto-assignment
- **Expiration Control**: Configurable token expiration (default 24h)
- **Usage Tracking**: Single-use tokens with usage timestamps

#### Self Check-in Process
1. **Token Validation**: Verify token authenticity and expiration
2. **Guest Information**: Guest provides personal details
3. **Capsule Assignment**: Automatic or pre-assigned capsule allocation
4. **Check-in Completion**: Full guest record creation
5. **Token Marking**: Token marked as used

### 8.5 User Management & Authentication

#### User Administration
- **Role Management**: Admin/Staff role assignment
- **Google OAuth Integration**: Seamless social login
- **Profile Management**: User profile and settings
- **Session Control**: Active session management

#### Authentication Features
- **Dual Authentication**: Traditional and OAuth options
- **Session Persistence**: Secure session management
- **Password Reset**: (Prepared for future implementation)
- **Multi-device Support**: Concurrent session handling

---

## 9. Development Environment

### 9.1 Setup Requirements

#### System Requirements
```bash
# Node.js version
Node.js 18+ (ES modules support required)

# Package manager
npm (with package-lock.json)

# Environment variables
PORT=5000 (default)
NODE_ENV=development|production
DATABASE_URL=postgresql://... (optional, uses in-memory if not set)
GOOGLE_CLIENT_ID=... (optional, for OAuth)
GOOGLE_CLIENT_SECRET=... (optional, for OAuth)
```

#### Quick Start
```bash
# Clone and install
git clone <repository>
cd PelangiManager
npm install

# Start development server
npm run dev

# Access application
http://localhost:5000
```

### 9.2 Development Scripts

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### 9.3 Default Credentials & Data

#### Admin Account
```
Email: admin@pelangi.com
Password: admin123
Role: admin
```

#### Sample Data
- **14 Pre-loaded Guests**: Realistic guest data for testing
- **24 Capsules**: Complete capsule configuration
- **Default Settings**: Guest token expiration, cleaning status, etc.

### 9.4 Development Features

#### Hot Reload
- **Frontend**: Vite hot module replacement
- **Backend**: tsx with file watching
- **Configuration**: Live config updates

#### Error Handling
- **Development Mode**: Detailed error overlays
- **Error Boundaries**: Comprehensive error catching
- **Console Logging**: Structured logging for debugging

---

## 10. Deployment Architecture

### 10.1 Production Configuration

#### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

#### Build Process
```bash
# Production build
npm run build

# Output structure
dist/
├── index.js          # Bundled server
├── client/           # Built frontend assets
└── migrations/       # Database migrations
```

### 10.2 Database Migration

#### From In-Memory to PostgreSQL
1. **Database Setup**: Create PostgreSQL database
2. **Environment Config**: Set `DATABASE_URL`
3. **Schema Migration**: Run `npm run db:push`
4. **Data Migration**: Import existing data if needed

#### Migration Commands
```bash
# Push schema to database
npm run db:push

# Generate migration files
npx drizzle-kit generate

# View current schema
npx drizzle-kit introspect
```

### 10.3 Production Considerations

#### Performance
- **Static Assets**: Vite optimization for frontend bundle
- **API Caching**: Response caching where appropriate
- **Database Indexing**: Optimized database indexes
- **Connection Pooling**: PostgreSQL connection management

#### Security
- **HTTPS**: SSL/TLS encryption required
- **Environment Variables**: Secure secret management
- **CORS**: Cross-origin request configuration
- **Rate Limiting**: API endpoint protection

#### Monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring
- **Health Checks**: System status endpoints
- **Database Monitoring**: Query performance tracking

---

## 11. Performance & Scalability

### 11.1 Current Performance Features

#### Frontend Optimization
- **Page Visibility API**: Reduces unnecessary API calls when tab inactive
- **React Query Caching**: Aggressive caching with background updates
- **Component Memoization**: Optimized re-rendering
- **Code Splitting**: Lazy loading of routes

#### Backend Optimization
- **Pagination**: All large datasets paginated (page/limit parameters)
- **Database Indexing**: Strategic indexes on frequently queried columns
- **In-Memory Caching**: Fast development mode with MemStorage
- **Validation Caching**: Zod schema compilation optimization

### 11.2 Scalability Design

#### Horizontal Scaling Readiness
- **Stateless Architecture**: Session data in database, not memory
- **Database-Agnostic**: Storage interface abstraction
- **Configuration Management**: External configuration support
- **Load Balancer Ready**: No server-side session storage

#### Current Limitations & Future Enhancements
```typescript
// Current capacity targets
{
  "concurrent_users": 50,
  "guest_records": 10000,
  "response_time": "< 2 seconds",
  "uptime": "99.5%"
}

// Scalability enhancements for future
{
  "database_clustering": "PostgreSQL cluster",
  "caching_layer": "Redis for session/cache",
  "cdn": "Static asset delivery",
  "websockets": "Real-time updates",
  "microservices": "Service decomposition"
}
```

---

## 12. Error Handling & Monitoring

### 12.1 Comprehensive Error Management

#### Global Error Boundary
```typescript
// Frontend error handling
<GlobalErrorBoundary onError={handleGlobalError}>
  <App />
</GlobalErrorBoundary>

// Catches and handles:
// - JavaScript runtime errors
// - React component errors
// - Async operation failures
// - Network request failures
```

#### Server-Side Error Handling
```typescript
// Error middleware stack
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Log error details
  console.error("Server error:", {
    status,
    message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(status).json({ message });
});
```

### 12.2 Error Classification & Response

#### Error Types & Handling
```typescript
interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  retryable: boolean;
  userMessage: string;
}

// Error categories
{
  "validation_errors": {
    "status": 400,
    "retryable": true,
    "user_action": "Fix input and retry"
  },
  "authentication_errors": {
    "status": 401,
    "retryable": false,
    "user_action": "Re-login required"
  },
  "authorization_errors": {
    "status": 403,
    "retryable": false,
    "user_action": "Contact administrator"
  },
  "not_found_errors": {
    "status": 404,
    "retryable": false,
    "user_action": "Check resource exists"
  },
  "server_errors": {
    "status": 500,
    "retryable": true,
    "user_action": "Try again later"
  }
}
```

### 12.3 Monitoring & Logging

#### Development Monitoring
- **Console Logging**: Structured logging with context
- **Error Overlays**: Real-time error display
- **Network Inspector**: Request/response monitoring
- **Performance Metrics**: Basic timing information

#### Production Monitoring (Prepared)
```typescript
// Monitoring endpoints for future implementation
{
  "health_check": "GET /api/health",
  "metrics": "GET /api/metrics",
  "error_reporting": "POST /api/errors/report",
  "system_status": "GET /api/status"
}

// Monitoring capabilities
{
  "error_tracking": "Centralized error collection",
  "performance_monitoring": "Response time tracking",
  "availability_monitoring": "Uptime tracking",
  "user_analytics": "Usage pattern analysis"
}
```

---

## Conclusion

PelangiManager represents a comprehensive, modern capsule hostel management solution built with scalability, maintainability, and user experience in mind. The system's layered architecture, comprehensive error handling, and flexible storage abstraction make it well-suited for both current operations and future enhancements.

### Key Strengths
1. **Modern Technology Stack**: Current best practices with TypeScript, React, and Node.js
2. **Comprehensive Validation**: Type-safe validation from frontend to database
3. **Flexible Architecture**: Easy transition from development to production
4. **User-Centric Design**: Intuitive interface with emergency access considerations
5. **Robust Error Handling**: Multi-layer error management and recovery
6. **Performance Optimized**: Smart caching and background updates

### Future Evolution Path
The system is designed for growth, with clear paths for adding features like real-time WebSocket updates, advanced reporting, multi-location support, and integration with external services.

---

**Document Control:**
- **Author:** System Analyst
- **Reviewed By:** Development Team
- **Next Review Date:** September 9, 2025
- **Version:** 2.0 (Comprehensive Architecture Document)

*This document serves as the definitive technical reference for the PelangiManager system architecture and implementation.*
