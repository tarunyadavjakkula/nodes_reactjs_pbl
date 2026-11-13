import pool from '../config/db.js';

export const getSmartFinancialInsights = async (userId, month = null) => {
  const currentMonth = month || new Date().toISOString().substring(0, 7);

  // Calculate previous month string (e.g. '2026-10' from '2026-11')
  const dateObj = new Date(`${currentMonth}-01`);
  dateObj.setMonth(dateObj.getMonth() - 1);
  const prevMonth = dateObj.toISOString().substring(0, 7);

  const insights = [];

  // 1. Current vs Previous Month Totals
  const [currentTotals] = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions 
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, currentMonth]
  );

  const [prevTotals] = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions 
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, prevMonth]
  );

  const curExpense = parseFloat(currentTotals[0].expense);
  const prevExpense = parseFloat(prevTotals[0].expense);
  const curIncome = parseFloat(currentTotals[0].income);

  // Month-over-Month Insight
  if (prevExpense > 0) {
    const diff = curExpense - prevExpense;
    const pctChange = ((diff / prevExpense) * 100).toFixed(1);
    if (diff > 0) {
      insights.push({
        id: 'mom-increase',
        type: 'warning',
        title: 'Increased Monthly Spending',
        description: `Your spending this month is up by ${pctChange}% (+$${diff.toFixed(2)}) compared to ${prevMonth}. Review non-essential categories to keep your cash flow positive.`,
        metric: `+${pctChange}%`,
      });
    } else {
      insights.push({
        id: 'mom-decrease',
        type: 'success',
        title: 'Spending Discipline Improved',
        description: `Great job! Your monthly spending is down by ${Math.abs(pctChange)}% (-$${Math.abs(diff).toFixed(2)}) compared to last month.`,
        metric: `${pctChange}%`,
      });
    }
  }

  // 2. Highest Spending Category
  const [topCats] = await pool.query(
    `SELECT c.name, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = ? AND t.type = 'expense' AND DATE_FORMAT(t.date, '%Y-%m') = ?
     GROUP BY c.id, c.name
     ORDER BY total DESC
     LIMIT 1`,
    [userId, currentMonth]
  );

  if (topCats.length > 0) {
    const topCat = topCats[0];
    const topCatTotal = parseFloat(topCat.total);
    const share = curExpense > 0 ? ((topCatTotal / curExpense) * 100).toFixed(1) : 0;
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Top Expense Category',
      description: `"${topCat.name}" is your highest expenditure this month at $${topCatTotal.toFixed(2)}, accounting for ${share}% of total expenses.`,
      metric: `${share}% of budget`,
    });
  }

  // 3. Anomaly / Unusual Transaction Detection
  // Find transactions that exceed 2.5x the average transaction amount for that category
  const [anomalies] = await pool.query(
    `SELECT t.title, t.amount, t.date, c.name as category_name, avg_table.avg_amount
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     JOIN (
       SELECT category_id, AVG(amount) as avg_amount
       FROM transactions
       WHERE user_id = ? AND type = 'expense'
       GROUP BY category_id
       HAVING COUNT(id) >= 2
     ) avg_table ON t.category_id = avg_table.category_id
     WHERE t.user_id = ? 
       AND t.type = 'expense' 
       AND DATE_FORMAT(t.date, '%Y-%m') = ?
       AND t.amount > (avg_table.avg_amount * 2.5)
     ORDER BY t.amount DESC
     LIMIT 2`,
    [userId, userId, currentMonth]
  );

  if (anomalies.length > 0) {
    const anom = anomalies[0];
    insights.push({
      id: 'anomaly-detected',
      type: 'danger',
      title: 'Unusual Spending Spike Detected',
      description: `"${anom.title}" ($${parseFloat(anom.amount).toFixed(2)}) in ${anom.category_name} is more than 2.5x higher than your average purchase in this category ($${parseFloat(anom.avg_amount).toFixed(2)}).`,
      metric: `$${parseFloat(anom.amount).toFixed(2)}`,
    });
  }

  // 4. Savings Suggestions & 50/30/20 Rule Analysis
  if (curIncome > 0) {
    const savings = curIncome - curExpense;
    const savingsRatio = (savings / curIncome) * 100;

    if (savingsRatio >= 20) {
      insights.push({
        id: 'savings-healthy',
        type: 'success',
        title: 'Strong Savings Rate Target Achieved',
        description: `You are currently saving ${savingsRatio.toFixed(1)}% of your income, surpassing the benchmark 20% savings rule. Consider allocating excess capital to an index fund or rainy-day reserve.`,
        metric: `${savingsRatio.toFixed(1)}% savings`,
      });
    } else if (savingsRatio > 0 && savingsRatio < 20) {
      const neededToSave20 = (curIncome * 0.20) - savings;
      insights.push({
        id: 'savings-low',
        type: 'warning',
        title: 'Savings Optimization Opportunity',
        description: `Your savings rate is currently ${savingsRatio.toFixed(1)}%. Reducing discretionary entertainment and retail purchases by $${neededToSave20.toFixed(2)} will help you hit the recommended 20% savings threshold.`,
        metric: `${savingsRatio.toFixed(1)}% savings`,
      });
    } else {
      insights.push({
        id: 'negative-savings',
        type: 'danger',
        title: 'Deficit Alert: Expenses Exceed Income',
        description: `Your total expenditures ($${curExpense.toFixed(2)}) have exceeded your registered income ($${curIncome.toFixed(2)}). Immediate reduction in non-essential expenses is recommended.`,
        metric: `-$${Math.abs(savings).toFixed(2)}`,
      });
    }
  }

  return {
    month: currentMonth,
    insightsCount: insights.length,
    insights,
  };
};
