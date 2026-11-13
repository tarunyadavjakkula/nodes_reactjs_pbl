# SpendWise – Implementation Checklist & Status Tracker

## Phase 1: Environment & Baseline Scaffolding
- [x] 1.1 Inspect workspace and verify system toolchain (Node.js, npm, MySQL)
- [x] 1.2 Create database schema (`database/schema.sql`) and sample seeds (`database/seed.sql`)
- [x] 1.3 Initialize Express backend with `mysql2`, JWT, bcryptjs, cors, dotenv
- [x] 1.4 Initialize Vite React frontend with React Router DOM, Axios, Recharts, Lucide React, Tailwind CSS
- [x] 1.5 Establish MySQL connection pool and implement `/api/health`
- [x] 1.6 Verify full stack loop: Frontend -> Backend -> MySQL

## Phase 2: User Authentication & Profile
- [x] 2.1 Backend Auth routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- [x] 2.2 JWT verification middleware and password hashing with bcryptjs
- [x] 2.3 User profile update & password change endpoints
- [x] 2.4 Frontend Auth Context, token storage, and Axios interceptor
- [x] 2.5 Landing Page, Login Page, and Register Page with validation
- [x] 2.6 Protected Route wrapper and auto-login check

## Phase 3: Category & Transaction Management
- [ ] 3.1 Category CRUD endpoints & automatic default seeding per user
- [ ] 3.2 Transaction CRUD endpoints (Create, Read, Update, Delete)
- [ ] 3.3 Transaction filtering (type, category, date range, search) and pagination
- [ ] 3.4 Strict user data isolation check (WHERE user_id = ?)
- [ ] 3.5 Frontend Category Management page with color/icon selectors
- [ ] 3.6 Frontend Transactions page with filter toolbar and pagination
- [ ] 3.7 Add / Edit Transaction modal and form with validation

## Phase 4: Budget Management & Warning Triggers
- [ ] 4.1 Budget CRUD endpoints with current month spending calculation
- [ ] 4.2 Budget threshold detection logic (warning at 80%, exceeded at 100%)
- [ ] 4.3 Notification generation when budget limits are breached
- [ ] 4.4 Frontend Budgets page with visual progress bars and warning badges
- [ ] 4.5 Add / Edit Budget modal and category allocation

## Phase 5: Financial Analytics & Data Visualization
- [ ] 5.1 Analytics aggregation endpoints (Income vs Expense trends, Category shares, Monthly summaries)
- [ ] 5.2 Recharts components: PieChart (breakdown), BarChart (monthly comparison), AreaChart (spending trends)
- [ ] 5.3 Frontend Analytics page with interactive date filter and summary KPIs

## Phase 6: Executive Dashboard & Rule-Based Smart Insights
- [ ] 6.1 Dashboard overview endpoint (Total Income, Total Expense, Balance, Savings Rate, Recent 5 tx)
- [ ] 6.2 Smart Financial Insights engine (Highest spending category, Month-over-Month delta, unusual transactions, savings tips)
- [ ] 6.3 Frontend Dashboard page integrating KPI cards, mini-charts, recent transactions, and smart insights banner

## Phase 7: Recurring Transactions & Reports
- [ ] 7.1 Recurring transactions CRUD (frequency: daily, weekly, monthly, yearly)
- [ ] 7.2 Recurring transaction processing/duplication avoidance logic
- [ ] 7.3 Frontend Recurring Transactions page (subscription tracker, next payment date)
- [ ] 7.4 Financial Reports page with custom date ranges, category filtering, print view, and CSV export

## Phase 8: Notifications, Settings & Theme Polish
- [ ] 8.1 Notifications API (get all, mark read, mark all read, delete)
- [ ] 8.2 Frontend Notifications drawer/page with unread badge counter
- [ ] 8.3 Settings page (Theme toggle: Dark/Light, default currency selector, profile editor)
- [ ] 8.4 Responsive Navigation Sidebar, mobile drawer, toast notification system
- [ ] 8.5 Polished light & dark mode styles with Tailwind CSS

## Phase 9: Verification, Testing & Academic PBL Deliverables
- [ ] 9.1 End-to-end functionality verification across all 15 pages
- [ ] 9.2 Financial calculation verification (Balance = Income - Expenses, decimals, date bounds)
- [ ] 9.3 Create comprehensive `PBL_REPORT.md` (Academic standard for B.Tech evaluation)
- [ ] 9.4 Create `PBL_PRESENTATION_OUTLINE.md` (Slide-by-slide viva guide)
- [ ] 9.5 Create `README.md` with complete installation, execution, and API documentation
- [ ] 9.6 Create Demonstration & Viva Defense Checklist
