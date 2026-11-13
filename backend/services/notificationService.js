import pool from '../config/db.js';

export const getNotifications = async (userId) => {
  const query = `
    SELECT id, user_id, title, message, type, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const [rows] = await pool.query(query, [userId]);
  const unreadCount = rows.filter((r) => !r.is_read).length;

  return {
    unreadCount,
    notifications: rows,
  };
};

export const markAsRead = async (userId, notificationId) => {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return { message: 'Notification marked as read.' };
};

export const markAllAsRead = async (userId) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
  return { message: 'All notifications marked as read.' };
};

export const deleteNotification = async (userId, notificationId) => {
  await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
  return { message: 'Notification deleted.' };
};
