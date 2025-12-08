# WinMix Virtual Football League System

## Testing Suite Documentation

This project includes a comprehensive testing suite using Vitest, React Testing Library, MSW for API mocking, and Playwright for E2E testing.

## Testing Commands

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI interface
npm run test:e2e:ui
```

## Test Structure

### Unit Tests (`src/test/`)
- **Services**: `services/winmixApi.test.ts` - Tests for API layer with Supabase mocks
- **Components**: `components/AuthProvider.test.tsx` - Authentication flow tests
- **Widgets**: `widgets/LeagueStandings.test.tsx` - Widget integration tests
- **Admin**: 
  - `admin/feature-import-export.test.tsx` - Feature flag management tests
  - `admin/theme-import-export.test.tsx` - Theme system tests

### E2E Tests (`src/test/e2e/`)
- **Auth Flow**: `auth-flow.spec.ts` - Authentication and authorization tests
- Covers user login, admin access control, dashboard functionality

### Test Configuration
- **Vitest Config**: `vitest.config.ts` - Test environment setup with coverage
- **MSW Handlers**: `msw/handlers.ts` - API mocking for Supabase endpoints
- **Playwright Config**: `playwright.config.ts` - E2E test configuration

## Coverage Reporting

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/index.html` - Interactive coverage report
- **JSON**: `coverage/coverage-final.json` - Machine-readable coverage data
- **LCov**: `coverage/lcov.info` - CI-friendly coverage format

Coverage thresholds are set to 80% for all metrics.

## Environment Variables for Testing

### Required for E2E Tests
```env
# Supabase credentials for E2E tests
E2E_SUPABASE_URL=http://localhost:54321
E2E_SUPABASE_ANON_KEY=your-anon-key-here
```

### Test Setup Files
- `src/test/setup.ts` - Global test setup with MSW and mocks
- `global-setup.ts` - Playwright global setup
- `global-teardown.ts` - Playwright global teardown

## Testing Architecture

### Mock Strategy
1. **MSW (Mock Service Worker)**: Intercepts HTTP requests to Supabase
2. **Component Mocking**: Mock heavy dependencies (analytics, third-party components)
3. **API Layer Testing**: Test services with mocked Supabase responses

### Test Categories

#### 1. API Layer Tests
- Mock Supabase client responses
- Test CRUD operations for matches, teams, leagues
- Validate error handling and edge cases

#### 2. Authentication Tests
- Test login/logout flows
- Verify role-based access control
- Mock Supabase auth responses
- Test password reset functionality

#### 3. Widget Integration Tests
- Test LeagueStandings component with real data flow
- Verify loading and error states
- Test data transformation and rendering

#### 4. Admin Feature Tests
- Feature flag import/export functionality
- Theme system import/export with validation
- JSON schema validation for admin data

#### 5. E2E Integration Tests
- Complete user authentication flow
- Dashboard navigation and data loading
- Admin page access control
- Mobile responsiveness testing
- Error handling in real browser environment

## CI/CD Integration

### Recommended CI Commands
```bash
# Install dependencies
pnpm install

# Run unit/integration tests with coverage
pnpm run test:coverage

# Build application
pnpm run build

# Run E2E tests (if environment is available)
pnpm run test:e2e
```

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run test:coverage
      - run: pnpm run build
```

## Test Data

### Mock Users
- **Regular User**: test@example.com / password
- **Admin User**: admin@example.com / password

### Mock Data
- Teams (Manchester United, Liverpool FC, etc.)
- Leagues (Premier League)
- Matches (scheduled, live, finished)
- User profiles with roles

## Troubleshooting

### Common Issues

1. **MSW Not Starting**
   - Ensure `src/test/setup.ts` is configured correctly
   - Check that MSW handlers are imported

2. **Playwright Browser Issues**
   - Install system dependencies: `sudo apt-get install libxcb-shm0 libx11-xcb1 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64`

3. **Test Timeouts**
   - Increase timeout values in test files if needed
   - Check for infinite loops or async operations

4. **Coverage Reports**
   - Coverage is only generated in non-watch mode
   - Use `pnpm run test:coverage` for coverage reports

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests clearly with setup, action, and assertion phases
3. **Mock Appropriately**: Mock external dependencies but test your own logic
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Maintain Test Independence**: Tests should not depend on each other
6. **Use Page Object Pattern**: For E2E tests, create page objects for complex interactions

## Adding New Tests

### Unit Test Template
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component Name', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
})
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test'

test('User flow description', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="button"]')
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Update coverage reports
4. Add E2E tests for critical user flows
5. Document any new testing patterns used

## Dependencies Added

### Testing Dependencies
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Custom jest matchers
- `msw` - API mocking
- `@playwright/test` - E2E testing
- `jsdom` - DOM environment for testing
- `happy-dom` - Lightweight DOM implementation