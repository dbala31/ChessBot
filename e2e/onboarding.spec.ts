import { test, expect } from '@playwright/test'

test.describe('Onboarding flow', () => {
  test('shows welcome page and navigates through steps', async ({ page }) => {
    await page.goto('/onboarding')

    // Step 1: Welcome
    await expect(page.getByText('Welcome to ChessBot')).toBeVisible()
    await page.getByRole('button', { name: /get started/i }).click()

    // Step 2: Usernames
    await expect(page.getByText('Connect your accounts')).toBeVisible()
    await expect(page.getByPlaceholder(/chess\.com username/i)).toBeVisible()
    await expect(page.getByPlaceholder(/lichess username/i)).toBeVisible()

    // Import button should be disabled without usernames
    const importBtn = page.getByRole('button', { name: /import games/i })
    await expect(importBtn).toBeDisabled()
  })
})
