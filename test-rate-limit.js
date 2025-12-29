import http from "http";

const API_URL = "http://localhost:5000/api/action";
const NUM_REQUESTS = 15;

function makeRequest(num) {
  return new Promise((resolve) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`Request ${num}: ${res.statusCode} - ${data}`);
        resolve({ num, statusCode: res.statusCode, body: data });
      });
    });

    req.on("error", (error) => {
      console.log(`Request ${num} failed: ${error.message}`);
      resolve({ num, error: error.message });
    });

    req.write(JSON.stringify({ test: "data" }));
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRateLimit() {
  console.log("Testing rate limit (10 requests per 60 seconds)...\n");

  const results = [];
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    const result = await makeRequest(i);
    results.push(result);
    await wait(100);
  }

  const success = results.filter((r) => r.statusCode === 200).length;
  const blocked = results.filter((r) => r.statusCode === 429).length;

  console.log(`\nResults: ${success} successful, ${blocked} blocked`);
  console.log("Test complete!");
}

testRateLimit().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
