# Task Completion Checklist

## When a Task is Completed

### 1. Code Verification

- [ ] All sub-tasks implemented
- [ ] Code follows TypeScript strict mode
- [ ] No TypeScript errors
- [ ] Path aliases used correctly (@/components, @/lib, etc.)

### 2. Requirements Check

- [ ] All requirements from task details satisfied
- [ ] Implementation matches design document
- [ ] No over-engineering or unnecessary abstractions

### 3. Build Verification

- [ ] `npm run build` succeeds (if applicable)
- [ ] No build errors or warnings

### 4. Documentation

- [ ] Update GENERAL.md with technical changes
- [ ] Update CHANGELOG.md with concise summary
- [ ] Clear TODO.md at session end

### 5. Testing (Manual Only)

- [ ] Manual verification of functionality
- [ ] No automated tests unless explicitly requested

## DO NOT

- Write tests unless explicitly requested
- Add defensive coding or fallback systems
- Create unnecessary abstractions
- Debug without approval
- Proceed to next task automatically
