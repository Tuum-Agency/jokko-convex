import { test, expect } from '@playwright/test';

const BASE_URL = 'http://be-in-digital.localhost:3000';
const NEW_CAMPAIGN_URL = `${BASE_URL}/dashboard/campagnes/new`;

test.describe('Campaign Scheduling Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(NEW_CAMPAIGN_URL);
        await page.waitForLoadState('networkidle');

        // Vérifier qu'on est bien authentifié
        const url = page.url();
        if (url.includes('/sign-in')) {
            test.skip();
            return;
        }
    });

    test('should show scheduling toggle', async ({ page }) => {
        const schedulingLabel = page.locator('text=/programmer/i').first();
        await expect(schedulingLabel).toBeVisible();

        const toggle = page.locator('[role="switch"]');
        await expect(toggle).toBeVisible();
    });

    test('should show date and time inputs when scheduling is enabled', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        const dateBtn = page.locator('button').filter({ hasText: /choisir une date/i }).first();
        await expect(dateBtn).toBeVisible();

        const timeInput = page.locator('input[type="time"]');
        await expect(timeInput).toBeVisible();
    });

    test('should disable past dates in calendar', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        const dateBtn = page.locator('button').filter({ hasText: /choisir une date/i }).first();
        await dateBtn.click();

        await page.waitForTimeout(500);

        // Past dates should be disabled
        const disabledDays = page.locator('button[disabled]').filter({ hasNotText: /^$/ });
        const count = await disabledDays.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show red warning when past time is set for today', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        // Open calendar
        const dateBtn = page.locator('button').filter({ hasText: /choisir une date/i }).first();
        await dateBtn.click();
        await page.waitForTimeout(500);

        // Click today
        const today = new Date().getDate().toString();
        const dayButtons = page.locator('table button:not([disabled])');
        const dayCount = await dayButtons.count();

        let clicked = false;
        for (let i = 0; i < dayCount; i++) {
            const text = await dayButtons.nth(i).textContent();
            if (text?.trim() === today) {
                await dayButtons.nth(i).click();
                clicked = true;
                break;
            }
        }

        if (!clicked) {
            test.skip();
            return;
        }

        await page.waitForTimeout(300);

        // Set past time 00:00
        const timeInput = page.locator('input[type="time"]');
        await timeInput.fill('00:00');
        await page.waitForTimeout(300);

        // Should show warning message
        const warningText = page.locator('text=/Min\\./i');
        await expect(warningText).toBeVisible();
    });

    test('should disable submit when no date selected in scheduled mode', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        await page.waitForTimeout(300);

        const submitBtn = page.getByRole('button', { name: /planifier/i });
        await expect(submitBtn).toBeDisabled();
    });

    test('should show "Envoyer maintenant" when scheduling is off', async ({ page }) => {
        const submitBtn = page.getByRole('button', { name: /envoyer maintenant/i });
        await expect(submitBtn).toBeVisible();
    });

    test('should show "Planifier la campagne" when scheduling is on', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        const submitBtn = page.getByRole('button', { name: /planifier/i });
        await expect(submitBtn).toBeVisible();
    });

    test('should show green confirmation when valid future date/time set', async ({ page }) => {
        const toggle = page.locator('[role="switch"]');
        await toggle.click();

        // Open calendar
        const dateBtn = page.locator('button').filter({ hasText: /choisir une date/i }).first();
        await dateBtn.click();
        await page.waitForTimeout(500);

        // Click the last enabled day (end of month = guaranteed future)
        const enabledDays = page.locator('table button:not([disabled])');
        const count = await enabledDays.count();
        if (count < 2) {
            test.skip();
            return;
        }
        await enabledDays.nth(count - 1).click();
        await page.waitForTimeout(300);

        // Set future time
        const timeInput = page.locator('input[type="time"]');
        await timeInput.fill('14:00');
        await page.waitForTimeout(300);

        // Should show green "Envoi prévu..." text
        const confirmText = page.locator('text=/envoi prévu/i');
        await expect(confirmText).toBeVisible();
    });

    test('should show audience estimation', async ({ page }) => {
        const audienceText = page.locator('text=/contacts ciblés/i').first();
        await expect(audienceText).toBeVisible({ timeout: 10000 });
    });

    test('should have required name field', async ({ page }) => {
        const nameInput = page.locator('input#name');
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toHaveAttribute('required', '');
    });
});
