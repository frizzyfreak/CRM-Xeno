// backend/config/env.js
const config = {
  development: {
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/xeno_crm',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'xeno-crm-secret-key'
  },
  production: {
    port: process.env.PORT,
    mongodbUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL,
    kafkaBrokers: process.env.KAFKA_BROKERS,
    frontendUrl: process.env.FRONTEND_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: process.env.JWT_SECRET
  }
};

export default config[process.env.NODE_ENV || 'development'];