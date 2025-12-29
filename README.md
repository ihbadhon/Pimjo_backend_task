# Rate Limiting API - Pimjo Assignment

A Node.js Express API with IP-based rate limiting and comprehensive audit logging.

## Project Overview

This project implements a rate-limited API endpoint that tracks and restricts requests based on IP addresses. It includes real-time logging to files and periodic batch uploads to MongoDB for persistent storage and analytics.

## Features

- ✅ IP-based rate limiting (10 requests per 10 seconds)
- ✅ Real-time audit logging to file system
- ✅ Periodic batch upload of logs to MongoDB
- ✅ Express.js REST API
- ✅ Automated testing script included

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** (v5.2.1) - Web framework
- **MongoDB** (v7.0.0) - NoSQL database with official Node.js driver
- **MongoDB Atlas** - Cloud-hosted database service
- **dotenv** (v17.2.3) - Environment variable management
- **File System (fs)** - Node.js built-in module for local log buffering
- **Nodemon** - Development server with auto-restart

## How to Run the Project

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/ihbadhon/Pimjo_backend_task.git
   cd Pimjo_Assignment
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following:

   ```env
   PORT=5000
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   ```
 ***You can use this for testing purpose***
   ```
   DB_USER = Pimjo_Database
   DB_PASS = IQ2Fyot5BNN00KPt
   ```

4. **Start the server**

   ```bash
   npm start
   ```

   The server will start on `http://localhost:5000`

5. **Test the rate limiting** (optional)

   In a new terminal:

   ```bash
   node test-rate-limit.js
   ```

## API Endpoints

### POST `/api/action`

A simple action endpoint protected by rate limiting.

**Request:**

```bash
curl -X POST http://localhost:5000/api/action \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Success Response (200):**

```json
{
  "message": "Operation completed successfully"
}
```

**Rate Limit Exceeded Response (429):**

```json
{
  "error": "Too many requests. Please try again later."
}
```

## Rate Limiting Rules

### Configuration

- **Window:** 60 seconds (60,000 milliseconds)
- **Limit:** 10 requests per window
- **Tracking Method:** IP address-based
- **Implementation:** In-memory Map storage

### How It Works

1. Each incoming request is tracked by the client's IP address
2. The system maintains a sliding window of timestamps for each IP
3. When a request arrives:
   - Old timestamps outside the 10-second window are removed
   - The current timestamp is added to the list
   - If the count exceeds 10 requests, the request is blocked
4. All requests (allowed and blocked) are logged for audit purposes

### Example Scenario

```
Time: 0s  → Request 1-10: ✅ Allowed (200 OK)
Time: 5s  → Request 11:    ❌ Blocked (429 Too Many Requests)
Time: 11s → Request 12:    ✅ Allowed (first request expired from window)
```

## Storage Choice and Reasoning

### Hybrid Storage Approach

This project uses a **two-tier storage strategy** combining file-based buffering with MongoDB persistence:

#### 1. In-Memory Rate Limiting (Map)

- **Purpose:** Track request timestamps for rate limiting
- **Why:** Ultra-fast lookups (O(1)) for real-time rate limit checks
- **Tradeoff:** Data lost on server restart, but acceptable since rate limits reset anyway

#### 2. File-Based Log Buffer

- **Purpose:** Immediate audit log writes without blocking requests
- **Location:** `logs/audit.log`
- **Why:**
  - Non-blocking I/O for fast request processing
  - Resilient against database connection issues
  - Acts as a buffer for batch uploads
- **Tradeoff:** Logs could be lost if server crashes before upload, mitigated by frequent uploads

#### 3. MongoDB (Atlas) - Persistent Storage

- **Purpose:** Long-term storage and analytics
- **Collection:** `PimjoLogger.Logs`
- **Upload Frequency:** Every 60 seconds
- **Why:**
  - Scalable for large audit log volumes
  - Enables complex queries and analytics
  - Cloud-based (Atlas) ensures high availability
  - Document model fits JSON log structure perfectly
- **Tradeoff:** Network latency and cost, mitigated by batch uploads

### Why This Architecture?

| Requirement         | Solution             | Benefit                          |
| ------------------- | -------------------- | -------------------------------- |
| Fast rate limiting  | In-memory Map        | Sub-millisecond lookups          |
| Request performance | File buffering       | Non-blocking writes              |
| Data persistence    | MongoDB batch upload | Durable storage + analytics      |
| Failure resilience  | File backup system   | Logs preserved during DB outages |

## Assumptions and Tradeoffs

### Assumptions

1. **Single Server Deployment**

   - Rate limiting is per-server instance
   - For distributed systems, would need Redis or similar shared storage

2. **IP Address Reliability**

   - Assumes `req.ip` accurately represents the client
   - May need `trust proxy` setting if behind load balancers

3. **Log Retention**

   - No automatic log cleanup implemented
   - MongoDB collection grows indefinitely (consider TTL indexes in production)

4. **Network Reliability**
   - MongoDB Atlas connection assumed to be stable
   - Temporary outages handled gracefully with file backup

### Tradeoffs

#### 1. **Memory vs Persistence (Rate Limit Store)**

- ✅ **Chosen:** In-memory Map
- ❌ **Alternative:** Redis or database storage
- **Reason:** Simplicity and speed for MVP; rate limit data is temporary anyway

#### 2. **Real-time vs Batch Logging**

- ✅ **Chosen:** File buffer + batch upload (60s interval)
- ❌ **Alternative:** Direct database writes per request
- **Reason:** Better performance; acceptable 60s delay for analytics

#### 3. **Sliding Window vs Fixed Window**

- ✅ **Chosen:** Sliding window
- ❌ **Alternative:** Fixed time buckets
- **Reason:** More accurate rate limiting, prevents burst at window edges

#### 4. **IP-based vs Token-based Authentication**

- ✅ **Chosen:** IP-based rate limiting
- ❌ **Alternative:** API keys or user authentication
- **Reason:** Simpler implementation; sufficient for public endpoints

#### 5. **MongoDB vs SQL Database**

- ✅ **Chosen:** MongoDB
- ❌ **Alternative:** PostgreSQL/MySQL
- **Reason:** JSON log structure fits document model; no relational queries needed

## Project Structure

```
Pimjo_Assignment/
├── index.js                 # Main application entry point
├── package.json             # Dependencies and scripts
├── test-rate-limit.js       # Automated testing script
├── config/
│   └── env.js              # Environment configuration loader
├── logs/
│   └── audit.log           # Temporary audit log buffer
├── middleware/
│   └── MaxReqCheck.js      # Rate limiting middleware
├── routes/
│   └── Router.js           # API route definitions
├── services/
│   └── service.js          # Audit log writing service
└── Utils/
    └── logger.js           # MongoDB log upload utility
```

## Testing

The included `test-rate-limit.js` script sends 15 requests to test the rate limiting:

```bash
node test-rate-limit.js
```

**Expected Result:**

- First 10 requests: `200 OK`
- Next 5 requests: `429 Too Many Requests`

## Monitoring and Logs

### File Logs

- Location: `logs/audit.log`
- Format: NDJSON (newline-delimited JSON)
- Rotation: Every 60 seconds (uploaded then deleted)

### MongoDB Logs

- Database: `PimjoLogger`
- Collection: `Logs`
- Fields:
  ```json
  {
    "ip": "::1",
    "endpoint": "/api/action",
    "timestamp": "2025-12-29T10:30:45.123Z",
    "status": "allowed" | "blocked"
  }
  ```
