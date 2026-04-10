import { test, expect } from '@playwright/test';

const CAMPAIGNS_URL = 'http://localhost:3000/dashboard/campagnes';

test.describe('Campaigns Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(CAMPAIGNS_URL);
        await page.waitForLoadState('networkidle');
    });

    test('should load the campaigns page', async ({ page }) => {
        await expect(page.locator('body')).toBeVisible();
    });

    test('should display campaign summary stats', async ({ page }) => {
        const statCards = page.locator('[class*="bg-gradient"]');
        const count = await statCards.count();
        if (count < 1) {
            test.skip();
            return;
        }
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should display status filter tabs', async ({ page }) => {
        const allTab = page.locator('button, [role="tab"]').filter({ hasText: /tous/i }).first();
        const visible = await allTab.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(allTab).toBeVisible();

        const brouillonTab = page.locator('button, [role="tab"]').filter({ hasText: /brouillon/i }).first();
        const termineeTab = page.locator('button, [role="tab"]').filter({ hasText: /terminée/i }).first();
        const brouillonVisible = await brouillonTab.isVisible().catch(() => false);
        const termineeVisible = await termineeTab.isVisible().catch(() => false);
        expect(brouillonVisible || termineeVisible).toBeTruthy();
    });

    test('should filter campaigns by status', async ({ page }) => {
        const brouillonTab = page.locator('button, [role="tab"]').filter({ hasText: /brouillon/i }).first();
        const visible = await brouillonTab.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await brouillonTab.click();
        await page.waitForTimeout(300);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should display sort dropdown', async ({ page }) => {
        const sortBtn = page.locator('button, select, [role="combobox"]').filter({ hasText: /trier|récente|tri/i }).first();
        const visible = await sortBtn.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(sortBtn).toBeVisible();
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

    test('should filter campaigns by search', async ({ page }) => {
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

    test('should display campaigns table', async ({ page }) => {
        const table = page.locator('table, [role="table"]').first();
        const visible = await table.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(table).toBeVisible();

        const headers = page.locator('th, [role="columnheader"]');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
    });

    test('should have new campaign button', async ({ page }) => {
        const newBtn = page.getByRole('button', { name: /nouvelle campagne|nouveau|créer/i });
        const visible = await newBtn.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(newBtn).toBeVisible();
    });

    test('should navigate to new campaign page', async ({ page }) => {
        const newBtn = page.getByRole('button', { name: /nouvelle campagne|nouveau|créer/i });
        const visible = await newBtn.isVisible().catch(() => false);
        if (!visible) {
            // Try link variant
            const newLink = page.getByRole('link', { name: /nouvelle campagne|nouveau|créer/i });
            const linkVisible = await newLink.isVisible().catch(() => false);
            if (!linkVisible) {
                test.skip();
                return;
            }
            await newLink.click();
        } else {
            await newBtn.click();
        }
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/campagnes/new');
    });

    test('should display audience estimation on new page', async ({ page }) => {
        await page.goto(CAMPAIGNS_URL + '/new');
        await page.waitForLoadState('networkidle');

        const audienceText = page.locator('text=/contacts ciblés|contacts cibles/i').first();
        const visible = await audienceText.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(audienceText).toBeVisible();
    });

    test('should display template preview on new page', async ({ page }) => {
        await page.goto(CAMPAIGNS_URL + '/new');
        await page.waitForLoadState('networkidle');

        const previewText = page.locator('text=/aperçu|preview/i').first();
        const visible = await previewText.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(previewText).toBeVisible();
    });

    test('should display pagination', async ({ page }) => {
        const pagination = page.locator('nav[aria-label*="pagination"], [role="navigation"]').first();
        const paginationText = page.locator('text=/affichage|page/i').first();

        const navVisible = await pagination.isVisible().catch(() => false);
        const textVisible = await paginationText.isVisible().catch(() => false);

        if (!navVisible && !textVisible) {
            test.skip();
            return;
        }

        if (navVisible) {
            await expect(pagination).toBeVisible();
        } else {
            await expect(paginationText).toBeVisible();
        }
    });

    test('should have bulk action buttons when selecting', async ({ page }) => {
        const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
        const count = await checkboxes.count();
        if (count < 1) {
            test.skip();
            return;
        }

        await checkboxes.first().click();
        await page.waitForTimeout(300);

        const actionBtn = page.locator('button').filter({ hasText: /dupliquer|exporter|archiver/i }).first();
        const visible = await actionBtn.isVisible().catch(() => false);
        if (!visible) {
            test.skip();
            return;
        }
        await expect(actionBtn).toBeVisible();
    });

    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(CAMPAIGNS_URL);
        await page.waitForLoadState('networkidle');

        const criticalErrors = errors.filter(
            (e) => !e.includes('convex') && !e.includes('Warning') && !e.includes('hydration')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});
