import pool from '../config/db.js';

/**
 * Checks if an expense transaction causes a budget warning or breach
 */
const checkBudgetThreshold = async (userId, categoryId, transactionDate) => {
  try {
    const month = transactionDate.substring(0, 7); // Format: 'YYYY-MM'

    // Check if budget exists for this category and month
    const [budgets] = await pool.query(
      'SELECT b.*, c.name as category_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ? AND b.category_id = ? AND b.month = ?',
      [userId, categoryId, month]
    );

    if (budgets.length === 0) return;

    const budget = budgets[0];
    const budgetAmount = parseFloat(budget.amount);
    const warningThresholdPercent = parseFloat(budget.warning_threshold) || 80.0;

    // Calculate total spent in this category for this month
    const [spentResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_spent 
       FROM transactions 
       WHERE user_id = ? AND category_id = ? AND type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, categoryId, month]
    );

    const totalSpent = parseFloat(spentResult[0].total_spent);
    const percentageUsed = (totalSpent / budgetAmount) * 100;

    if (percentageUsed >= 100) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          userId,
          `⚠️ Budget Exceeded: ${budget.category_name}`,
          `You have spent $${totalSpent.toFixed(2)} out of your $${budgetAmount.toFixed(2)} budget (${percentageUsed.toFixed(1)}%) for ${budget.category_name} in ${month}.`,
          'danger',
        ]
      );
    } else if (percentageUsed >= warningThresholdPercent) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          userId,
          `⚡ Budget Warning: ${budget.category_name}`,
          `You have reached ${percentageUsed.toFixed(1)}% ($${totalSpent.toFixed(2)} / $${budgetAmount.toFixed(2)}) of your ${budget.category_name} budget for ${month}.`,
          'warning',
        ]
      );
    }
  } catch (err) {
    console.error('Budget threshold check error:', err.message);
  }
};

export const getTransactions = async (userId, options = {}) => {
  const {
    type,
    categoryId,
    category,
    paymentMethod,
    startDate,
    endDate,
    search,
    sortBy = 'date',
    sortOrder = 'DESC',
    page = 1,
    limit = 20,
  } = options;

  let query = `
    SELECT 
      t.id, 
      t.user_id, 
      t.title, 
      t.amount, 
      t.type, 
      DATE_FORMAT(t.date, '%Y-%m-%d') as date, 
      t.payment_method, 
      t.description, 
      t.created_at,
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [userId];

  if (type && ['income', 'expense'].includes(type)) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  if (categoryId) {
    query += ' AND t.category_id = ?';
    params.push(categoryId);
  } else if (category && category.trim()) {
    // Support category name or category id
    if (!isNaN(category)) {
      query += ' AND t.category_id = ?';
      params.push(parseInt(category, 10));
    } else {
      query += ' AND LOWER(c.name) = LOWER(?)';
      params.push(category.trim());
    }
  }

  if (paymentMethod && paymentMethod.trim()) {
    query += ' AND t.payment_method = ?';
    params.push(paymentMethod.trim());
  }

  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }

  if (search && search.trim()) {
    query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  // Count total matching records for pagination
  const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS counted`;
  const [countResult] = await pool.query(countQuery, params);
  const totalRecords = countResult[0].total;

  // Ordering
  const allowedSortFields = ['date', 'amount', 'title', 'created_at'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? `t.${sortBy}` : 't.date';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${safeSortBy} ${safeSortOrder}, t.id DESC`;

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  query += ' LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const [rows] = await pool.query(query, params);

  return {
    transactions: rows,
    pagination: {
      totalRecords,
      currentPage: pageNum,
      totalPages: Math.ceil(totalRecords / limitNum),
      limit: limitNum,
    },
  };
};

export const getTransactionById = async (userId, transactionId) => {
  const query = `
    SELECT 
      t.id, 
      t.user_id, 
      t.title, 
      t.amount, 
      t.type, 
      DATE_FORMAT(t.date, '%Y-%m-%d') as date, 
      t.payment_method, 
      t.description, 
      t.created_at,
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `;
  const [rows] = await pool.query(query, [transactionId, userId]);

  if (rows.length === 0) {
    const error = new Error('Transaction not found or unauthorized access.');
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
};

export const createTransaction = async (userId, data) => {
  const { title, amount, type, date, description = '' } = data;
  const category_id = data.category_id || data.categoryId || data.category;
  const payment_method = data.payment_method || data.paymentMethod || 'Cash';

  if (!title || !title.trim()) {
    const error = new Error('Transaction title is required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Transaction amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  if (!type || !['income', 'expense'].includes(type)) {
    const error = new Error('Transaction type must be income or expense.');
    error.statusCode = 400;
    throw error;
  }

  if (!category_id) {
    const error = new Error('Category selection is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!date) {
    const error = new Error('Transaction date is required.');
    error.statusCode = 400;
    throw error;
  }

  // Verify category exists
  const [categories] = await pool.query(
    'SELECT id, type FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
    [category_id, userId]
  );

  if (categories.length === 0) {
    const error = new Error('Selected category is invalid or inaccessible.');
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO transactions (user_id, category_id, title, amount, type, date, payment_method, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, category_id, title.trim(), parsedAmount, type, date, payment_method, description ? description.trim() : '']
  );

  const newId = result.insertId;

  // Check budget if expense
  if (type === 'expense') {
    await checkBudgetThreshold(userId, category_id, date);
  }

  return getTransactionById(userId, newId);
};

export const updateTransaction = async (userId, transactionId, data) => {
  // Verify ownership
  await getTransactionById(userId, transactionId);

  const { title, amount, type, date, description } = data;
  const category_id = data.category_id || data.categoryId || data.category;
  const payment_method = data.payment_method || data.paymentMethod;
  const updates = [];
  const params = [];

  if (title && title.trim()) {
    updates.push('title = ?');
    params.push(title.trim());
  }

  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('Amount must be a positive number.');
      error.statusCode = 400;
      throw error;
    }
    updates.push('amount = ?');
    params.push(parsedAmount);
  }

  if (type && ['income', 'expense'].includes(type)) {
    updates.push('type = ?');
    params.push(type);
  }

  if (category_id) {
    updates.push('category_id = ?');
    params.push(category_id);
  }

  if (date) {
    updates.push('date = ?');
    params.push(date);
  }

  if (payment_method) {
    updates.push('payment_method = ?');
    params.push(payment_method);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description.trim());
  }

  if (updates.length === 0) {
    return getTransactionById(userId, transactionId);
  }

  params.push(transactionId, userId);
  await pool.query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);

  const updatedTx = await getTransactionById(userId, transactionId);

  if (updatedTx.type === 'expense') {
    await checkBudgetThreshold(userId, updatedTx.category_id, updatedTx.date);
  }

  return updatedTx;
};

export const deleteTransaction = async (userId, transactionId) => {
  // Verify ownership
  await getTransactionById(userId, transactionId);

  await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
  return { message: 'Transaction deleted successfully.' };
};

export const getFinancialSummary = async (userId, options = {}) => {
  const { startDate, endDate, month } = options;

  let whereClause = 'WHERE user_id = ?';
  const params = [userId];

  if (month) {
    whereClause += " AND DATE_FORMAT(date, '%Y-%m') = ?";
    params.push(month);
  } else {
    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }
  }

  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COUNT(*) AS total_transactions
    FROM transactions
    ${whereClause}
  `;

  const [rows] = await pool.query(query, params);
  const totalIncome = parseFloat(rows[0].total_income);
  const totalExpense = parseFloat(rows[0].total_expense);
  const availableBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((availableBalance / totalIncome) * 100).toFixed(1) : 0;

  return {
    totalIncome,
    totalExpense,
    availableBalance,
    savingsRate: parseFloat(savingsRate),
    totalTransactions: rows[0].total_transactions,
  };
};
