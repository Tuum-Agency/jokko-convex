import { test, expect } from '@playwright/test';

const INTEGRATIONS_URL = 'https://be-in-digital.localhost:1000/dashboard/integrations';

test.describe('Integrations Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(INTEGRATIONS_URL);
        await page.waitForLoadState('networkidle');
    });

    test('should load and display the integrations header', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /intégrations crm/i })).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
        await expect(page.getByText(/connexions actives/i)).toBeVisible();
        await expect(page.getByText(/contacts importés/i)).toBeVisible();
        await expect(page.getByText(/opt-ins collectés/i)).toBeVisible();
    });

    test('should display at least one provider card', async ({ page }) => {
        // HubSpot is always in the catalog (available or coming_soon)
        const anyProvider = page.getByText(/hubspot|pipedrive|salesforce|sellsy|axonaut|nocrm/i).first();
        await expect(anyProvider).toBeVisible();
    });

    test('should display Connecter buttons on provider cards', async ({ page }) => {
        const connectBtns = page.getByRole('button', { name: /connecter|reconnecter|indisponible/i });
        const count = await connectBtns.count();
        expect(count).toBeGreaterThan(0);
    });

    test.describe('Disconnect dialog', () => {
        test.beforeEach(async ({ page }) => {
            const disconnectBtn = page.getByRole('button', { name: /^déconnecter$/i }).first();
            const appeared = await disconnectBtn
                .waitFor({ state: 'visible', timeout: 5000 })
                .then(() => true)
                .catch(() => false);
            if (!appeared) {
                test.skip();
                return;
            }
            await disconnectBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
        });

        test('should display the dialog title', async ({ page }) => {
            await expect(
                page.getByRole('heading', { name: /déconnecter .+ \?/i }),
            ).toBeVisible();
        });

        test('should display the 4 consequences', async ({ page }) => {
            await expect(page.getByText(/tokens (révoqués|supprimés)/i)).toBeVisible();
            await expect(page.getByText(/liens contacts ↔ crm conservés/i)).toBeVisible();
            await expect(page.getByText(/événements en file d'attente/i)).toBeVisible();
            await expect(page.getByText(/reconnexion ultérieure/i)).toBeVisible();
        });

        test('should display the acknowledgement checkbox', async ({ page }) => {
            await expect(page.getByLabel(/j'ai compris les conséquences/i)).toBeVisible();
        });

        test('should keep the confirm button disabled until checkbox is checked', async ({ page }) => {
            const confirmBtn = page.getByRole('button', { name: /^déconnecter$/i }).last();
            await expect(confirmBtn).toBeDisabled();

            await page.getByLabel(/j'ai compris les conséquences/i).click();
            await expect(confirmBtn).toBeEnabled();
        });

        test('should close when Annuler is clicked', async ({ page }) => {
            await page.getByRole('button', { name: /^annuler$/i }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
        });

        test('should reset acknowledged checkbox when reopened', async ({ page }) => {
            // Tick + cancel
            const checkbox = page.getByLabel(/j'ai compris les conséquences/i);
            await checkbox.click();
            await page.getByRole('button', { name: /^annuler$/i }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();

            // Reopen
            await page.getByRole('button', { name: /^déconnecter$/i }).first().click();
            await expect(page.getByRole('dialog')).toBeVisible();

            // The confirm button should be disabled again (checkbox was reset)
            const confirmBtn = page.getByRole('button', { name: /^déconnecter$/i }).last();
            await expect(confirmBtn).toBeDisabled();
        });
    });
});
