import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const registerUser = async ({ name, email, password, currency = 'INR' }) => {
  // Check if email already registered
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length > 0) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password securely with bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user into users table
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, currency, theme) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), email.toLowerCase().trim(), hashedPassword, currency, 'light']
  );

  const userId = result.insertId;

  // Insert welcome notification for the new user
  await pool.query(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [
      userId,
      'Welcome to SpendWise!',
      'Your account is successfully created. Start by creating categories or adding your first income and expense transaction.',
      'success',
    ]
  );

  // Generate JWT token
  const token = jwt.sign(
    { id: userId, email: email.toLowerCase().trim() },
    process.env.JWT_SECRET || 'spendwise_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      currency,
      theme: 'light',
    },
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  // Query user with password hash
  const [users] = await pool.query(
    'SELECT id, name, email, password, currency, theme FROM users WHERE email = ?',
    [email.toLowerCase().trim()]
  );

  if (users.length === 0) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const user = users[0];

  // Verify bcrypt password hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'spendwise_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      theme: user.theme,
    },
    token,
  };
};

export const getUserProfile = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, currency, theme, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
};

export const updateUserProfile = async (userId, { name, currency, theme }) => {
  const updates = [];
  const params = [];

  if (name && name.trim()) {
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (currency && currency.trim()) {
    updates.push('currency = ?');
    params.push(currency.trim());
  }
  if (theme && ['light', 'dark'].includes(theme)) {
    updates.push('theme = ?');
    params.push(theme);
  }

  if (updates.length === 0) {
    return getUserProfile(userId);
  }

  params.push(userId);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  return getUserProfile(userId);
};

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
  if (!isMatch) {
    const error = new Error('Current password does not match our records.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

  return { message: 'Password updated successfully.' };
};

