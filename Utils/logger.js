import fs from "fs";
import { MongoClient } from "mongodb";

const MONGO_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0rns9j.mongodb.net/?appName=Cluster0`;
const LOG_FILE = "logs/audit.log";

if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const mongoClient = new MongoClient(MONGO_URI);
let isConnected = false;

async function connectToMongo() {
  if (!isConnected) {
    await mongoClient.connect();
    isConnected = true;
    console.log("Connected to MongoDB");
  }
}

export async function saveLogs() {
  if (!fs.existsSync(LOG_FILE)) return;

  const backupFile = `logs/audit-${Date.now()}.log`;

  try {
    fs.renameSync(LOG_FILE, backupFile);
  } catch (error) {
    return;
  }

  const content = fs.readFileSync(backupFile, "utf8");

  if (!content.trim()) {
    fs.unlinkSync(backupFile);
    return;
  }

  const logEntries = content
    .trim()
    .split("\n")
    .map((e) => JSON.parse(e));

  try {
    await connectToMongo();
    const collection = mongoClient.db("PimjoLogger").collection("Logs");
    await collection.insertMany(logEntries, { ordered: false });
    fs.unlinkSync(backupFile);
  } catch (error) {
    console.error("Failed to save logs:", error.message);
  }
}
