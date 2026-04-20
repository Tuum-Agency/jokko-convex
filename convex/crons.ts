/**
 *   ____                      
 *  / ___|_ __ ___  _ __  ___  
 * | |   | '__/ _ \| '_ \/ __| 
 * | |___| | | (_) | | | \__ \ 
 *  \____|_|  \___/|_| |_|___/ 
 *
 * CRON JOBS
 *
 * Scheduled tasks for the application.
 * - check-presence-timeouts: Runs every minute to mark inactive users as OFFLINE
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check presence timeouts every minute
crons.interval("check-presence-timeouts", { minutes: 1 }, internal.presence.checkTimeouts);

// Process scheduled broadcasts every minute
crons.interval("process-scheduled-broadcasts", { minutes: 1 }, internal.broadcasts.processScheduled);

// Expire stale payment sessions every 5 minutes
crons.interval("expire-payment-sessions", { minutes: 5 }, internal.payments.expirePaymentSessions);

// Drain CRM sync queue every 20 seconds (pushes conversation events to CRMs)
crons.interval("crm-dispatcher-tick", { seconds: 20 }, internal.crm.dispatcher.runTick);

// Poll active CRM connections for delta sync every minute
crons.interval("crm-poller-tick", { minutes: 1 }, internal.crm.poller.runTick);

// Purge crmContactLinks for CRMs disconnected more than 7 days ago
// (matches the grace period advertised in DisconnectDialog).
crons.daily(
    "crm-contact-links-purge",
    { hourUTC: 3, minuteUTC: 30 },
    internal.crm.contactLinks.purgeStaleLinks,
);

// Expire ringing calls that were never answered (60s timeout) -> MISSED
crons.interval("expire-missed-calls", { minutes: 1 }, internal.calls.expireMissedCalls);

export default crons;
