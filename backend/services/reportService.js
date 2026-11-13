import pool from '../config/db.js';

export const generateReportData = async (userId, options = {}) => {
  const { period = 'monthly', startDate, endDate, categoryId } = options;

  let computedStart = startDate;
  let computedEnd = endDate;
  const now = new Date();

  if (!computedStart || !computedEnd) {
    if (period === 'weekly') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      computedStart = firstDay.toISOString().substring(0, 10);
      computedEnd = lastDay.toISOString().substring(0, 10);
    } else if (period === 'yearly') {
      const year = now.getFullYear();
      computedStart = `${year}-01-01`;
      computedEnd = `${year}-12-31`;
    } else {
      // monthly
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      computedStart = `${year}-${month}-01`;
      const lastDate = new Date(year, now.getMonth() + 1, 0).getDate();
      computedEnd = `${year}-${month}-${lastDate}`;
    }
  }

  let baseWhere = 'WHERE t.user_id = ? AND t.date >= ? AND t.date <= ?';
  const params = [userId, computedStart, computedEnd];

  if (categoryId) {
    baseWhere += ' AND t.category_id = ?';
    params.push(categoryId);
  }

  // 1. Totals summary
  const [totals] = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
       COUNT(t.id) AS total_count
     FROM transactions t
     ${baseWhere}`,
    params
  );

  const totalIncome = parseFloat(totals[0].total_income);
  const totalExpense = parseFloat(totals[0].total_expense);
  const netSavings = totalIncome - totalExpense;

  // 2. Category Breakdown in this period
  const [categories] = await pool.query(
    `SELECT 
       c.name,
       c.type,
       c.color,
       COALESCE(SUM(t.amount), 0) as total,
       COUNT(t.id) as count
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     ${baseWhere}
     GROUP BY c.id, c.name, c.type, c.color
     ORDER BY total DESC`,
    params
  );

  // 3. Detailed Transaction Records
  const [transactions] = await pool.query(
    `SELECT 
       t.id,
       DATE_FORMAT(t.date, '%Y-%m-%d') as date,
       t.title,
       t.type,
       t.amount,
       t.payment_method,
       t.description,
       c.name as category_name
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     ${baseWhere}
     ORDER BY t.date DESC, t.id DESC`,
    params
  );

  return {
    period,
    startDate: computedStart,
    endDate: computedEnd,
    summary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: totalIncome > 0 ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1)) : 0,
      totalCount: totals[0].total_count,
    },
    categoryBreakdown: categories.map((c) => ({
      ...c,
      total: parseFloat(c.total),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      amount: parseFloat(t.amount),
    })),
  };
};

export const generateCsvContent = async (userId, options = {}) => {
  const report = await generateReportData(userId, options);

  let csv = 'SpendWise Financial Report\n';
  csv += `Period: ${report.startDate} to ${report.endDate}\n`;
  csv += `Generated On: ${new Date().toLocaleString()}\n\n`;

  csv += 'EXECUTIVE SUMMARY\n';
  csv += `Total Income,${report.summary.totalIncome.toFixed(2)}\n`;
  csv += `Total Expenses,${report.summary.totalExpense.toFixed(2)}\n`;
  csv += `Net Savings,${report.summary.netSavings.toFixed(2)}\n`;
  csv += `Savings Rate,${report.summary.savingsRate}%\n\n`;

  csv += 'TRANSACTION DETAILS\n';
  csv += 'ID,Date,Title,Category,Type,Amount,Payment Method,Description\n';

  for (const t of report.transactions) {
    const cleanDesc = (t.description || '').replace(/"/g, '""');
    const cleanTitle = t.title.replace(/"/g, '""');
    csv += `"${t.id}","${t.date}","${cleanTitle}","${t.category_name}","${t.type}",${t.amount.toFixed(2)},"${t.payment_method}","${cleanDesc}"\n`;
  }

  return csv;
};
