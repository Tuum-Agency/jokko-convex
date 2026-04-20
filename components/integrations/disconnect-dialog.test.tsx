import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DisconnectDialog } from "./disconnect-dialog";

afterEach(() => {
    cleanup();
});

describe("DisconnectDialog", () => {
    function renderDialog(overrides: Partial<React.ComponentProps<typeof DisconnectDialog>> = {}) {
        const props = {
            open: true,
            providerLabel: "HubSpot",
            onCancel: vi.fn(),
            onConfirm: vi.fn(),
            busy: false,
            ...overrides,
        };
        const view = render(<DisconnectDialog {...props} />);
        return { ...view, props };
    }

    it("renders the provider label in title and label", () => {
        renderDialog();
        expect(screen.getByText(/Déconnecter HubSpot/)).toBeInTheDocument();
        expect(screen.getByText(/je souhaite déconnecter HubSpot/)).toBeInTheDocument();
    });

    it("disables confirm until the checkbox is checked", () => {
        renderDialog();
        const confirmBtn = screen.getByRole("button", { name: /Déconnecter$/i });
        expect(confirmBtn).toBeDisabled();
        fireEvent.click(screen.getByRole("checkbox"));
        expect(confirmBtn).not.toBeDisabled();
    });

    it("calls onConfirm when acknowledged and clicked", async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        renderDialog({ onConfirm });
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(screen.getByRole("button", { name: /Déconnecter$/i }));
        await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    });

    it("resets acknowledged state when onConfirm rejects (try/finally)", async () => {
        const onConfirm = vi.fn().mockRejectedValue(new Error("remote failure"));
        const { rerender, props } = renderDialog({ onConfirm });
        fireEvent.click(screen.getByRole("checkbox"));
        const confirmBtn = screen.getByRole("button", { name: /Déconnecter$/i });
        expect(confirmBtn).not.toBeDisabled();

        fireEvent.click(confirmBtn);
        await waitFor(() => expect(onConfirm).toHaveBeenCalled());

        // After rejection, the component must reset acknowledged → button disabled again.
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Déconnecter$/i })).toBeDisabled();
        });

        // And the parent remains free to close the dialog. Simulate re-open with a fresh mount.
        rerender(<DisconnectDialog {...props} onConfirm={vi.fn()} open={false} />);
        rerender(<DisconnectDialog {...props} onConfirm={vi.fn()} open={true} />);
        expect(screen.getByRole("button", { name: /Déconnecter$/i })).toBeDisabled();
    });

    it("resets acknowledged when open flips to false then back to true", async () => {
        const { rerender, props } = renderDialog();
        fireEvent.click(screen.getByRole("checkbox"));
        expect(screen.getByRole("button", { name: /Déconnecter$/i })).not.toBeDisabled();

        rerender(<DisconnectDialog {...props} open={false} />);
        rerender(<DisconnectDialog {...props} open={true} />);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Déconnecter$/i })).toBeDisabled();
        });
    });

    it("shows loading copy and disables controls when busy", () => {
        renderDialog({ busy: true });
        expect(screen.getByRole("button", { name: /Déconnexion/i })).toBeDisabled();
        expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("invokes onCancel when Annuler is clicked", () => {
        const onCancel = vi.fn();
        renderDialog({ onCancel });
        fireEvent.click(screen.getByRole("button", { name: /Annuler/i }));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it("does not call onConfirm when only acknowledged is false", () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });
        const confirmBtn = screen.getByRole("button", { name: /Déconnecter$/i });
        fireEvent.click(confirmBtn);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows provider-specific wording when remote revoke is supported", () => {
        renderDialog({
            providerLabel: "Salesforce",
            supportsRemoteRevoke: true,
        });
        expect(screen.getByText(/Tokens révoqués des deux côtés/i)).toBeInTheDocument();
        expect(
            screen.getByText(/révoqués côté Jokko et côté Salesforce/i),
        ).toBeInTheDocument();
    });

    it("warns the user to revoke manually when remote revoke is not supported", () => {
        renderDialog({
            providerLabel: "HubSpot",
            supportsRemoteRevoke: false,
        });
        expect(screen.getByText(/Tokens supprimés de Jokko/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Pour révoquer l'accès côté HubSpot/i),
        ).toBeInTheDocument();
    });
});
