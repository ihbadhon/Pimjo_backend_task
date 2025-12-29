import fs from "fs";
import path from "path";

// Define where we'll store our audit logs
const LOG_DIR = "logs";
const LOG_FILE = path.join(LOG_DIR, "audit.log");

// Make sure the logs directory exists before we try to write to it
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

/**
 * Writes an audit log entry to our log file
 * We track the IP, endpoint, status, and when the request happened
 */
export function writeAuditLog({ ip, endpoint, status }) {
  try {
    // Open the log file in append mode so we don't overwrite existing logs
    const stream = fs.createWriteStream(LOG_FILE, { flags: "a" });

    // Build our log entry with all the important details
    const logEntry = {
      ip,
      endpoint,
      timestamp: new Date().toISOString(),
      status,
    };

    // Write it out as JSON, one entry per line for easy parsing later
    stream.write(JSON.stringify(logEntry) + "\n");

    // Clean up the stream when we're done
    stream.end();
  } catch (error) {
    // If something goes wrong, at least log it to console
    console.error("Failed to write audit log:", error.message);
  }
}
