/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as broadcasts from "../broadcasts.js";
import type * as call_actions from "../call_actions.js";
import type * as calls from "../calls.js";
import type * as channels from "../channels.js";
import type * as cleanup from "../cleanup.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as credits from "../credits.js";
import type * as crm_adapters_axonaut_index from "../crm/adapters/axonaut/index.js";
import type * as crm_adapters_axonaut_rest from "../crm/adapters/axonaut/rest.js";
import type * as crm_adapters_hubspot_index from "../crm/adapters/hubspot/index.js";
import type * as crm_adapters_hubspot_rest from "../crm/adapters/hubspot/rest.js";
import type * as crm_adapters_nocrm_index from "../crm/adapters/nocrm/index.js";
import type * as crm_adapters_nocrm_rest from "../crm/adapters/nocrm/rest.js";
import type * as crm_adapters_pipedrive_index from "../crm/adapters/pipedrive/index.js";
import type * as crm_adapters_pipedrive_rest from "../crm/adapters/pipedrive/rest.js";
import type * as crm_adapters_salesforce_index from "../crm/adapters/salesforce/index.js";
import type * as crm_adapters_salesforce_rest from "../crm/adapters/salesforce/rest.js";
import type * as crm_adapters_sellsy_index from "../crm/adapters/sellsy/index.js";
import type * as crm_adapters_sellsy_rest from "../crm/adapters/sellsy/rest.js";
import type * as crm_admin from "../crm/admin.js";
import type * as crm_apikey from "../crm/apikey.js";
import type * as crm_connections from "../crm/connections.js";
import type * as crm_contactLinks from "../crm/contactLinks.js";
import type * as crm_core_constants from "../crm/core/constants.js";
import type * as crm_core_errors from "../crm/core/errors.js";
import type * as crm_core_externalUrls from "../crm/core/externalUrls.js";
import type * as crm_core_logger from "../crm/core/logger.js";
import type * as crm_core_mapping from "../crm/core/mapping.js";
import type * as crm_core_oauth from "../crm/core/oauth.js";
import type * as crm_core_providers from "../crm/core/providers.js";
import type * as crm_core_types from "../crm/core/types.js";
import type * as crm_dispatcher from "../crm/dispatcher.js";
import type * as crm_enqueue from "../crm/enqueue.js";
import type * as crm_importer from "../crm/importer.js";
import type * as crm_oauth from "../crm/oauth.js";
import type * as crm_optin from "../crm/optin.js";
import type * as crm_poller from "../crm/poller.js";
import type * as crm_registry from "../crm/registry.js";
import type * as crm_seed from "../crm/seed.js";
import type * as crm_webhooks from "../crm/webhooks.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as diagAuth from "../diagAuth.js";
import type * as emails_components_button from "../emails/components/button.js";
import type * as emails_components_layout from "../emails/components/layout.js";
import type * as emails_invitation from "../emails/invitation.js";
import type * as emails_password_reset from "../emails/password_reset.js";
import type * as emails_verification from "../emails/verification.js";
import type * as engine from "../engine.js";
import type * as facebook from "../facebook.js";
import type * as files from "../files.js";
import type * as flows from "../flows.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_encryptionMigration from "../lib/encryptionMigration.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_planHelpers from "../lib/planHelpers.js";
import type * as lib_planLimits from "../lib/planLimits.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_stripePlans from "../lib/stripePlans.js";
import type * as lib_templateBuilder from "../lib/templateBuilder.js";
import type * as lib_templateTypes from "../lib/templateTypes.js";
import type * as lib_templateValidation from "../lib/templateValidation.js";
import type * as lib_templateValidators from "../lib/templateValidators.js";
import type * as lib_visibility from "../lib/visibility.js";
import type * as messages from "../messages.js";
import type * as migration from "../migration.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as payment_actions from "../payment_actions.js";
import type * as payments from "../payments.js";
import type * as plans from "../plans.js";
import type * as poles from "../poles.js";
import type * as presence from "../presence.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as shortcuts from "../shortcuts.js";
import type * as stripe from "../stripe.js";
import type * as stripe_actions from "../stripe_actions.js";
import type * as syncUser from "../syncUser.js";
import type * as tags from "../tags.js";
import type * as team from "../team.js";
import type * as teams from "../teams.js";
import type * as templates_actions from "../templates/actions.js";
import type * as templates_mutations from "../templates/mutations.js";
import type * as templates_queries from "../templates/queries.js";
import type * as templates_webhooks from "../templates/webhooks.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as waitingList from "../waitingList.js";
import type * as webhook from "../webhook.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsapp_actions from "../whatsapp_actions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analytics: typeof analytics;
  assignments: typeof assignments;
  auth: typeof auth;
  billing: typeof billing;
  broadcasts: typeof broadcasts;
  call_actions: typeof call_actions;
  calls: typeof calls;
  channels: typeof channels;
  cleanup: typeof cleanup;
  contacts: typeof contacts;
  conversations: typeof conversations;
  credits: typeof credits;
  "crm/adapters/axonaut/index": typeof crm_adapters_axonaut_index;
  "crm/adapters/axonaut/rest": typeof crm_adapters_axonaut_rest;
  "crm/adapters/hubspot/index": typeof crm_adapters_hubspot_index;
  "crm/adapters/hubspot/rest": typeof crm_adapters_hubspot_rest;
  "crm/adapters/nocrm/index": typeof crm_adapters_nocrm_index;
  "crm/adapters/nocrm/rest": typeof crm_adapters_nocrm_rest;
  "crm/adapters/pipedrive/index": typeof crm_adapters_pipedrive_index;
  "crm/adapters/pipedrive/rest": typeof crm_adapters_pipedrive_rest;
  "crm/adapters/salesforce/index": typeof crm_adapters_salesforce_index;
  "crm/adapters/salesforce/rest": typeof crm_adapters_salesforce_rest;
  "crm/adapters/sellsy/index": typeof crm_adapters_sellsy_index;
  "crm/adapters/sellsy/rest": typeof crm_adapters_sellsy_rest;
  "crm/admin": typeof crm_admin;
  "crm/apikey": typeof crm_apikey;
  "crm/connections": typeof crm_connections;
  "crm/contactLinks": typeof crm_contactLinks;
  "crm/core/constants": typeof crm_core_constants;
  "crm/core/errors": typeof crm_core_errors;
  "crm/core/externalUrls": typeof crm_core_externalUrls;
  "crm/core/logger": typeof crm_core_logger;
  "crm/core/mapping": typeof crm_core_mapping;
  "crm/core/oauth": typeof crm_core_oauth;
  "crm/core/providers": typeof crm_core_providers;
  "crm/core/types": typeof crm_core_types;
  "crm/dispatcher": typeof crm_dispatcher;
  "crm/enqueue": typeof crm_enqueue;
  "crm/importer": typeof crm_importer;
  "crm/oauth": typeof crm_oauth;
  "crm/optin": typeof crm_optin;
  "crm/poller": typeof crm_poller;
  "crm/registry": typeof crm_registry;
  "crm/seed": typeof crm_seed;
  "crm/webhooks": typeof crm_webhooks;
  crons: typeof crons;
  debug: typeof debug;
  diagAuth: typeof diagAuth;
  "emails/components/button": typeof emails_components_button;
  "emails/components/layout": typeof emails_components_layout;
  "emails/invitation": typeof emails_invitation;
  "emails/password_reset": typeof emails_password_reset;
  "emails/verification": typeof emails_verification;
  engine: typeof engine;
  facebook: typeof facebook;
  files: typeof files;
  flows: typeof flows;
  http: typeof http;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/email": typeof lib_email;
  "lib/encryption": typeof lib_encryption;
  "lib/encryptionMigration": typeof lib_encryptionMigration;
  "lib/permissions": typeof lib_permissions;
  "lib/planHelpers": typeof lib_planHelpers;
  "lib/planLimits": typeof lib_planLimits;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/stripePlans": typeof lib_stripePlans;
  "lib/templateBuilder": typeof lib_templateBuilder;
  "lib/templateTypes": typeof lib_templateTypes;
  "lib/templateValidation": typeof lib_templateValidation;
  "lib/templateValidators": typeof lib_templateValidators;
  "lib/visibility": typeof lib_visibility;
  messages: typeof messages;
  migration: typeof migration;
  notifications: typeof notifications;
  organizations: typeof organizations;
  payment_actions: typeof payment_actions;
  payments: typeof payments;
  plans: typeof plans;
  poles: typeof poles;
  presence: typeof presence;
  search: typeof search;
  seed: typeof seed;
  sessions: typeof sessions;
  shortcuts: typeof shortcuts;
  stripe: typeof stripe;
  stripe_actions: typeof stripe_actions;
  syncUser: typeof syncUser;
  tags: typeof tags;
  team: typeof team;
  teams: typeof teams;
  "templates/actions": typeof templates_actions;
  "templates/mutations": typeof templates_mutations;
  "templates/queries": typeof templates_queries;
  "templates/webhooks": typeof templates_webhooks;
  tickets: typeof tickets;
  users: typeof users;
  utils: typeof utils;
  waitingList: typeof waitingList;
  webhook: typeof webhook;
  whatsapp: typeof whatsapp;
  whatsapp_actions: typeof whatsapp_actions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
