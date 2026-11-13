import pool from '../config/db.js';

export const getGroups = async (userId) => {
  const query = `
    SELECT 
      g.id,
      g.name,
      g.description,
      g.created_at,
      COUNT(DISTINCT m.id) as total_members,
      COALESCE(SUM(e.amount), 0) as total_expenses
    FROM shared_groups g
    LEFT JOIN shared_group_members m ON g.id = m.group_id
    LEFT JOIN shared_expenses e ON g.id = e.group_id
    WHERE g.user_id = ?
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `;
  const [rows] = await pool.query(query, [userId]);
  return rows.map(r => ({
    ...r,
    total_members: parseInt(r.total_members, 10),
    total_expenses: parseFloat(r.total_expenses),
  }));
};

export const createGroup = async (userId, data) => {
  const { name, description = '', members = [] } = data;

  if (!name || !name.trim()) {
    const error = new Error('Group name is required.');
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO shared_groups (user_id, name, description) VALUES (?, ?, ?)',
    [userId, name.trim(), description.trim()]
  );

  const groupId = result.insertId;

  // Add default members if provided, ensure 'You' is included
  const memberList = Array.isArray(members) && members.length > 0 
    ? members.map(m => typeof m === 'string' ? m.trim() : m.name.trim()).filter(Boolean)
    : ['You'];

  if (!memberList.includes('You')) {
    memberList.unshift('You');
  }

  for (const memberName of memberList) {
    await pool.query(
      'INSERT INTO shared_group_members (group_id, name) VALUES (?, ?)',
      [groupId, memberName]
    );
  }

  return getGroupDetails(userId, groupId);
};

export const getGroupDetails = async (userId, groupId) => {
  const [groupRows] = await pool.query(
    'SELECT * FROM shared_groups WHERE id = ? AND user_id = ?',
    [groupId, userId]
  );

  if (groupRows.length === 0) {
    const error = new Error('Shared expense group not found.');
    error.statusCode = 404;
    throw error;
  }

  const group = groupRows[0];

  // Fetch members
  const [members] = await pool.query(
    'SELECT id, name, email FROM shared_group_members WHERE group_id = ? ORDER BY id ASC',
    [groupId]
  );

  // Fetch expenses
  const [expenses] = await pool.query(
    `SELECT 
      e.id, 
      e.group_id, 
      e.title, 
      e.amount, 
      e.paid_by, 
      e.split_type, 
      DATE_FORMAT(e.date, '%Y-%m-%d') as date, 
      e.category, 
      e.created_at
     FROM shared_expenses e 
     WHERE e.group_id = ? 
     ORDER BY e.date DESC, e.id DESC`,
    [groupId]
  );

  // Fetch splits for these expenses
  const expenseIds = expenses.map(e => e.id);
  let splitsMap = {};
  if (expenseIds.length > 0) {
    const [splits] = await pool.query(
      `SELECT expense_id, member_name, amount FROM shared_expense_splits WHERE expense_id IN (?)`,
      [expenseIds]
    );
    splits.forEach(s => {
      if (!splitsMap[s.expense_id]) splitsMap[s.expense_id] = [];
      splitsMap[s.expense_id].push({
        member_name: s.member_name,
        amount: parseFloat(s.amount),
      });
    });
  }

  const detailedExpenses = expenses.map(e => ({
    ...e,
    amount: parseFloat(e.amount),
    splits: splitsMap[e.id] || [],
  }));

  // Calculate settlement balances ("who owes whom")
  // Net balance for each member = total paid - total share
  const balances = {};
  members.forEach(m => {
    balances[m.name] = 0;
  });

  detailedExpenses.forEach(exp => {
    // Creditor: paid_by
    if (balances[exp.paid_by] !== undefined) {
      balances[exp.paid_by] += exp.amount;
    } else {
      balances[exp.paid_by] = exp.amount;
    }

    // Debtors: splits
    exp.splits.forEach(split => {
      if (balances[split.member_name] !== undefined) {
        balances[split.member_name] -= split.amount;
      } else {
        balances[split.member_name] = -split.amount;
      }
    });
  });

  // Calculate settlements
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([name, balance]) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ name, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ name, amount: -rounded });
    }
  });

  const settlements = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount <= 0.01) cIdx++;
    if (debtor.amount <= 0.01) dIdx++;
  }

  const totalSpent = detailedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return {
    group,
    members,
    expenses: detailedExpenses,
    balances,
    settlements,
    totalSpent,
  };
};

export const addMember = async (userId, groupId, { name, email = null }) => {
  const [groupRows] = await pool.query(
    'SELECT * FROM shared_groups WHERE id = ? AND user_id = ?',
    [groupId, userId]
  );

  if (groupRows.length === 0) {
    const error = new Error('Group not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Member name is required.');
    error.statusCode = 400;
    throw error;
  }

  const [existing] = await pool.query(
    'SELECT id FROM shared_group_members WHERE group_id = ? AND LOWER(name) = LOWER(?)',
    [groupId, name.trim()]
  );

  if (existing.length > 0) {
    const error = new Error('Member with this name already exists in group.');
    error.statusCode = 409;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO shared_group_members (group_id, name, email) VALUES (?, ?, ?)',
    [groupId, name.trim(), email ? email.trim() : null]
  );

  return { id: result.insertId, group_id: groupId, name: name.trim(), email };
};

export const addExpense = async (userId, groupId, data) => {
  const { title, amount, paid_by, split_type = 'equal', date, category = 'General', splits } = data;

  const [groupRows] = await pool.query(
    'SELECT * FROM shared_groups WHERE id = ? AND user_id = ?',
    [groupId, userId]
  );

  if (groupRows.length === 0) {
    const error = new Error('Group not found.');
    error.statusCode = 404;
    throw error;
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    const error = new Error('Valid expense amount is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!title || !title.trim()) {
    const error = new Error('Expense title is required.');
    error.statusCode = 400;
    throw error;
  }

  // Get current members
  const [members] = await pool.query('SELECT name FROM shared_group_members WHERE group_id = ?', [groupId]);
  if (members.length === 0) {
    const error = new Error('Group has no members to split expense with.');
    error.statusCode = 400;
    throw error;
  }

  const txDate = date || new Date().toISOString().split('T')[0];

  const [expResult] = await pool.query(
    'INSERT INTO shared_expenses (group_id, title, amount, paid_by, split_type, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [groupId, title.trim(), numAmount, paid_by || 'You', split_type, txDate, category]
  );

  const expenseId = expResult.insertId;

  // Insert splits
  if (split_type === 'custom' && Array.isArray(splits) && splits.length > 0) {
    for (const s of splits) {
      await pool.query(
        'INSERT INTO shared_expense_splits (expense_id, member_name, amount) VALUES (?, ?, ?)',
        [expenseId, s.member_name, parseFloat(s.amount) || 0]
      );
    }
  } else {
    // Equal split
    const splitAmount = Math.round((numAmount / members.length) * 100) / 100;
    for (const m of members) {
      await pool.query(
        'INSERT INTO shared_expense_splits (expense_id, member_name, amount) VALUES (?, ?, ?)',
        [expenseId, m.name, splitAmount]
      );
    }
  }

  return getGroupDetails(userId, groupId);
};

export const deleteExpense = async (userId, groupId, expenseId) => {
  const [groupRows] = await pool.query(
    'SELECT * FROM shared_groups WHERE id = ? AND user_id = ?',
    [groupId, userId]
  );
  if (groupRows.length === 0) {
    const error = new Error('Group not found.');
    error.statusCode = 404;
    throw error;
  }

  await pool.query('DELETE FROM shared_expenses WHERE id = ? AND group_id = ?', [expenseId, groupId]);
  return { message: 'Shared expense deleted successfully.' };
};

export const deleteGroup = async (userId, groupId) => {
  const [result] = await pool.query(
    'DELETE FROM shared_groups WHERE id = ? AND user_id = ?',
    [groupId, userId]
  );
  if (result.affectedRows === 0) {
    const error = new Error('Group not found.');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Group deleted successfully.' };
};

