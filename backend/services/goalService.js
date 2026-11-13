import pool from '../config/db.js';

export const getGoals = async (userId) => {
  const query = `
    SELECT 
      id,
      user_id,
      title,
      target_amount,
      current_amount,
      DATE_FORMAT(deadline, '%Y-%m-%d') as deadline,
      category,
      color,
      status,
      created_at,
      updated_at
    FROM savings_goals
    WHERE user_id = ?
    ORDER BY status ASC, created_at DESC
  `;
  const [rows] = await pool.query(query, [userId]);

  return rows.map((goal) => {
    const target = parseFloat(goal.target_amount) || 0;
    const current = parseFloat(goal.current_amount) || 0;
    const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const remaining = Math.max(0, target - current);

    let daysRemaining = null;
    if (goal.deadline) {
      const today = new Date();
      const targetDate = new Date(goal.deadline);
      const diffTime = targetDate - today;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ...goal,
      target_amount: target,
      current_amount: current,
      progressPercent,
      remaining,
      daysRemaining,
    };
  });
};

export const createGoal = async (userId, data) => {
  const { title, target_amount, current_amount = 0, deadline, category = 'General', color = '#6366F1' } = data;

  if (!title || !title.trim()) {
    const error = new Error('Goal title is required.');
    error.statusCode = 400;
    throw error;
  }

  const target = parseFloat(target_amount);
  if (isNaN(target) || target <= 0) {
    const error = new Error('Target amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  const current = parseFloat(current_amount) || 0;
  const status = current >= target ? 'completed' : 'in_progress';

  const query = `
    INSERT INTO savings_goals (user_id, title, target_amount, current_amount, deadline, category, color, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [
    userId,
    title.trim(),
    target,
    current,
    deadline || null,
    category,
    color,
    status,
  ]);

  return {
    id: result.insertId,
    user_id: userId,
    title: title.trim(),
    target_amount: target,
    current_amount: current,
    deadline: deadline || null,
    category,
    color,
    status,
  };
};

export const updateGoal = async (userId, goalId, data) => {
  const { title, target_amount, current_amount, deadline, category, color, status } = data;

  const [existing] = await pool.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
  if (existing.length === 0) {
    const error = new Error('Goal not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentGoal = existing[0];
  const newTitle = title !== undefined ? title.trim() : currentGoal.title;
  const newTarget = target_amount !== undefined ? parseFloat(target_amount) : parseFloat(currentGoal.target_amount);
  const newCurrent = current_amount !== undefined ? parseFloat(current_amount) : parseFloat(currentGoal.current_amount);
  const newDeadline = deadline !== undefined ? (deadline || null) : currentGoal.deadline;
  const newCategory = category !== undefined ? category : currentGoal.category;
  const newColor = color !== undefined ? color : currentGoal.color;
  let newStatus = status !== undefined ? status : currentGoal.status;

  if (newCurrent >= newTarget && newStatus === 'in_progress') {
    newStatus = 'completed';
  }

  const query = `
    UPDATE savings_goals 
    SET title = ?, target_amount = ?, current_amount = ?, deadline = ?, category = ?, color = ?, status = ?
    WHERE id = ? AND user_id = ?
  `;
  await pool.query(query, [newTitle, newTarget, newCurrent, newDeadline, newCategory, newColor, newStatus, goalId, userId]);

  return {
    id: Number(goalId),
    title: newTitle,
    target_amount: newTarget,
    current_amount: newCurrent,
    deadline: newDeadline,
    category: newCategory,
    color: newColor,
    status: newStatus,
  };
};

export const contributeToGoal = async (userId, goalId, amount) => {
  const addAmount = parseFloat(amount);
  if (isNaN(addAmount) || addAmount <= 0) {
    const error = new Error('Contribution amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  const [existing] = await pool.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
  if (existing.length === 0) {
    const error = new Error('Goal not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentGoal = existing[0];
  const updatedCurrent = parseFloat(currentGoal.current_amount) + addAmount;
  const target = parseFloat(currentGoal.target_amount);
  const status = updatedCurrent >= target ? 'completed' : 'in_progress';

  await pool.query(
    'UPDATE savings_goals SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?',
    [updatedCurrent, status, goalId, userId]
  );

  return {
    id: Number(goalId),
    current_amount: updatedCurrent,
    target_amount: target,
    status,
    progressPercent: target > 0 ? Math.min(100, Math.round((updatedCurrent / target) * 100)) : 0,
  };
};

export const deleteGoal = async (userId, goalId) => {
  const [result] = await pool.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
  if (result.affectedRows === 0) {
    const error = new Error('Goal not found or already deleted.');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Savings goal deleted successfully.' };
};

