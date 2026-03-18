# GitHub Copilot Instructions

## Language Preferences

- Always respond to me in Spanish
- Write all code documentation (JSDoc, comments, README) in English
- Write commit messages in English following Conventional Commits format

## Code Style & Conventions

### TypeScript

- Use TypeScript strict mode
- **Never use `any` type** - use `unknown` or proper types instead
- **Avoid type assertions (`as`)** - prefer explicit type annotations
  - ❌ Bad: `const animal = {} as Animal`
  - ✅ Good: `const animal: Animal = { id: '', name: '', ... }`
- **Use `const` by default, `let` only when reassignment is needed** - never use `var`
  - ❌ Bad: `var name = 'Max'` or `let name = 'Max'` (if not reassigned)
  - ✅ Good: `const name = 'Max'`
- Always add explicit return types for functions
- Prefer interfaces over types for object shapes
- Use type inference where obvious, explicit types where clarity is needed

### React & Next.js

- This is a Next.js 16.1.4 project with App Router and Turbopack
- Use `'use client'` directive only when necessary (state, effects, browser APIs)
- Prefer functional components with hooks
- Use arrow functions for component definitions
- Always add JSDoc comments to exported functions and components
- Include usage examples in JSDoc for reusable components

### Naming Conventions

- **Components**: PascalCase (e.g., `ConfirmDialog.tsx`, `WhatsAppFloat`)
- **Functions/variables**: camelCase (e.g., `handleSubmit`, `isAdmin`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MIN_LOADING_TIME`, `API_URL`)
- **Files**:
  - Components: PascalCase (e.g., `ConfirmDialog.tsx`)
  - Utilities: camelCase (e.g., `handleToast.ts`)
  - Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)

### Styling

- Use Tailwind CSS for all styling
- Follow mobile-first responsive design
- Use custom colors from tailwind.config.js:
  - `green-forest`, `green-dark`, `cream-light`, `amber-sunset`
- Prefer utility classes over custom CSS

## Project-Specific Patterns

### Firebase

- Use Firebase Client SDK v11.8.1 (NOT firebase-admin)
- Collections: `animals`, `contacts`, `systemAuditLog`, `banners`, `users`, `animalTransactions`, `animalPrivateInfo`
- Always use the helper functions in `src/lib/firebase/`:
  - `getFirestoreData()` for reads
  - `postFirestoreData()` for creates/updates
  - `deleteFirestoreData()` for deletes
  - `createAuditLog()` for audit logging

### Audit Logging

- Always create audit logs for CRUD operations on critical entities
- Call `createAuditLog()` BEFORE the main operation (not after)
- Include before/after changes for updates
- Valid audit types: `'user' | 'banner' | 'contact' | 'animal' | 'config'`
- Valid actions: `'create' | 'update' | 'delete'`

### Authentication & Authorization

- Use `useAuth()` hook from `@/contexts/AuthContext`
- Extract hook values at component level, never inside async functions
- Role hierarchy: `superadmin > admin > rescatista > user`
- Use `checkIsAdmin()` for permission checks
- Use `ProtectedRoute` component for route protection
- Use `RoleGuard` component for conditional UI rendering

### Error Handling & User Feedback

- Use `handleToast()` for simple notifications
- Use `handlePromiseToast()` for async operations with pending/success/error states
- Always provide meaningful error messages in Spanish for users
- Log technical errors to console for debugging
- Toast types: `'success' | 'error' | 'warning' | 'info'`

### UI Patterns

- Use minimum loading time pattern (600ms) for better UX
- Implement optimistic UI updates where appropriate
- Use `ConfirmDialog` for destructive actions
- Use `Modal` for forms and detailed views
- Use `FloatButton` for primary actions on admin pages

### Forms

- Use controlled components with useState
- Add proper labels with htmlFor attributes
- Include placeholder text in Spanish
- Use semantic HTML (form, input, button types)
- Validate on submit, show errors with toast

### Performance

- Use React.memo for expensive components
- Prefer CSS animations over JS when possible
- Lazy load images and heavy components
- Use proper key props in lists (unique IDs, not indexes)

## Testing & Quality

### Before Committing

- Ensure no TypeScript errors (`npm run build`)
- Check for console errors and warnings
- Test on mobile viewport
- Verify all CRUD operations work
- Confirm audit logs are created

### Common Patterns to Follow

```typescript
// Always destructure useAuth at component level
const { currentUser, checkIsAdmin } = useAuth();

// Create audit logs before operations
if (currentUser) {
  await createAuditLog({ type, action, entityId, ... });
}
await actualOperation();

// Use handlePromiseToast for async operations
await handlePromiseToast(
  asyncFunction(),
  { messages: { pending, success, error } }
);

// Minimum loading time pattern
const start = Date.now();
try {
  await operation();
} finally {
  const elapsed = Date.now() - start;
  const remaining = MIN_LOADING_TIME - elapsed;
  if (remaining > 0) {
    setTimeout(() => setLoading(false), remaining);
  } else {
    setLoading(false);
  }
}
```

## Git Conventions

### Commit Messages

Follow Conventional Commits:

- `feat(scope):` new features
- `fix(scope):` bug fixes
- `refactor(scope):` code refactoring
- `docs(scope):` documentation
- `style(scope):` formatting, missing semicolons
- `test(scope):` adding tests
- `chore(scope):` maintenance

Examples:

- `feat(admin): add WhatsApp contacts management page`
- `fix(auth): resolve hook violation in audit logging`
- `refactor(components): make ConfirmDialog cancel button optional`

### Branch Strategy

- `main`: production-ready code
- `develop`: integration branch
- Feature branches: `feature/description`
- Bugfix branches: `fix/description`

## Helpful Reminders

- This project helps animal rescue organization in Maldonado, Uruguay
- Focus on accessibility and usability for non-technical users
- Keep UX simple and clear with helpful feedback
- Mobile-first design is critical (many users on phones)
- Performance matters (users may have slow connections)
