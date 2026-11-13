import pool from '../config/db.js';
import * as transactionService from './transactionService.js';
import * as budgetService from './budgetService.js';
import * as analyticsService from './analyticsService.js';
import * as goalService from './goalService.js';

export const getFinancialContext = async (userId) => {
  // Fetch user info
  const [users] = await pool.query('SELECT name, currency FROM users WHERE id = ?', [userId]);
  const user = users[0] || { name: 'User', currency: 'USD' };

  // Fetch summary
  const summary = await transactionService.getFinancialSummary(userId);

  // Fetch category breakdown safely
  let topCategories = [];
  try {
    const categoryBreakdown = await analyticsService.getCategoryBreakdown(userId, { type: 'expense' });
    topCategories = Array.isArray(categoryBreakdown?.breakdown)
      ? categoryBreakdown.breakdown.slice(0, 5)
      : Array.isArray(categoryBreakdown)
      ? categoryBreakdown.slice(0, 5)
      : [];
  } catch (e) {
    topCategories = [];
  }

  // Fetch active budgets safely
  let budgetList = [];
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const budgetsData = await budgetService.getBudgets(userId, currentMonth);
    budgetList = Array.isArray(budgetsData?.budgets)
      ? budgetsData.budgets
      : Array.isArray(budgetsData)
      ? budgetsData
      : [];
  } catch (e) {
    budgetList = [];
  }

  // Fetch goals safely
  let goals = [];
  try {
    goals = await goalService.getGoals(userId);
  } catch (e) {
    goals = [];
  }

  // Fetch recent transactions safely
  let recentTransactions = [];
  try {
    const txResult = await transactionService.getTransactions(userId, { limit: 5, sortBy: 'date', sortOrder: 'DESC' });
    recentTransactions = txResult?.transactions || [];
  } catch (e) {
    recentTransactions = [];
  }

  return {
    user,
    summary,
    topCategories,
    budgets: budgetList,
    goals,
    recentTransactions,
  };
};

export const chatWithAssistant = async (userId, userMessage, conversationHistory = []) => {
  const context = await getFinancialContext(userId);
  const currency = context.user.currency || 'USD';
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const msg = (userMessage || '').toLowerCase().trim();

  // Financial statistics
  const income = context.summary?.totalIncome || 0;
  const expense = context.summary?.totalExpense || 0;
  const balance = context.summary?.availableBalance || 0;
  const savingsRate = context.summary?.savingsRate || 0;

  let reply = '';
  let recommendations = [];

  // Check query intents
  if (msg.includes('how much') && (msg.includes('spend') || msg.includes('expense'))) {
    reply = `You have spent **${sym}${expense.toLocaleString()}** in total. `;
    if (context.topCategories.length > 0) {
      reply += `Your highest spending area is **${context.topCategories[0].name}** with **${sym}${parseFloat(context.topCategories[0].value).toLocaleString()}** (${context.topCategories[0].percentage}% of total expenses).`;
      recommendations = [
        `Review expenses in ${context.topCategories[0]?.name || 'your top category'} to identify non-essential spending.`,
        `Set a strict category budget to limit month-end surprises.`,
      ];
    } else {
      reply += `No category expenses recorded yet.`;
      recommendations = [`Start by logging your daily expenses to see category breakdowns.`];
    }
  } else if (msg.includes('income') || msg.includes('earn')) {
    reply = `Your total recorded income is **${sym}${income.toLocaleString()}**. `;
    reply += `After expenses of **${sym}${expense.toLocaleString()}**, your remaining available balance is **${sym}${balance.toLocaleString()}** (Savings Rate: **${savingsRate}%**).`;
    recommendations = [
      savingsRate < 20 
        ? `Aim to increase your savings rate to at least 20% by following the 50/30/20 rule.` 
        : `Great job! Your savings rate of ${savingsRate}% exceeds the recommended 20% baseline benchmark.`,
    ];
  } else if (msg.includes('budget') || msg.includes('limit')) {
    if (context.budgets.length === 0) {
      reply = `You haven't set up any category budgets yet for this month. Setting budgets is the most effective way to prevent overspending!`;
      recommendations = [
        `Navigate to the Budgets tab and set spending caps for essential categories like Food & Dining or Entertainment.`,
      ];
    } else {
      const exceeded = context.budgets.filter(b => b.status === 'exceeded');
      const warnings = context.budgets.filter(b => b.status === 'warning');

      if (exceeded.length > 0) {
        reply = `⚠️ Alert: You have exceeded budget limits in **${exceeded.map(b => b.category_name).join(', ')}**! `;
      } else if (warnings.length > 0) {
        reply = `⚡ Heads up: You have reached warning thresholds in **${warnings.map(b => b.category_name).join(', ')}**. `;
      } else {
        reply = `All your ${context.budgets.length} active budgets are currently well within safe spending limits. `;
      }

      reply += `\n\n**Budget Status:**\n` + context.budgets.map(b => 
        `- **${b.category_name}**: ${sym}${b.spent.toLocaleString()} / ${sym}${b.amount.toLocaleString()} (${b.percentage}%)`
      ).join('\n');
    }
  } else if (msg.includes('goal') || msg.includes('save') || msg.includes('saving')) {
    if (context.goals.length === 0) {
      reply = `You currently have no active Savings Goals. Defining concrete goals (such as an Emergency Fund, Vacation, or New Laptop) boosts financial discipline by over 40%!`;
      recommendations = [
        `Create your first goal in the Savings Goals tab and set a realistic monthly contribution.`,
      ];
    } else {
      reply = `Here is the status of your **${context.goals.length} active savings goals**:\n\n` +
        context.goals.map(g => 
          `- **${g.title}**: ${sym}${g.current_amount.toLocaleString()} of ${sym}${g.target_amount.toLocaleString()} (${g.progressPercent}% achieved)`
        ).join('\n');
      
      const uncompleted = context.goals.filter(g => g.status !== 'completed');
      if (uncompleted.length > 0) {
        recommendations = [
          `To reach "${uncompleted[0].title}", you need ${sym}${uncompleted[0].remaining.toLocaleString()} more. Setting aside small weekly contributions will help you reach it faster!`,
        ];
      }
    }
  } else if (msg.includes('afford') || msg.includes('can i buy')) {
    // Extract potential amount from query if any
    const match = msg.match(/\d+[\d,]*/);
    const itemAmount = match ? parseFloat(match[0].replace(/,/g, '')) : null;

    if (itemAmount) {
      if (balance >= itemAmount * 2) {
        reply = `Based on your available balance of **${sym}${balance.toLocaleString()}**, you can comfortably afford this **${sym}${itemAmount.toLocaleString()}** purchase without jeopardizing your financial stability.`;
        recommendations = [`Keep at least 3 months of emergency expenses reserved before making discretionary luxury purchases.`];
      } else if (balance >= itemAmount) {
        reply = `You have enough cash (${sym}${balance.toLocaleString()}) for this ${sym}${itemAmount.toLocaleString()} purchase, but it will consume **${Math.round((itemAmount / balance) * 100)}%** of your total remaining balance.`;
        recommendations = [`Consider waiting a couple of weeks or breaking the cost over multiple pay periods.`];
      } else {
        reply = `⚠️ With your current balance of **${sym}${balance.toLocaleString()}**, purchasing an item worth **${sym}${itemAmount.toLocaleString()}** would push your finances into a deficit of **${sym}${(itemAmount - balance).toLocaleString()}**.`;
        recommendations = [`Set up a targeted Savings Goal instead and save gradually over the next few months!`];
      }
    } else {
      reply = `To help you decide if you can afford it, compare the item's cost against your available balance of **${sym}${balance.toLocaleString()}**. As a rule of thumb, discretionary purchases should not exceed 20-30% of your unallocated monthly cash.`;
    }
  } else if (msg.includes('tip') || msg.includes('advice') || msg.includes('reduce') || msg.includes('cut')) {
    reply = `Here are customized recommendations based on your current spending profile:\n\n` +
      `1. **Apply the 50/30/20 Rule**: Allocate 50% of income (${sym}${(income * 0.5).toFixed(0)}) to Needs, 30% (${sym}${(income * 0.3).toFixed(0)}) to Wants, and 20% (${sym}${(income * 0.2).toFixed(0)}) directly to Savings & Debt.\n` +
      `2. **Target Highest Expenses**: Look at your largest category (${context.topCategories[0]?.name || 'Food/Shopping'}) and see if 10-15% can be trimmed by cooking at home or canceling unused subscriptions.\n` +
      `3. **Automate Savings**: Set up automated transfers immediately on payday to fund your Savings Goals first before spending on discretionary items.`;
  } else {
    // Default smart financial advisor reply
    reply = `Hello ${context.user.name}! I am your AI Financial Assistant. Here is your quick snapshot:\n\n` +
      `• **Total Income**: ${sym}${income.toLocaleString()}\n` +
      `• **Total Expenses**: ${sym}${expense.toLocaleString()}\n` +
      `• **Available Balance**: ${sym}${balance.toLocaleString()}\n` +
      `• **Savings Rate**: ${savingsRate}%\n\n` +
      `How can I assist you with your personal finance today? You can ask me questions like:\n` +
      `- *"How much did I spend this month?"*\n` +
      `- *"Where can I cut down unnecessary expenses?"*\n` +
      `- *"Can I afford a ${sym}5,000 purchase?"*\n` +
      `- *"Am I close to exceeding any of my budgets?"*`;
  }

  return {
    reply,
    recommendations,
    financialSummary: {
      totalIncome: income,
      totalExpense: expense,
      availableBalance: balance,
      savingsRate,
      currency,
    },
  };
};
