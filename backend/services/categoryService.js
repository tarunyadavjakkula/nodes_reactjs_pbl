import pool from '../config/db.js';

export const getCategories = async (userId, type = null) => {
  let query = `
    SELECT id, user_id, name, type, icon, color, is_default, created_at 
    FROM categories 
    WHERE (user_id IS NULL OR user_id = ?)
  `;
  const params = [userId];

  if (type && ['income', 'expense'].includes(type)) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY is_default DESC, name ASC';

  const [rows] = await pool.query(query, params);
  return rows;
};

export const createCategory = async (userId, { name, type, icon = 'Tag', color = '#6366F1' }) => {
  if (!name || !name.trim()) {
    const error = new Error('Category name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!type || !['income', 'expense'].includes(type)) {
    const error = new Error('Category type must be either income or expense.');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate category name for this user (or global)
  const [existing] = await pool.query(
    'SELECT id FROM categories WHERE (user_id = ? OR user_id IS NULL) AND LOWER(name) = LOWER(?) AND type = ?',
    [userId, name.trim(), type]
  );

  if (existing.length > 0) {
    const error = new Error(`A category named "${name.trim()}" already exists for ${type}.`);
    error.statusCode = 409;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, FALSE)',
    [userId, name.trim(), type, icon, color]
  );

  const [newCat] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  return newCat[0];
};

export const updateCategory = async (userId, categoryId, { name, icon, color }) => {
  // Check if category belongs to user and is not a default system category
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
  if (rows.length === 0) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const cat = rows[0];
  if (cat.is_default || cat.user_id !== userId) {
    const error = new Error('Default system categories cannot be modified.');
    error.statusCode = 403;
    throw error;
  }

  const updates = [];
  const params = [];

  if (name && name.trim()) {
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (icon) {
    updates.push('icon = ?');
    params.push(icon);
  }
  if (color) {
    updates.push('color = ?');
    params.push(color);
  }

  if (updates.length > 0) {
    params.push(categoryId, userId);
    await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  }

  const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
  return updated[0];
};

export const deleteCategory = async (userId, categoryId) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
  if (rows.length === 0) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const cat = rows[0];
  if (cat.is_default || cat.user_id !== userId) {
    const error = new Error('Default system categories cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }

  // Check if transactions are using this category
  const [txs] = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND user_id = ?', [categoryId, userId]);
  if (txs[0].count > 0) {
    const error = new Error(`Cannot delete category because it has ${txs[0].count} transaction(s) associated with it.`);
    error.statusCode = 400;
    throw error;
  }

  await pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
  return { message: 'Category deleted successfully.' };
};
