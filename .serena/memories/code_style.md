# Code Style and Conventions

## TypeScript Standards
- Strict TypeScript configuration enabled
- Interface definitions for all props and state
- Type imports using `import type`
- Path aliases configured: `@/*`, `@/components/*`, `@/lib/*`, `@/app/*`, `@/types/*`

## React Patterns
- Functional components with hooks
- useReducer for complex state management
- Lazy loading with dynamic imports
- Error boundaries for error handling
- Custom hooks for reusable logic
- Suspense for loading states

## File Organization
- Components organized by feature in `/src/components/`
- Business logic in `/src/lib/`
- Types in `/src/types/`
- Internationalization in `/messages/`
- App Router structure in `/src/app/[locale]/`

## Naming Conventions
- PascalCase for components and types
- camelCase for functions and variables
- kebab-case for file names and directories
- UPPER_CASE for constants and environment variables

## Component Structure
- Props interfaces defined above components
- Default exports for components
- Named exports for utilities
- Lazy components with "Lazy" prefix
- Error handling components with "Error" prefix

## Styling Approach
- Tailwind CSS utility classes
- Custom color palette with brand colors
- Responsive design with mobile-first approach
- Animation classes for smooth transitions
- CSS variables for dynamic theming