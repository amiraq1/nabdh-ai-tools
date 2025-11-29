# Supplier and Balance Management System

## Overview

This is an Arabic-language (RTL) supplier and balance management system built with a modern full-stack architecture. The application enables users to manage suppliers, track financial balances, and record transactions (credits and debits) in an intuitive, data-first interface optimized for Arabic right-to-left flow.

The system follows Material Design principles adapted for Arabic RTL interfaces, prioritizing data clarity, operational efficiency, and scan-ability for daily business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query v5** for server state management, data fetching, and caching

**UI Component System**
- **shadcn/ui** component library with Radix UI primitives ("new-york" style variant)
- **Tailwind CSS** for utility-first styling with RTL support
- **Arabic Typography**: IBM Plex Sans Arabic and Cairo fonts from Google Fonts
- Custom theme system with light/dark mode support via context API
- Design system follows Material Design principles adapted for Arabic interfaces

**State Management Strategy**
- Server state managed by TanStack Query with optimistic updates
- Local UI state managed by React hooks and context
- Form state handled by React Hook Form with Zod validation
- Theme persistence using localStorage

**RTL-First Design**
- All layouts mirror-ready for Arabic right-to-left flow
- Sidebar positioned on the right (RTL standard)
- Custom CSS variables for RTL-aware spacing and positioning
- Arabic-optimized typography hierarchy

### Backend Architecture

**Server Framework**
- **Express.js** REST API with TypeScript
- **HTTP Server** created separately for potential WebSocket support
- Middleware: JSON body parsing, URL-encoded form support, custom logging
- Static file serving for production builds

**API Design Pattern**
- RESTful endpoints following resource-based conventions
- `/api/suppliers` - CRUD operations for supplier management
- `/api/transactions` - Transaction recording and retrieval
- Zod schema validation on all incoming requests
- Consistent error handling with appropriate HTTP status codes

**Data Access Layer**
- Abstract `IStorage` interface for storage operations
- `MemStorage` in-memory implementation for development/testing
- Designed for easy swap to database implementation (Drizzle ORM ready)
- UUID-based resource identification

**Database Schema (Drizzle ORM)**
- **PostgreSQL** as the target database (Neon serverless-ready)
- **Drizzle ORM** for type-safe database operations
- Schema defined in `shared/schema.ts` for client-server sharing
- Tables:
  - `suppliers`: Core supplier data with balance tracking
  - `transactions`: Financial transactions linked to suppliers
- Zod schema integration for runtime validation

**Build System**
- **esbuild** for server bundling with dependency allowlisting
- Vite for client bundling with code splitting
- Separate development and production modes
- Custom build script in `script/build.ts`

### External Dependencies

**Database & ORM**
- **@neondatabase/serverless** - Serverless PostgreSQL client optimized for edge environments
- **Drizzle ORM** - Type-safe SQL query builder
- **drizzle-kit** - Schema migration tool
- **drizzle-zod** - Automatic Zod schema generation from Drizzle schemas
- **connect-pg-simple** - PostgreSQL session store (if sessions are implemented)

**Form & Validation**
- **React Hook Form** - Performant form state management
- **@hookform/resolvers** - Resolver integrations (Zod)
- **Zod** - TypeScript-first schema validation for both client and server

**UI Component Libraries**
- **@radix-ui/** packages - Unstyled, accessible UI primitives (accordion, dialog, dropdown, select, etc.)
- **lucide-react** - Icon library
- **cmdk** - Command palette component
- **embla-carousel-react** - Carousel functionality
- **date-fns** - Date manipulation and formatting

**Styling**
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Variant-based component styling
- **tailwind-merge** - Intelligent Tailwind class merging
- **clsx** - Conditional className construction

**Developer Tools**
- **@replit/** plugins - Replit-specific development enhancements (error overlay, cartographer, dev banner)
- **tsx** - TypeScript execution for development and scripts
- **TypeScript** - Type checking and compilation

**Build Dependencies**
- **Vite plugins** - React support, runtime error handling
- **PostCSS** - CSS processing with autoprefixer
- **esbuild** - Fast JavaScript/TypeScript bundler

**Shared Schema Pattern**
The `shared/schema.ts` file contains Drizzle table definitions and Zod schemas used by both client and server, ensuring type safety and validation consistency across the full stack. This eliminates duplication and guarantees client-server contract alignment.