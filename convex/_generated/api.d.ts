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
import type * as channels from "../channels.js";
import type * as cleanup from "../cleanup.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as diagAuth from "../diagAuth.js";
import type * as emails_components_button from "../emails/components/button.js";
import type * as emails_components_layout from "../emails/components/layout.js";
import type * as emails_invitation from "../emails/invitation.js";
import type * as emails_password_reset from "../emails/password_reset.js";
import type * as emails_verification from "../emails/verification.js";
import type * as engine from "../engine.js";
import type * as files from "../files.js";
import type * as flows from "../flows.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_planLimits from "../lib/planLimits.js";
import type * as lib_stripePlans from "../lib/stripePlans.js";
import type * as lib_templateBuilder from "../lib/templateBuilder.js";
import type * as lib_templateTypes from "../lib/templateTypes.js";
import type * as lib_templateValidation from "../lib/templateValidation.js";
import type * as lib_visibility from "../lib/visibility.js";
import type * as messages from "../messages.js";
import type * as migration from "../migration.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as payment_actions from "../payment_actions.js";
import type * as payments from "../payments.js";
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
  channels: typeof channels;
  cleanup: typeof cleanup;
  contacts: typeof contacts;
  conversations: typeof conversations;
  credits: typeof credits;
  crons: typeof crons;
  debug: typeof debug;
  diagAuth: typeof diagAuth;
  "emails/components/button": typeof emails_components_button;
  "emails/components/layout": typeof emails_components_layout;
  "emails/invitation": typeof emails_invitation;
  "emails/password_reset": typeof emails_password_reset;
  "emails/verification": typeof emails_verification;
  engine: typeof engine;
  files: typeof files;
  flows: typeof flows;
  http: typeof http;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/email": typeof lib_email;
  "lib/permissions": typeof lib_permissions;
  "lib/planLimits": typeof lib_planLimits;
  "lib/stripePlans": typeof lib_stripePlans;
  "lib/templateBuilder": typeof lib_templateBuilder;
  "lib/templateTypes": typeof lib_templateTypes;
  "lib/templateValidation": typeof lib_templateValidation;
  "lib/visibility": typeof lib_visibility;
  messages: typeof messages;
  migration: typeof migration;
  notifications: typeof notifications;
  organizations: typeof organizations;
  payment_actions: typeof payment_actions;
  payments: typeof payments;
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

export declare const components: {};
