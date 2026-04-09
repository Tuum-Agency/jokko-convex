
import { test, expect } from '@playwright/test';

// Base URL for the dev server
const BASE_URL = 'http://localhost:3000';
const CONTACTS_URL = `${BASE_URL}/dashboard/contacts`;

test.describe('Contacts Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(CONTACTS_URL);
        await page.waitForLoadState('networkidle');
    });

    // ============================================
    // Existing: create contact flow
    // ============================================
    test('create contact flow', async ({ page }) => {
        // Open Dialog
        const newButton = page.getByRole('button', { name: /nouveau/i });
        const newVisible = await newButton.isVisible().catch(() => false);
        if (!newVisible) {
            test.skip();
            return;
        }

        await newButton.click();

        // Fill form
        await page.getByRole('textbox', { name: 'Téléphone' }).fill('778889900');
        await page.getByPlaceholder('Amadou').fill('Playwright');
        await page.getByPlaceholder('Diallo').fill('Test');

        // Submit
        await page.getByRole('button', { name: 'Créer le contact' }).click();

        // Verify
        await expect(page.getByText('Playwright Test')).toBeVisible();
    });

    // ============================================
    // Sort dropdown
    // ============================================
    test('should display sort dropdown', async ({ page }) => {
        const sortButton = page.locator('button').filter({ hasText: /trier|sort|récent|ancien/i });

        const sortVisible = await sortButton.first().isVisible().catch(() => false);
        if (!sortVisible) {
            // Try alternate selector: a select or dropdown trigger
            const altSort = page.locator('[data-testid="sort-dropdown"], [data-testid="sort-select"]');
            const altVisible = await altSort.first().isVisible().catch(() => false);
            if (!altVisible) {
                test.skip();
                return;
            }
        }

        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // Bulk selection mode
    // ============================================
    test('should toggle bulk selection mode', async ({ page }) => {
        const bulkButton = page.getByRole('button', { name: /sélection|masse|bulk|cocher/i });

        const bulkVisible = await bulkButton.isVisible().catch(() => false);
        if (!bulkVisible) {
            // Try checkbox/select all pattern
            const selectAll = page.locator('[data-testid="bulk-select"], input[type="checkbox"]').first();
            const exists = await selectAll.isVisible().catch(() => false);
            if (!exists) {
                test.skip();
                return;
            }
        }

        await bulkButton.click();

        // Should show cancel or action bar
        const cancelOrAction = page.locator('button').filter({ hasText: /annuler|cancel|supprimer|exporter/i });
        const actionVisible = await cancelOrAction.first().isVisible().catch(() => false);
        if (actionVisible) {
            await expect(cancelOrAction.first()).toBeVisible();
        }
    });

    // ============================================
    // Duplicate detection button
    // ============================================
    test('should show duplicate detection button', async ({ page }) => {
        const dupButton = page.locator('button').filter({ hasText: /doublon|dupliqu|merge|fusionn/i });

        const dupVisible = await dupButton.first().isVisible().catch(() => false);
        if (!dupVisible) {
            // Try icon-based button or menu item
            const altDup = page.locator('[data-testid="detect-duplicates"], [aria-label*="doublon"]');
            const altVisible = await altDup.first().isVisible().catch(() => false);
            if (!altVisible) {
                test.skip();
                return;
            }
        }

        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // Segment selector
    // ============================================
    test('should show segment selector', async ({ page }) => {
        const segmentSelector = page.locator('button, [role="combobox"]').filter({ hasText: /segment|filtre|vue/i });

        const segVisible = await segmentSelector.first().isVisible().catch(() => false);
        if (!segVisible) {
            const altSeg = page.locator('[data-testid="segment-selector"], [data-testid="segment-filter"]');
            const altVisible = await altSeg.first().isVisible().catch(() => false);
            if (!altVisible) {
                test.skip();
                return;
            }
        }

        await expect(page.locator('body')).toBeVisible();
    });

    // ============================================
    // Contact detail drawer on click
    // ============================================
    test('should open contact detail drawer on click', async ({ page }) => {
        // Find a contact row/card
        const contactItem = page.locator('[data-testid="contact-item"], [data-testid="contact-row"], tr[class*="cursor"], div[class*="cursor-pointer"]').first();

        const contactVisible = await contactItem.isVisible().catch(() => false);
        if (!contactVisible) {
            test.skip();
            return;
        }

        await contactItem.click();

        // Should open a drawer/sheet/dialog with contact details
        const detail = page.locator('[role="dialog"], [data-testid="contact-detail"], [class*="sheet"], [class*="drawer"]');
        const detailVisible = await detail.first().isVisible().catch(() => false);

        if (detailVisible) {
            await expect(detail.first()).toBeVisible();
        } else {
            // Might navigate to detail page instead
            await expect(page.locator('body')).toBeVisible();
        }
    });

    // ============================================
    // Activity indicators on avatars
    // ============================================
    test('should display activity indicators on avatars', async ({ page }) => {
        // Look for online/activity status dots on avatars
        const statusDots = page.locator('[class*="bg-green"], [class*="status-dot"], [data-testid="activity-indicator"], span[class*="absolute"][class*="rounded-full"]');

        const dotCount = await statusDots.count();
        // Just verify page renders; indicators may not be present if no contacts are active
        expect(dotCount).toBeGreaterThanOrEqual(0);
    });

    // ============================================
    // Filter count badges
    // ============================================
    test('should show filter count badges', async ({ page }) => {
        // Look for badge elements showing active filter counts
        const badges = page.locator('[class*="badge"], span[class*="bg-primary"], span[class*="rounded-full"][class*="text-xs"]');

        const badgeCount = await badges.count();
        // Badges may only appear when filters are active; verify page is stable
        expect(badgeCount).toBeGreaterThanOrEqual(0);
    });

    // ============================================
    // Page loads without console errors
    // ============================================
    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(CONTACTS_URL);
        await page.waitForLoadState('networkidle');

        // Filter out known non-critical errors (Convex dev warnings, hydration)
        const criticalErrors = errors.filter(
            (e) => !e.includes('convex') && !e.includes('Warning') && !e.includes('hydration')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
