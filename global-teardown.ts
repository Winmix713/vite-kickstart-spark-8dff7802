import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...')

  // Clean up test data, close connections, etc.
  // This is where you would clean up any test database state
  // or external services used during testing

  console.log('✅ Global teardown completed successfully')
}

export default globalTeardown