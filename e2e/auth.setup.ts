import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
    // Login directly on the org subdomain
    await page.goto('http://be-in-digital.localhost:3000/sign-in');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.locator('#email').fill('momoseck8@gmail.com');
    await page.locator('#password').fill('Password123!');

    // Submit
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Wait for auth to complete and page to settle
    await page.waitForTimeout(8000);
    await page.waitForLoadState('networkidle');

    // Save auth state with cookies on the subdomain
    await page.context().storageState({ path: AUTH_FILE });
});
