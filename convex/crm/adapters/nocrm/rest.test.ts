// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pullDealsPage } from "./rest";
import type { AdapterCallCtx } from "../../core/types";

const fakeCtx: AdapterCallCtx = {
    provider: "nocrm",
    connectionId: "conn_x",
    organizationId: "org_x",
    correlationId: "cid",
    credentials: { apiKey: "key", instanceUrl: "https://demo.nocrm.io" },
    scalingMode: "standard",
};

describe("nocrm.pullDealsPage", () => {
    it("returns an empty page (nocrm has no deal entity)", async () => {
        const res = await pullDealsPage({ ctx: fakeCtx });
        expect(res.items).toEqual([]);
        expect(res.hasMore).toBe(false);
        expect(res.nextCursor).toBeUndefined();
    });
});
