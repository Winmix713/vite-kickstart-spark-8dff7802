import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...')

  // Setup test database or mocks here
  // For now, we'll just verify the browser launches correctly
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Test basic connectivity
  try {
    await page.goto('http://localhost:5173')
    console.log('✅ Application is accessible')
  } catch (error) {
    console.error('❌ Application is not accessible:', error)
    throw error
  }

  await browser.close()
  console.log('✅ Global setup completed successfully')
}

export default globalSetup