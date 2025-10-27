# Code Style and Conventions

## TypeScript
- **Strict mode**: enabled
- **Type hints**: required for all function parameters and return types
- **Interfaces**: prefer interfaces over types for object shapes
- **Naming**:
  - PascalCase for components, types, interfaces
  - camelCase for functions, variables
  - UPPER_CASE for constants
  - kebab-case for file names

## React/Next.js
- **Components**: functional components with TypeScript
- **File structure**: one component per file
- **Props**: explicit interface definitions
- **State**: minimal React state, avoid unnecessary context/providers
- **Rendering**: SSR/ISR preferred, CSR only for dynamic interactions

## Tailwind CSS
- **Utility-first**: use Tailwind utility classes directly
- **No custom CSS**: avoid writing custom CSS unless absolutely necessary
- **Responsive**: mobile-first approach (320px minimum)

## File Organization
- Split files >200 lines
- One canonical implementation per module
- No temp/mock/sandbox files
- Clear separation: components, lib, types

## Comments
- Comment only critical logic and integration points
- No adjectives or commentary - pure logic
- Self-documenting code preferred

## Error Handling
- Minimal error handling - only essential for production
- Clear failure modes - never suppress errors
- Fail clearly and explicitly
