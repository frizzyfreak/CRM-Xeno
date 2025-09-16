// backend/server.js
import app from './app.js';
import config from './config/env.js';
import { initRedis } from './services/redis.js';
import { initKafka } from './services/kafka.js';

const PORT = config.port || 5000;

// Initialize services
const startServer = async () => {
  try {
    await initRedis();
    await initKafka();
    
    app.listen(PORT, () => {
      console.log(`Xeno CRM Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});