import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = 'admin';
    existing.password = password;
    await existing.save();
    console.log('Existing user updated to admin.');
  } else {
    await User.create({
      name: 'BakeNest Admin',
      email: email.toLowerCase(),
      password,
      role: 'admin',
    });
    console.log('Admin user created.');
  }

  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
