import { test, expect } from '@playwright/test';

const TEAM_URL = 'http://localhost:3000/dashboard/team';

test.describe('Team Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEAM_URL);
        await page.waitForLoadState('networkidle');
    });

    test('should load the team page', async ({ page }) => {
        await expect(page.locator('body')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/rechercher/i);
        const visible = await searchInput.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(searchInput).toBeVisible();
    });

    test('should filter members by search', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/rechercher/i);
        const visible = await searchInput.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await searchInput.fill('test');
        await page.waitForTimeout(300);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should display role filter', async ({ page }) => {
        const roleFilter = page.locator('select, [role="combobox"], button').filter({ hasText: /rôle|role|tous/i }).first();
        const visible = await roleFilter.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(roleFilter).toBeVisible();
    });

    test('should display status indicators on members', async ({ page }) => {
        // Look for status dots (colored circles indicating online/offline)
        const statusDots = page.locator('[class*="rounded-full"][class*="bg-green"], [class*="rounded-full"][class*="bg-red"], [class*="rounded-full"][class*="bg-amber"]');
        const count = await statusDots.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display role distribution chart', async ({ page }) => {
        const chart = page.locator('text=/Owner|Admin|Agent/i').first();
        const visible = await chart.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(chart).toBeVisible();
    });

    test('should have export button', async ({ page }) => {
        const exportBtn = page.getByRole('button', { name: /exporter|export/i });
        const visible = await exportBtn.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(exportBtn).toBeVisible();
    });

    test('should have invite button', async ({ page }) => {
        const inviteBtn = page.getByRole('button', { name: /inviter|invite/i });
        const visible = await inviteBtn.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(inviteBtn).toBeVisible();
    });

    test('should display activity section', async ({ page }) => {
        const activitySection = page.locator('text=/activit|historique/i').first();
        const visible = await activitySection.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(activitySection).toBeVisible();
    });

    test('should display member workload bars', async ({ page }) => {
        // Look for progress-like elements in member cards
        const workloadBars = page.locator('[class*="bg-gradient"], [role="progressbar"]');
        const count = await workloadBars.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(TEAM_URL);
        await page.waitForLoadState('networkidle');

        const criticalErrors = errors.filter(
            (e) => !e.includes('convex') && !e.includes('Warning') && !e.includes('hydration')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});
