import pool from '../config/db.js';

export const getBudgets = async (userId, month = null) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  const query = `
    SELECT 
      b.id,
      b.user_id,
      b.category_id,
      b.month,
      b.amount,
      b.warning_threshold,
      b.created_at,
      b.updated_at,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE((
        SELECT SUM(t.amount) 
        FROM transactions t 
        WHERE t.user_id = b.user_id 
          AND t.category_id = b.category_id 
          AND t.type = 'expense' 
          AND DATE_FORMAT(t.date, '%Y-%m') = b.month
      ), 0) as spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ?
    ORDER BY c.name ASC
  `;

  const [rows] = await pool.query(query, [userId, targetMonth]);

  // Compute calculated metrics
  const processedBudgets = rows.map((b) => {
    const allocated = parseFloat(b.amount);
    const spent = parseFloat(b.spent);
    const remaining = allocated - spent;
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
    const warningThreshold = parseFloat(b.warning_threshold) || 80.0;

    let status = 'normal';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= warningThreshold) {
      status = 'warning';
    }

    return {
      ...b,
      amount: allocated,
      spent,
      remaining,
      percentage: parseFloat(percentage.toFixed(1)),
      warning_threshold: warningThreshold,
      status,
    };
  });

  // Calculate totals
  const totalAllocated = processedBudgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = processedBudgets.reduce((acc, b) => acc + b.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return {
    month: targetMonth,
    summary: {
      totalAllocated,
      totalSpent,
      totalRemaining,
      overallPercentage: parseFloat(overallPercentage.toFixed(1)),
      budgetsCount: processedBudgets.length,
    },
    budgets: processedBudgets,
  };
};

export const createOrUpdateBudget = async (userId, { category_id, month, amount, warning_threshold = 80 }) => {
  if (!category_id) {
    const error = new Error('Category is required.');
    error.statusCode = 400;
    throw error;
  }

  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Budget amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  // Ensure category is accessible and is of type expense
  const [cats] = await pool.query(
    'SELECT id, name, type FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
    [category_id, userId]
  );

  if (cats.length === 0) {
    const error = new Error('Selected category not found.');
    error.statusCode = 400;
    throw error;
  }

  if (cats[0].type !== 'expense') {
    const error = new Error('Budgets can only be assigned to Expense categories.');
    error.statusCode = 400;
    throw error;
  }

  // Upsert budget (Insert or Update if already exists for this user, category, and month)
  const query = `
    INSERT INTO budgets (user_id, category_id, month, amount, warning_threshold)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      amount = VALUES(amount),
      warning_threshold = VALUES(warning_threshold),
      updated_at = CURRENT_TIMESTAMP
  `;

  await pool.query(query, [userId, category_id, targetMonth, parsedAmount, warning_threshold]);

  const [saved] = await pool.query(
    'SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?',
    [userId, category_id, targetMonth]
  );

  return saved[0];
};

export const deleteBudget = async (userId, budgetId) => {
  const [rows] = await pool.query('SELECT id FROM budgets WHERE id = ? AND user_id = ?', [budgetId, userId]);
  if (rows.length === 0) {
    const error = new Error('Budget not found or unauthorized.');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [budgetId, userId]);
  return { message: 'Budget removed successfully.' };
};
