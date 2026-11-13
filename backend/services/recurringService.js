import pool from '../config/db.js';

export const getRecurringTransactions = async (userId) => {
  const query = `
    SELECT 
      r.id,
      r.user_id,
      r.category_id,
      r.title,
      r.amount,
      r.type,
      r.frequency,
      DATE_FORMAT(r.start_date, '%Y-%m-%d') as start_date,
      DATE_FORMAT(r.next_date, '%Y-%m-%d') as next_date,
      DATE_FORMAT(r.last_processed_date, '%Y-%m-%d') as last_processed_date,
      r.status,
      r.description,
      r.created_at,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM recurring_transactions r
    JOIN categories c ON r.category_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.next_date ASC
  `;

  const [rows] = await pool.query(query, [userId]);
  return rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));
};

export const createRecurringTransaction = async (userId, data) => {
  const { title, amount, type, category_id, frequency, start_date, description = '' } = data;

  if (!title || !title.trim()) {
    const error = new Error('Title is required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  if (!['income', 'expense'].includes(type)) {
    const error = new Error('Type must be income or expense.');
    error.statusCode = 400;
    throw error;
  }

  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
    const error = new Error('Frequency must be daily, weekly, monthly, or yearly.');
    error.statusCode = 400;
    throw error;
  }

  const startDateStr = start_date || new Date().toISOString().substring(0, 10);
  const nextDateStr = startDateStr; // First occurrence on start date

  const [result] = await pool.query(
    `INSERT INTO recurring_transactions 
      (user_id, category_id, title, amount, type, frequency, start_date, next_date, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    [userId, category_id, title.trim(), parsedAmount, type, frequency, startDateStr, nextDateStr, description ? description.trim() : '']
  );

  return { id: result.insertId, ...data };
};

export const updateRecurringTransaction = async (userId, id, data) => {
  const [existing] = await pool.query('SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ?', [id, userId]);
  if (existing.length === 0) {
    const error = new Error('Recurring transaction not found.');
    error.statusCode = 404;
    throw error;
  }

  const { title, amount, status, frequency, next_date } = data;
  const updates = [];
  const params = [];

  if (title) {
    updates.push('title = ?');
    params.push(title.trim());
  }
  if (amount !== undefined) {
    updates.push('amount = ?');
    params.push(parseFloat(amount));
  }
  if (status && ['active', 'paused', 'completed'].includes(status)) {
    updates.push('status = ?');
    params.push(status);
  }
  if (frequency && ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
    updates.push('frequency = ?');
    params.push(frequency);
  }
  if (next_date) {
    updates.push('next_date = ?');
    params.push(next_date);
  }

  if (updates.length > 0) {
    params.push(id, userId);
    await pool.query(`UPDATE recurring_transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  }

  const [updated] = await pool.query('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
  return updated[0];
};

export const deleteRecurringTransaction = async (userId, id) => {
  const [existing] = await pool.query('SELECT id FROM recurring_transactions WHERE id = ? AND user_id = ?', [id, userId]);
  if (existing.length === 0) {
    const error = new Error('Recurring transaction not found.');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?', [id, userId]);
  return { message: 'Recurring transaction removed successfully.' };
};

/**
 * Process due recurring transactions and advance next_date safely without duplicate generation
 */
export const processDueRecurringTransactions = async (userId) => {
  const today = new Date().toISOString().substring(0, 10);

  const [dueItems] = await pool.query(
    `SELECT * FROM recurring_transactions 
     WHERE user_id = ? AND status = 'active' AND next_date <= ?`,
    [userId, today]
  );

  let processedCount = 0;

  for (const item of dueItems) {
    // Generate transaction in transactions table
    await pool.query(
      `INSERT INTO transactions (user_id, category_id, title, amount, type, date, payment_method, description)
       VALUES (?, ?, ?, ?, ?, ?, 'Recurring Auto-Log', ?)`,
      [item.user_id, item.category_id, item.title, item.amount, item.type, item.next_date, item.description || 'Auto-generated recurring payment']
    );

    // Compute next execution date based on frequency
    const nextDate = new Date(item.next_date);
    if (item.frequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (item.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (item.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (item.frequency === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const nextDateStr = nextDate.toISOString().substring(0, 10);

    // Update recurring record
    await pool.query(
      `UPDATE recurring_transactions 
       SET last_processed_date = ?, next_date = ? 
       WHERE id = ?`,
      [item.next_date, nextDateStr, item.id]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        userId,
        `Recurring Bill Processed: ${item.title}`,
        `Your scheduled ${item.frequency} ${item.type} of $${parseFloat(item.amount).toFixed(2)} for "${item.title}" was automatically recorded.`,
      ]
    );

    processedCount++;
  }

  return { processedCount };
};
