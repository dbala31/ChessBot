import { test, expect } from '@playwright/test'

test.describe('Training page', () => {
  test('loads training page with puzzle board', async ({ page }) => {
    await page.goto('/train')

    // Header
    await expect(page.getByText('Daily Training')).toBeVisible()

    // Progress indicator
    await expect(page.getByText(/puzzle \d+ of \d+/i)).toBeVisible()

    // Board should be present
    await expect(page.locator('.cg-wrap')).toBeVisible()

    // Action buttons
    await expect(page.getByRole('button', { name: /hint/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /explain with ai/i })).toBeVisible()
  })
})
