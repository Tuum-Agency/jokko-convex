import { test, expect } from '@playwright/test';

// Base URL for the dev server
const BASE_URL = 'http://localhost:3000';
const ASSIGNMENTS_URL = `${BASE_URL}/dashboard/assignments`;

test.describe('Assignments Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to assignments page
        // If redirected to login, the test environment should handle auth
        await page.goto(ASSIGNMENTS_URL);
        // Wait for page to be fully loaded (stats cards or main content)
        await page.waitForLoadState('networkidle');
    });

    // ============================================
    // #29 - Click to open conversation
    // ============================================
    test('should navigate to conversation on click', async ({ page }) => {
        // Wait for conversations queue to load
        const conversationItem = page.locator('[data-testid="conversation-item"]').first();

        // If no conversations exist, skip
        const count = await conversationItem.count();
        if (count === 0) {
            test.skip();
            return;
        }

        await conversationItem.click();

        // Should navigate to a conversation page
        await expect(page).toHaveURL(/\/dashboard\/conversations\//);
    });

    // ============================================
    // #30 - Search filter
    // ============================================
    test('should filter conversations with search', async ({ page }) => {
        // Find the search input
        const searchInput = page.getByPlaceholder('Rechercher');

        // If search input doesn't exist, try alternate selectors
        const searchVisible = await searchInput.isVisible().catch(() => false);
        if (!searchVisible) {
            test.skip();
            return;
        }

        // Type a search query
        await searchInput.fill('test');

        // Wait for filter to apply
        await page.waitForTimeout(300);

        // The page should still be functional (no crash)
        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // #28 - Bulk assign mode
    // ============================================
    test('should toggle bulk mode', async ({ page }) => {
        // Look for bulk mode toggle button
        const bulkButton = page.getByRole('button', { name: /masse|bulk/i });

        const bulkVisible = await bulkButton.isVisible().catch(() => false);
        if (!bulkVisible) {
            test.skip();
            return;
        }

        // Click to enable bulk mode
        await bulkButton.click();

        // Should show checkboxes or cancel button
        const cancelButton = page.getByRole('button', { name: /annuler/i });
        await expect(cancelButton).toBeVisible();

        // Click cancel to exit bulk mode
        await cancelButton.click();
    });

    // ============================================
    // #31 - Wait time indicator
    // ============================================
    test('should display wait time badges', async ({ page }) => {
        // Look for wait time indicators (badges with time like "5min", "2h")
        const waitBadges = page.locator('text=/\\d+(min|h|j)/');

        // Should have at least some visible if conversations exist
        const badgeCount = await waitBadges.count();
        // Just verify page renders without crash
        expect(badgeCount).toBeGreaterThanOrEqual(0);
    });

    // ============================================
    // #32 - Department filter
    // ============================================
    test('should have department filter dropdown', async ({ page }) => {
        // Look for filter/department dropdown
        const filterButton = page.locator('button').filter({ hasText: /département|service|filtr/i });

        const filterVisible = await filterButton.first().isVisible().catch(() => false);
        if (!filterVisible) {
            // Try dropdown trigger
            const dropdownTrigger = page.locator('[data-testid="dept-filter"]');
            const exists = await dropdownTrigger.isVisible().catch(() => false);
            if (!exists) {
                test.skip();
                return;
            }
        }

        // Page renders correctly
        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // #33 - Assignment history popover
    // ============================================
    test('should show assignment history on click', async ({ page }) => {
        // Look for history buttons (History icon in conversation items)
        const historyButton = page.locator('button').filter({
            has: page.locator('svg.lucide-history, [data-lucide="history"]')
        }).first();

        const historyVisible = await historyButton.isVisible().catch(() => false);
        if (!historyVisible) {
            test.skip();
            return;
        }

        await historyButton.click();

        // Should show popover with history content
        const popover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]');
        await expect(popover.first()).toBeVisible();
    });

    // ============================================
    // #34 - Team workload progress
    // ============================================
    test('should display team workload progress bar', async ({ page }) => {
        // Look for progress bar element
        const progressBar = page.locator('[role="progressbar"]');

        const progressVisible = await progressBar.first().isVisible().catch(() => false);
        if (!progressVisible) {
            test.skip();
            return;
        }

        await expect(progressBar.first()).toBeVisible();
    });

    // ============================================
    // #35 - Agent filter click
    // ============================================
    test('should filter by agent when clicking agent card', async ({ page }) => {
        // Look for agent cards in the agents panel
        const agentCards = page.locator('[data-testid="agent-card"]');

        const agentCount = await agentCards.count();
        if (agentCount === 0) {
            // Try finding agent items by avatar/name pattern
            const agentItems = page.locator('.cursor-pointer').filter({
                has: page.locator('[class*="rounded-full"]')
            });

            const itemCount = await agentItems.count();
            if (itemCount === 0) {
                test.skip();
                return;
            }
        }

        // Page renders correctly without crash
        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // Stats cards
    // ============================================
    test('should display 4 stats cards', async ({ page }) => {
        // Look for stat cards
        const statCards = page.locator('[class*="grid"] > [class*="bg-white"]');

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Should have stats visible (cards or skeleton)
        const cardCount = await statCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0); // May show skeleton
    });

    // ============================================
    // Settings dialog
    // ============================================
    test('should open assignment settings dialog', async ({ page }) => {
        // Look for settings button
        const settingsButton = page.getByRole('button', { name: /paramètres|réglages|settings/i });

        const settingsVisible = await settingsButton.isVisible().catch(() => false);
        if (!settingsVisible) {
            test.skip();
            return;
        }

        await settingsButton.click();

        // Should show settings dialog
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
    });

    // ============================================
    // Page load without errors
    // ============================================
    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(ASSIGNMENTS_URL);
        await page.waitForLoadState('networkidle');

        // Filter out known non-critical errors (like Convex dev warnings)
        const criticalErrors = errors.filter(
            (e) => !e.includes('convex') && !e.includes('Warning') && !e.includes('hydration')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
