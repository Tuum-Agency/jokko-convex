#!/usr/bin/env node
/**
 * Seed a CRM connection with the fixture contacts.
 *
 * Usage:
 *   node scripts/seed-crm.mjs --provider=hubspot [--remote-account=148302799]
 *
 * Requires an active OAuth connection in Convex (connect first via /dashboard/integrations).
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
    const out = { provider: "hubspot" };
    for (const arg of argv.slice(2)) {
        const m = arg.match(/^--([^=]+)=(.*)$/);
        if (!m) continue;
        const [, key, val] = m;
        if (key === "provider") out.provider = val;
        else if (key === "remote-account") out.remoteAccountId = val;
        else if (key === "fixture") out.fixturePath = val;
    }
    return out;
}

async function main() {
    const args = parseArgs(process.argv);

    const fixturePath = args.fixturePath
        ? resolve(args.fixturePath)
        : resolve(__dirname, "fixtures/contacts.json");

    const raw = await readFile(fixturePath, "utf-8");
    const parsed = JSON.parse(raw);
    const contacts = parsed.contacts ?? parsed;

    if (!Array.isArray(contacts) || contacts.length === 0) {
        console.error(`No contacts found in ${fixturePath}`);
        process.exit(1);
    }

    const payload = {
        provider: args.provider,
        contacts,
    };
    if (args.remoteAccountId) payload.remoteAccountId = args.remoteAccountId;

    console.log(
        `→ Seeding ${contacts.length} contacts into ${args.provider}${args.remoteAccountId ? ` (portal ${args.remoteAccountId})` : ""}...`,
    );

    const result = spawnSync(
        "pnpx",
        ["convex", "run", "crm/seed:seedContacts", JSON.stringify(payload)],
        { stdio: "inherit", cwd: resolve(__dirname, "..") },
    );

    process.exit(result.status ?? 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
