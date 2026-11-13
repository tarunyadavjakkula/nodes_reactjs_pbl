import pool from '../config/db.js';

export const getCategoryBreakdown = async (userId, options = {}) => {
  const { month, type = 'expense' } = options;
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  const query = `
    SELECT 
      c.id as category_id,
      c.name,
      c.color,
      c.icon,
      COALESCE(SUM(t.amount), 0) as total,
      COUNT(t.id) as count
    FROM categories c
    JOIN transactions t ON t.category_id = c.id
    WHERE t.user_id = ? 
      AND t.type = ? 
      AND DATE_FORMAT(t.date, '%Y-%m') = ?
    GROUP BY c.id, c.name, c.color, c.icon
    ORDER BY total DESC
  `;

  const [rows] = await pool.query(query, [userId, type, targetMonth]);
  const grandTotal = rows.reduce((acc, row) => acc + parseFloat(row.total), 0);

  const formatted = rows.map((row) => {
    const total = parseFloat(row.total);
    const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;
    return {
      categoryId: row.category_id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      value: total,
      percentage: parseFloat(percentage),
      transactionCount: row.count,
    };
  });

  return {
    month: targetMonth,
    type,
    grandTotal,
    breakdown: formatted,
  };
};

export const getMonthlyTrends = async (userId, monthsCount = 6) => {
  // Returns income vs expense for the past N months
  const query = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ?
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month ASC
  `;

  const [rows] = await pool.query(query, [userId, monthsCount]);

  const trends = rows.map((row) => {
    const income = parseFloat(row.income);
    const expense = parseFloat(row.expense);
    const savings = income - expense;
    return {
      month: row.month,
      income,
      expense,
      savings,
      savingsRate: income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0,
    };
  });

  return trends;
};

export const getDailySpendingTrends = async (userId, month = null) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  const query = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m-%d') AS day,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
    FROM transactions
    WHERE user_id = ?
      AND DATE_FORMAT(date, '%Y-%m') = ?
    GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
    ORDER BY day ASC
  `;

  const [rows] = await pool.query(query, [userId, targetMonth]);
  return rows.map((r) => ({
    date: r.day,
    expense: parseFloat(r.expense),
    income: parseFloat(r.income),
  }));
};
