require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[LifeLink] Backend server listening on port ${PORT}`);
    console.log(`[LifeLink] Health check available at http://localhost:${PORT}/api/health`);
  });
};

startServer();
