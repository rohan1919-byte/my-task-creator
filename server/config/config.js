import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const hour = Number(process.env.DUE_DATE_REMINDER_HOUR ?? 8);

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  userName: process.env.USER_NAME || 'Rohan',
  timezone: 'Asia/Kolkata',
  dueDateReminderHour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 8,
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
