-- SpendWise: Smart Personal Expense and Budget Management System
-- Database Seed Data (Default Categories & Professional Demo Data)

USE spendwise_db;

-- Clear previous demo data in reverse order of FKs (safe execution)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE recurring_transactions;
TRUNCATE TABLE transactions;
TRUNCATE TABLE budgets;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Default Global Categories
-- Expense Categories
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
(1, NULL, 'Food & Dining', 'expense', 'Utensils', '#EF4444', TRUE),
(2, NULL, 'Transportation & Travel', 'expense', 'Car', '#F97316', TRUE),
(3, NULL, 'Shopping & Retail', 'expense', 'ShoppingBag', '#EC4899', TRUE),
(4, NULL, 'Education & Books', 'expense', 'GraduationCap', '#8B5CF6', TRUE),
(5, NULL, 'Entertainment & Leisure', 'expense', 'Film', '#6366F1', TRUE),
(6, NULL, 'Healthcare & Medical', 'expense', 'Activity', '#14B8A6', TRUE),
(7, NULL, 'Bills & Utilities', 'expense', 'Receipt', '#EAB308', TRUE),
(8, NULL, 'Housing & Rent', 'expense', 'Home', '#3B82F6', TRUE),
(9, NULL, 'Personal Care', 'expense', 'Smile', '#A855F7', TRUE),
(10, NULL, 'Other Expenses', 'expense', 'MoreHorizontal', '#64748B', TRUE);

-- Income Categories
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
(11, NULL, 'Salary', 'income', 'Briefcase', '#10B981', TRUE),
(12, NULL, 'Freelance & Consulting', 'income', 'Laptop', '#06B6D4', TRUE),
(13, NULL, 'Investments & Dividends', 'income', 'TrendingUp', '#84CC16', TRUE),
(14, NULL, 'Grants & Scholarships', 'income', 'Award', '#22C55E', TRUE),
(15, NULL, 'Gifts & Other Income', 'income', 'Gift', '#14B8A6', TRUE);

-- 2. Insert Demo User (Email: demo@spendwise.com | Password: password123)
-- bcrypt hash for 'password123' with 10 rounds:
INSERT INTO users (id, name, email, password, currency, theme) VALUES
(1, 'Alex Morgan', 'demo@spendwise.com', '$2a$10$8YFT76TPXPmMHtcqGhR4d.b8gc8Z6zB0vP/rUlKt8tj0GK/da.8x.', 'INR', 'light');

-- 3. Insert User Specific Custom Categories for User 1
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
(16, 1, 'Cloud Hosting & SaaS', 'expense', 'Server', '#0284C7', FALSE),
(17, 1, 'PBL Research Materials', 'expense', 'BookOpen', '#7C3AED', FALSE);

-- 4. Insert Budgets for Current Month (2026-11)
INSERT INTO budgets (user_id, category_id, month, amount, warning_threshold) VALUES
(1, 1, '2026-11', 500.00, 80.00), -- Food
(1, 2, '2026-11', 250.00, 80.00), -- Travel
(1, 3, '2026-11', 300.00, 80.00), -- Shopping
(1, 5, '2026-11', 150.00, 80.00), -- Entertainment
(1, 7, '2026-11', 200.00, 85.00), -- Bills
(1, 16, '2026-11', 100.00, 80.00); -- Cloud Hosting

-- 5. Insert Rich Transactions for Analytics & Demo (Income & Expenses)
INSERT INTO transactions (user_id, category_id, title, amount, type, date, payment_method, description) VALUES
-- Incomes for current month
(1, 11, 'TechCorp Monthly Salary', 4500.00, 'income', '2026-11-01', 'Bank Transfer', 'Primary software developer salary'),
(1, 12, 'UI/UX Freelance Project', 850.00, 'income', '2026-11-03', 'UPI/Bank Transfer', 'Mobile app dashboard design milestone'),
(1, 13, 'Stock Portfolio Dividend', 120.00, 'income', '2026-11-05', 'Bank Transfer', 'Quarterly index fund dividend payout'),

-- Expenses for current month (2026-11)
(1, 1, 'Whole Foods Grocery Run', 142.50, 'expense', '2026-11-01', 'Credit Card', 'Weekly organic grocery and pantry restock'),
(1, 7, 'Apartment Fiber Internet Bill', 65.00, 'expense', '2026-11-02', 'Debit Card', 'High-speed gigabit fiber connection'),
(1, 2, 'Monthly Metro Transit Pass', 85.00, 'expense', '2026-11-02', 'Credit Card', 'City metro & commuter rail monthly card'),
(1, 16, 'AWS & DigitalOcean Servers', 48.00, 'expense', '2026-11-02', 'Credit Card', 'Development cluster & staging droplets'),
(1, 5, 'Cinema IMAX & Popcorn', 34.50, 'expense', '2026-11-03', 'Credit Card', 'Weekend sci-fi movie with friends'),
(1, 1, 'Artisan Coffee Roasters', 18.25, 'expense', '2026-11-03', 'UPI/Bank Transfer', 'Pour-over beans & espresso'),
(1, 3, 'Ergonomic Desk Accessories', 115.00, 'expense', '2026-11-04', 'Credit Card', 'Vertical mouse and wrist support rest'),
(1, 1, 'Team Dinner & Bistro', 78.50, 'expense', '2026-11-04', 'Debit Card', 'Celebration dinner at Italian trattoria'),
(1, 4, 'System Design & Algorithm Books', 62.00, 'expense', '2026-11-05', 'Debit Card', 'Distributed systems textbook and prep guide'),

-- Previous Month Transactions (2026-10) for Trend & Comparison Analysis
(1, 11, 'TechCorp Monthly Salary', 4500.00, 'income', '2026-10-01', 'Bank Transfer', 'Primary software developer salary'),
(1, 12, 'Backend Consulting Milestone', 600.00, 'income', '2026-10-15', 'Bank Transfer', 'API architecture review'),
(1, 1, 'Groceries & Farmers Market', 420.00, 'expense', '2026-10-05', 'Credit Card', 'October groceries total'),
(1, 2, 'Rideshare & Fuel', 190.00, 'expense', '2026-10-12', 'Debit Card', 'Commute expenses'),
(1, 3, 'Winter Apparel Shopping', 245.00, 'expense', '2026-10-18', 'Credit Card', 'Jacket and boots'),
(1, 7, 'Electricity & Utilities', 180.00, 'expense', '2026-10-20', 'Debit Card', 'Monthly power and heating'),
(1, 5, 'Gaming & Streaming Subs', 95.00, 'expense', '2026-10-25', 'Credit Card', 'Streaming services and games');

-- 6. Insert Recurring Transactions (Subscriptions & Recurring commitments)
INSERT INTO recurring_transactions (user_id, category_id, title, amount, type, frequency, start_date, next_date, last_processed_date, status, description) VALUES
(1, 7, 'Fiber Internet Subscription', 65.00, 'expense', 'monthly', '2026-10-02', '2026-12-02', '2026-11-02', 'active', 'Monthly 1Gbps broadband plan'),
(1, 5, 'Spotify Music Premium', 11.99, 'expense', 'monthly', '2026-09-15', '2026-11-15', '2026-10-15', 'active', 'Family music streaming subscription'),
(1, 16, 'GitHub Copilot & Cloud Tools', 20.00, 'expense', 'monthly', '2026-08-10', '2026-11-10', '2026-10-10', 'active', 'Developer productivity suite'),
(1, 11, 'Monthly Retainer Salary', 4500.00, 'income', 'monthly', '2026-01-01', '2026-12-01', '2026-11-01', 'active', 'Direct salary deposit');

-- 7. Insert Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(1, 'Welcome to SpendWise', 'SpendWise helps you monitor expenses, allocate smart budgets, and save systematically.', 'info', TRUE, '2026-11-01 09:00:00'),
(1, 'Salary Credited', 'TechCorp Monthly Salary of $4,500.00 has been successfully recorded in your account.', 'success', TRUE, '2026-11-01 10:00:00'),
(1, 'Budget Warning Alert: Food & Dining', 'You have spent $239.25 out of your $500.00 Food budget (47.8%). Keep up the disciplined spending!', 'info', FALSE, '2026-11-04 19:30:00'),
(1, 'Upcoming Subscription', 'Spotify Music Premium ($11.99) is due in 10 days on Nov 15, 2026.', 'warning', FALSE, '2026-11-05 08:00:00');

