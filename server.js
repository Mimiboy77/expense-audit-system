// Load environment variables first before anything else
require("dotenv").config();

const app = require("./app");         // Configured Express app
const connectDB = require("./config/db"); // MongoDB connection
const { startCronJobs } = require("./utils/cronJobs"); // Import cron jobs
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start the server
connectDB().then(() => {
  // Start cron jobs only after DB is connected
  // so the jobs can safely query models
  startCronJobs();
  logger.info("Cron jobs registered and running");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
