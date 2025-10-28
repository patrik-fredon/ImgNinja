# Development Commands

## Core Development Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting and formatting
npm run lint
npm run format
```

## System Commands (Linux)
```bash
# File operations
ls -la                    # List files with details
find . -name "*.tsx"      # Find TypeScript React files
grep -r "searchterm" src/ # Search in source files
cat filename.txt          # View file contents

# Git operations
git status               # Check git status
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push                # Push to remote

# Process management
ps aux                  # List running processes
kill -9 PID            # Force kill process
```

## Build Analysis
```bash
# Analyze bundle size
ANALYZE=true npm run build
```

## File Management
```bash
# Create directories
mkdir -p src/components/new-feature

# Copy files
cp source.tsx destination.tsx

# Remove files/directories
rm filename.txt
rm -rf directory/
```

## Development Workflow
1. Start development server: `npm run dev`
2. Make changes to source files
3. Test in browser (localhost:3000)
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Build for production: `npm run build`