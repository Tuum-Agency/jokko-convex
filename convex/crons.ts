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

export default crons;
