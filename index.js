import express from "express";
import "./config/env.js";
import routes from "./routes/Router.js";
import { saveLogs } from "./Utils/logger.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/api", routes);

// Save logs to database every minute
setInterval(saveLogs, 60000);
saveLogs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
