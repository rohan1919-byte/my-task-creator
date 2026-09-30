import mongoose from 'mongoose';
import config from './config.js';

export async function connectDB() {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and add your MongoDB Atlas connection string.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
}
