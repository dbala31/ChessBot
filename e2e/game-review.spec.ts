import { test, expect } from '@playwright/test'

test.describe('Game review', () => {
  test('loads game review page with board and controls', async ({ page }) => {
    await page.goto('/games/1')

    // Board should be visible
    await expect(page.locator('.cg-wrap')).toBeVisible()

    // Navigation buttons should exist
    await expect(page.locator('button').first()).toBeVisible()

    // Move list should be present
    await expect(page.getByText('You vs MagnusFan99')).toBeVisible()
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/games/1')
    await page.waitForSelector('.cg-wrap')

    // Press right arrow to advance
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft')
  })
})
