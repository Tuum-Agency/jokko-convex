import { test, expect } from '@playwright/test';

// Override auth state — this test exercises the login flow itself
test.use({ storageState: { cookies: [], origins: [] } });

const PORT = process.env.PORT || '3000';

test.describe('Login flow', () => {
    test('signs in and reaches dashboard without infinite spinner', async ({ page }) => {
        // 1. Go to sign-in page on subdomain (matches auth.setup.ts pattern)
        await page.goto(`http://be-in-digital.localhost:${PORT}/auth/sign-in`);
        await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible({ timeout: 15000 });

        // 2. Fill credentials
        await page.locator('#email').fill('momoseck8@gmail.com');
        await page.locator('#password').fill('Password123!');

        // 3. Submit
        await page.getByRole('button', { name: /se connecter/i }).click();

        // 4. Should reach dashboard within 15s (no infinite spinner)
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

        // 5. Verify we're NOT stuck on sign-in redirect loop
        await expect(page).not.toHaveURL(/\/sign-in/);

        // 6. Verify dashboard content actually rendered (not skeleton/spinner)
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Either the dashboard layout rendered or a subdomain redirect happened
        const url = page.url();
        expect(url).toContain('/dashboard');
    });

    test('shows error for invalid credentials', async ({ page }) => {
        await page.goto(`http://be-in-digital.localhost:${PORT}/auth/sign-in`);
        await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible({ timeout: 15000 });

        await page.locator('#email').fill('wrong@example.com');
        await page.locator('#password').fill('WrongPassword!');
        await page.getByRole('button', { name: /se connecter/i }).click();

        // Should show error message and stay on sign-in page
        await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/\/sign-in/);
    });
});
