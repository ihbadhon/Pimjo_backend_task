import { writeAuditLog } from "../services/service.js";

const WINDOW_MS = 10 * 1000;
const LIMIT = 10;
const ipStore = new Map();

const MaxReqCheck = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  const timestamps = ipStore.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  recent.push(now);

  ipStore.set(ip, recent);

  if (recent.length > LIMIT) {
    writeAuditLog({
      ip,
      endpoint: req.originalUrl,
      status: "blocked",
    });

    return res.status(429).json({
      error: "Too many requests. Please try again later.",
    });
  }

  writeAuditLog({
    ip,
    endpoint: req.originalUrl,
    status: "allowed",
  });

  next();
};

export default MaxReqCheck;
