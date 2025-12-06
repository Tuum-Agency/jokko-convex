import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Jokko/);
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible({ timeout: 10000 });
});

test('navigate to sign-in page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Connexion');
    await expect(page).toHaveURL(/.*sign-in/);
    // Wait for the heading "Bienvenue" which is inside an animation
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible({ timeout: 10000 });
});
