#!/usr/bin/env node

/**
 * Trello → GitHub Issues Polling Script
 *
 * Polls a Trello board for new cards in the "Ready for Dev" list,
 * creates a detailed GitHub Issue with an AI-ready prompt for each card,
 * including any attachments/screenshots from the Trello card.
 *
 * Environment variables:
 *   TRELLO_API_KEY    - Trello Power-Up API key
 *   TRELLO_TOKEN      - Trello member token (read+write)
 *   TRELLO_BOARD_ID   - Trello board ID
 *   GITHUB_TOKEN      - GitHub token for issue creation
 *   GITHUB_REPOSITORY - owner/repo format (e.g. "user/repo")
 *
 * Usage:
 *   node scripts/trello-poll.mjs            # Normal run
 *   node scripts/trello-poll.mjs --dry-run  # Preview without side effects
 */

const TRELLO_BASE = "https://api.trello.com/1";
const GITHUB_API = "https://api.github.com";
const PROCESSED_LABEL_NAME = "automated:processed";
const READY_LIST_NAME = "Ready for Dev";
const IN_PROGRESS_LIST_NAME = "In Progress";
const ERROR_LIST_NAME = "Error";

const DRY_RUN = process.argv.includes("--dry-run");

const {
  TRELLO_API_KEY,
  TRELLO_TOKEN,
  TRELLO_BOARD_ID,
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
} = process.env;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requiredEnv() {
  const missing = [];
  if (!TRELLO_API_KEY) missing.push("TRELLO_API_KEY");
  if (!TRELLO_TOKEN) missing.push("TRELLO_TOKEN");
  if (!TRELLO_BOARD_ID) missing.push("TRELLO_BOARD_ID");
  if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!GITHUB_REPOSITORY) missing.push("GITHUB_REPOSITORY");
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

/** Trello API fetch with auth query params */
async function trelloFetch(path, options = {}) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TRELLO_BASE}${path}${separator}key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API ${options.method || "GET"} ${path} failed (${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

/** GitHub API fetch with auth */
async function githubFetch(path, options = {}) {
  const url = `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${options.method || "GET"} ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/** Derive GitHub issue label from Trello card labels */
function deriveIssueLabels(trelloLabels) {
  const labels = [];
  for (const label of trelloLabels) {
    const name = (label.name || "").toLowerCase();
    if (name.includes("fix") || name.includes("bug")) labels.push("bug");
    else if (name.includes("feature")) labels.push("enhancement");
    else if (name.includes("improvement")) labels.push("enhancement");
    else if (name.includes("design")) labels.push("design");
  }
  if (labels.length === 0) labels.push("enhancement");
  return [...new Set(labels)];
}

/** Build a rich, AI-ready GitHub Issue body from a Trello card */
function buildIssueBody(card, attachments) {
  const trelloDesc = card.desc || "Pas de description fournie sur Trello.";
  const trelloUrl = card.shortUrl;
  const labels = (card.labels || []).map((l) => l.name).join(", ") || "aucun";

  // Build attachments section
  let attachmentsSection = "";
  if (attachments.length > 0) {
    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    const images = [];
    const files = [];

    for (const att of attachments) {
      const isImage = imageExts.some((ext) => (att.name || att.url || "").toLowerCase().endsWith(ext))
        || (att.mimeType || "").startsWith("image/");

      if (isImage) {
        images.push(`![${att.name || "screenshot"}](${att.url})`);
      } else {
        files.push(`- [${att.name || "attachment"}](${att.url})`);
      }
    }

    if (images.length > 0 || files.length > 0) {
      attachmentsSection = "\n\n## Captures d'écran / Pièces jointes\n\n";
      if (images.length > 0) {
        attachmentsSection += images.join("\n\n") + "\n";
      }
      if (files.length > 0) {
        attachmentsSection += "\n" + files.join("\n") + "\n";
      }
    }
  }

  return `## Carte Trello
${trelloUrl}
Labels: ${labels}

## Description de la tâche

${trelloDesc}
${attachmentsSection}
---

## Prompt AI (Claude / Codex)

<details>
<summary>Cliquer pour voir le prompt complet</summary>

\`\`\`
Tu travailles sur le projet Jokko, un CRM WhatsApp Business multi-tenant.
Lis d'abord le fichier CLAUDE.md à la racine du projet pour comprendre l'architecture et les conventions.

## Tâche à réaliser

**Titre** : ${card.name}

**Description** :
${trelloDesc}

## Contexte technique

Architecture du projet :
- **Backend** : Convex (convex/) — runtime edge-like, schema dans convex/schema.ts
- **Frontend** : Next.js 16 App Router (app/) — React 19, TypeScript strict
- **UI** : shadcn/ui (Radix + Tailwind CSS v4) dans components/ui/
- **State** : Zustand (PAS React Context)
- **Auth** : @convex-dev/auth (convex/auth.ts)
- **Multi-tenant** : chaque requête scopée via userSessions.currentOrganizationId
- **Permissions** : convex/lib/permissions.ts (OWNER > ADMIN > AGENT)

Conventions obligatoires :
- TypeScript strict, pas de \`any\`
- Conventional Commits (feat:, fix:, etc.)
- Composants UI avec shadcn/ui
- Data fetching via useQuery/useMutation de Convex (PAS de REST)
- Tests unitaires avec vitest + convex-test
- Tests E2E avec Playwright si UI impactée

## Instructions

1. Implémente la tâche décrite ci-dessus
2. Écris des tests unitaires (vitest) pour le backend
3. Si la tâche touche l'UI, ajoute un test E2E (Playwright)
4. Vérifie que \`npx vitest run\` passe
5. Vérifie que \`pnpm lint\` passe
6. Vérifie que \`npx convex typecheck\` passe
7. Crée un fichier de documentation dans tasks/done/ décrivant ce qui a été fait
\`\`\`

</details>

---
*Issue créée automatiquement depuis Trello via le workflow Jokko.*`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  requiredEnv();

  if (DRY_RUN) {
    console.log("[DRY RUN] No changes will be made.\n");
  }

  // 1. Fetch all lists on the board
  const lists = await trelloFetch(`/boards/${TRELLO_BOARD_ID}/lists`);

  const readyList = lists.find((l) => l.name === READY_LIST_NAME);
  const inProgressList = lists.find((l) => l.name === IN_PROGRESS_LIST_NAME);
  const errorList = lists.find((l) => l.name === ERROR_LIST_NAME);

  if (!readyList) {
    console.error(`List "${READY_LIST_NAME}" not found on the board.`);
    console.error(`Available lists: ${lists.map((l) => l.name).join(", ")}`);
    process.exit(1);
  }
  if (!inProgressList) {
    console.error(`List "${IN_PROGRESS_LIST_NAME}" not found. Please create it.`);
    process.exit(1);
  }

  // 2. Fetch or create the "automated:processed" label
  const boardLabels = await trelloFetch(`/boards/${TRELLO_BOARD_ID}/labels`);
  let processedLabel = boardLabels.find((l) => l.name === PROCESSED_LABEL_NAME);

  if (!processedLabel && !DRY_RUN) {
    processedLabel = await trelloFetch(`/boards/${TRELLO_BOARD_ID}/labels`, {
      method: "POST",
      body: JSON.stringify({ name: PROCESSED_LABEL_NAME, color: "sky" }),
    });
    console.log(`Created label "${PROCESSED_LABEL_NAME}" (id: ${processedLabel.id})`);
  }

  // 3. Fetch cards in "Ready for Dev" (with attachments)
  const cards = await trelloFetch(
    `/lists/${readyList.id}/cards?attachments=true&attachment_fields=name,url,mimeType`
  );

  if (cards.length === 0) {
    console.log("No cards in Ready for Dev. Nothing to do.");
    return;
  }

  console.log(`Found ${cards.length} card(s) in "${READY_LIST_NAME}".`);

  // 4. Process each unprocessed card
  let created = 0;

  for (const card of cards) {
    const isProcessed = processedLabel && card.idLabels.includes(processedLabel.id);

    if (isProcessed) {
      console.log(`  [SKIP] "${card.name}" — already processed`);
      continue;
    }

    console.log(`  [PROCESS] "${card.name}" (${card.shortUrl})`);

    if (DRY_RUN) {
      console.log(`    → Would create GitHub Issue`);
      console.log(`    → Would move to "${IN_PROGRESS_LIST_NAME}"`);
      created++;
      continue;
    }

    try {
      // 4a. Build issue body
      const attachments = card.attachments || [];
      const issueBody = buildIssueBody(card, attachments);
      const issueLabels = deriveIssueLabels(card.labels || []);

      // 4b. Create GitHub Issue
      const issue = await githubFetch(`/repos/${GITHUB_REPOSITORY}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: card.name,
          body: issueBody,
          labels: [...issueLabels, "trello-automation"],
        }),
      });

      console.log(`    → Created GitHub Issue #${issue.number}: ${issue.html_url}`);

      // 4c. Add processed label on Trello
      await trelloFetch(`/cards/${card.id}/idLabels`, {
        method: "POST",
        body: JSON.stringify({ value: processedLabel.id }),
      });

      // 4d. Move card to "In Progress"
      await trelloFetch(`/cards/${card.id}`, {
        method: "PUT",
        body: JSON.stringify({ idList: inProgressList.id }),
      });

      // 4e. Add comment on Trello card with issue link
      await trelloFetch(`/cards/${card.id}/actions/comments`, {
        method: "POST",
        body: JSON.stringify({
          text: `GitHub Issue créée : ${issue.html_url}`,
        }),
      });

      created++;
    } catch (err) {
      console.error(`    [ERROR] Failed to process "${card.name}": ${err.message}`);

      // Move card to Error list
      if (errorList) {
        try {
          await trelloFetch(`/cards/${card.id}`, {
            method: "PUT",
            body: JSON.stringify({ idList: errorList.id }),
          });
          await trelloFetch(`/cards/${card.id}/actions/comments`, {
            method: "POST",
            body: JSON.stringify({
              text: `Erreur lors de la création de l'issue GitHub:\n\`\`\`\n${err.message}\n\`\`\``,
            }),
          });
        } catch {
          // Best effort
        }
      }
    }
  }

  console.log(`\nDone. Created ${created} GitHub Issue(s).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
