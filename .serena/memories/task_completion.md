# Task Completion Guidelines

## Code Quality Checks
1. **Linting**: Run `npm run lint` to check for code issues
2. **Formatting**: Run `npm run format` to format code consistently
3. **Type Checking**: Ensure TypeScript compiles without errors
4. **Build Verification**: Run `npm run build` to verify production build

## Testing Approach
- Manual testing in browser during development
- Test all supported image formats (PNG, JPEG, WebP, AVIF, GIF)
- Verify responsive design on different screen sizes
- Test error handling scenarios
- Validate internationalization (Czech/English)

## Performance Validation
- Check bundle size with `ANALYZE=true npm run build`
- Verify lazy loading is working correctly
- Test Web Worker functionality
- Validate image processing performance

## Deployment Preparation
1. Run production build: `npm run build`
2. Test production build locally: `npm start`
3. Verify all routes work correctly
4. Check SEO meta tags and structured data
5. Validate Google Ads integration (if applicable)

## Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Components follow established patterns
- [ ] Error handling is implemented
- [ ] Internationalization keys are added
- [ ] Responsive design is maintained
- [ ] Performance optimizations are in place
- [ ] Security headers are configured
- [ ] Accessibility standards are met

## Git Workflow
1. Stage changes: `git add .`
2. Commit with descriptive message: `git commit -m "feat: add new feature"`
3. Push to repository: `git push`

## Documentation Updates
- Update README.md if new features are added
- Add comments for complex logic
- Update type definitions
- Maintain changelog if applicable