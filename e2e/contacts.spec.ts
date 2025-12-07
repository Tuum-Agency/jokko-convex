
import { test, expect } from '@playwright/test';

test('create contact flow', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3000/dashboard/contacts');
    // Handle login if redirected... 
    // For now assuming dev env might be open or we need to login via UI.
    // This is a stub for what the user requested.

    // 2. Open Dialog
    await page.getByRole('button', { name: 'Nouveau' }).click();

    // 3. Fill form
    await page.getByRole('textbox', { name: 'Téléphone' }).fill('778889900'); // Assuming prefix is there
    await page.getByPlaceholder('Amadou').fill('Playwright');
    await page.getByPlaceholder('Diallo').fill('Test');

    // 4. Submit
    await page.getByRole('button', { name: 'Créer le contact' }).click();

    // 5. Verify
    await expect(page.getByText('Playwright Test')).toBeVisible();
});
