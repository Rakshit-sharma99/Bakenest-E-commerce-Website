import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = await User.create({ name, email: email.toLowerCase(), password, role: 'customer' });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id, user.role),
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id, user.role),
  });
};

import { OAuth2Client } from 'google-auth-library';

export const me = async (req, res) => {
  return res.json({ user: req.user });
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'No Google credential provided' });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create user without password since they use Google
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-10), // dummy password
        role: 'customer'
      });
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Google verification/registration failed:', error);
    return res.status(401).json({ message: `Google Error: ${error.message}` });
  }
};
