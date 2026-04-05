#!/usr/bin/env node

/**
 * Trello Card Update Script
 *
 * Updates a Trello card after task processing (success or failure).
 *
 * Environment variables:
 *   TRELLO_API_KEY - Trello Power-Up API key
 *   TRELLO_TOKEN   - Trello member token (read+write)
 *
 * Usage:
 *   # On success:
 *   node scripts/trello-update.mjs \
 *     --card-id "abc123" \
 *     --list-id "listId" \
 *     --status "success" \
 *     --pr-url "https://github.com/.../pull/1"
 *
 *   # On error:
 *   node scripts/trello-update.mjs \
 *     --card-id "abc123" \
 *     --list-id "listId" \
 *     --status "error" \
 *     --error-message "Build failed: ..."
 */

const TRELLO_BASE = "https://api.trello.com/1";
const PROCESSED_LABEL_NAME = "automated:processed";

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--")) {
      console.error(`Unexpected argument: ${argv[i]}`);
      process.exit(1);
    }
    const key = argv[i]
      .replace(/^--/, "")
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    args[key] = argv[i + 1];
  }

  return args;
}

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

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function moveCard(cardId, listId) {
  await trelloFetch(`/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify({ idList: listId }),
  });
  console.log(`Moved card to list ${listId}`);
}

async function addComment(cardId, text) {
  await trelloFetch(`/cards/${cardId}/actions/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  console.log("Added comment to card");
}

async function addAttachment(cardId, url, name) {
  await trelloFetch(`/cards/${cardId}/attachments`, {
    method: "POST",
    body: JSON.stringify({ url, name }),
  });
  console.log(`Attached "${name}" to card`);
}

async function removeProcessedLabel(cardId) {
  try {
    // Get card details to find its board
    const card = await trelloFetch(`/cards/${cardId}`);
    const labels = await trelloFetch(`/boards/${card.idBoard}/labels`);
    const processedLabel = labels.find((l) => l.name === PROCESSED_LABEL_NAME);

    if (processedLabel && card.idLabels.includes(processedLabel.id)) {
      await trelloFetch(`/cards/${cardId}/idLabels/${processedLabel.id}`, {
        method: "DELETE",
      });
      console.log(`Removed "${PROCESSED_LABEL_NAME}" label (allows retry)`);
    }
  } catch (err) {
    console.warn(`Warning: could not remove processed label: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.error("Missing TRELLO_API_KEY or TRELLO_TOKEN environment variables.");
    process.exit(1);
  }

  const args = parseArgs();
  const { cardId, listId, status, prUrl, errorMessage } = args;

  if (!cardId || !status) {
    console.error("Required arguments: --card-id, --status (success|error)");
    process.exit(1);
  }

  console.log(`Updating card ${cardId} — status: ${status}`);

  // Move card to the target list
  if (listId) {
    await moveCard(cardId, listId);
  }

  if (status === "success") {
    if (!prUrl) {
      console.error("--pr-url is required for success status.");
      process.exit(1);
    }

    // Add PR link as comment
    await addComment(
      cardId,
      `PR created and CI passing:\n${prUrl}\n\nReady for human review.`
    );

    // Attach PR URL to card
    await addAttachment(cardId, prUrl, "Pull Request");

  } else if (status === "error") {
    const message = errorMessage || "Unknown error";

    // Add error comment
    await addComment(
      cardId,
      `Automation failed after max retries:\n\`\`\`\n${message}\n\`\`\`\n\nMove this card back to "Ready for Dev" to retry.`
    );

    // Remove processed label so card can be retried
    await removeProcessedLabel(cardId);

  } else {
    console.error(`Unknown status: "${status}". Use "success" or "error".`);
    process.exit(1);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
