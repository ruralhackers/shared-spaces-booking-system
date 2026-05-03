# Pre-Commit Workflow

This document defines the required checks before committing code to ensure all CI workflows pass.

## Required Checks Before Commit

Before committing any changes, you MUST run and pass all three workflow checks locally. This ensures that the CI pipeline will succeed and maintains code quality.

### 1. Lint Check (Linting & Formatting)

Run Biome to check for code style and linting issues:

```bash
bun run lint
```

If there are issues, fix them automatically with:

```bash
bun run lint:fix
```

**What it checks:**
- Code formatting (consistent style)
- Linting rules (potential bugs, best practices)
- Import organization
- Code complexity

### 2. TypeScript Type Check

Run TypeScript compiler to verify type safety:

```bash
bun run typecheck
```

**What it checks:**
- Type errors
- Type mismatches
- Missing type definitions
- Invalid type usage
- Compiler errors

### 3. Run Tests

Execute all tests to ensure functionality:

```bash
bun test
```

**What it checks:**
- Unit tests pass
- Integration tests pass
- Business logic correctness
- No regressions

## Pre-Commit Workflow (Step by Step)

Follow this sequence before every commit:

```bash
# 1. Format and lint code
bun run lint:fix

# 2. Verify types
bun run typecheck

# 3. Run tests
bun test

# 4. If all pass, commit
git add .
git commit -m "Your commit message"
```

## Quick Command (All Checks)

You can run all checks sequentially with:

```bash
bun run lint:fix && bun run typecheck && bun test
```

If any check fails, the command will stop, and you'll need to fix the issues before proceeding.

## CI Workflows

These same checks run automatically in GitHub Actions on every push and pull request:

1. **Lint** (`.github/workflows/lint.yml`)
   - Runs `biome ci --diagnostic-level=error`
   - Fails if linting or formatting issues exist

2. **TypeScript Type Check** (`.github/workflows/typecheck.yml`)
   - Runs `bun run typecheck`
   - Fails if type errors exist

3. **Tests** (`.github/workflows/tests.yml`)
   - Runs `bun test`
   - Fails if any test fails

## Best Practices

### 1. Run Checks Frequently

Don't wait until commit time to run checks. Run them frequently during development:

```bash
# Watch mode for type checking (runs on file changes)
bun run typecheck:watch

# Watch mode for tests (runs affected tests on changes)
bun test --watch
```

### 2. Fix Issues Immediately

Address issues as soon as they appear:
- **Type errors**: Fix them before writing more code
- **Linting issues**: Auto-fix with `bun run lint:fix`
- **Test failures**: Debug and fix immediately

### 3. Use Editor Integration

Configure your IDE/editor to run these checks automatically:
- Enable Biome extension for real-time linting
- Enable TypeScript checking in your editor
- Use test runner extensions for inline test results

### 4. Commit Clean Code

Never commit code that:
- Has TypeScript errors
- Fails linting/formatting checks
- Has failing tests
- Has commented-out code blocks (unless necessary)

### 5. Write Meaningful Commit Messages

After ensuring all checks pass, write clear commit messages:

```bash
# Good examples
git commit -m "feat: add user authentication with JWT"
git commit -m "fix: resolve race condition in order processing"
git commit -m "refactor: extract validation logic to domain service"

# Bad examples
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "update code"
```

## Troubleshooting

### Lint Check Fails

```bash
# View detailed errors
bun run lint

# Auto-fix safe issues
bun run lint:fix

# Auto-fix with unsafe transformations (use cautiously)
bun run lint:unsafe
```

### TypeScript Check Fails

```bash
# Run with detailed output
bun run typecheck

# Common fixes:
# - Add missing type annotations
# - Import required types
# - Fix type mismatches
# - Update tsconfig.json if needed
```

### Tests Fail

```bash
# Run tests with verbose output
bun test --verbose

# Run specific test file
bun test path/to/test.test.ts

# Debug specific test
bun test --only "test name"
```

## Automated Pre-Commit Hooks (Optional)

You can automate these checks using git hooks. Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "Running pre-commit checks..."

# Run Lint check
echo "1/3 Checking code style..."
bun run lint:fix
if [ $? -ne 0 ]; then
  echo "❌ Lint check failed"
  exit 1
fi

# Run TypeScript check
echo "2/3 Checking types..."
bun run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed"
  exit 1
fi

# Run tests
echo "3/3 Running tests..."
bun test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ All checks passed!"
exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Summary

**Always remember the 3-check rule before committing:**

1. ✅ **Lint Check** - Code style and linting
2. ✅ **TypeScript Check** - Type safety
3. ✅ **Tests** - Functionality

Following this workflow ensures:
- Clean, consistent code
- Type-safe implementations
- Working functionality
- Successful CI pipeline
- Happy code reviewers 😊
