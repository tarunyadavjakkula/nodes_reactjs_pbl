# SpendWise – Smart Personal Expense and Budget Management System
## Comprehensive Project Architecture & Implementation Plan

### 1. Executive Summary
**SpendWise** is a full-stack, enterprise-grade personal expense, budgeting, and financial analytics web application developed as a Problem-Based Learning (PBL) project for B.Tech CSE (AIML).
- **Tagline**: *Track Smart. Spend Better. Save More.*
- **Core Value Proposition**: Empowers users to systematically monitor personal cash flows, enforce disciplined monthly category budgets with automated warning alerts, identify spending anomalies, project savings, and manage recurring commitments through an intuitive, accessible dashboard in both Light and Dark modes.

---

### 2. Technical Stack & Rationale

| Layer | Technologies Selected | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Recharts, Lucide React, Tailwind CSS | Ultra-fast HMR with Vite, dynamic responsive charting with Recharts, accessible SVG icons, and reactive state management via Context API. |
| **Backend** | Node.js, Express.js | High-throughput asynchronous event-driven RESTful API architecture with modular separation of concerns (Routers, Controllers, Services). |
| **Database** | MySQL 8.0+, `mysql2/promise` pool | ACID-compliant relational data modeling, foreign key cascade constraints, strict schema enforcement, and exact numeric precision using `DECIMAL(12, 2)`. |
| **Security** | JWT (JSON Web Tokens), `bcryptjs`, Rate Limiting, Input Validation, CORS | Cryptographic password hashing, stateless token authentication with expiration, SQL injection defense through prepared parameterized queries, and strict user data isolation. |

---

### 3. Database Architecture (`spendwise_db`)

```
   +-------------------+
   |       users       |
   +-------------------+
             | 1
             |
             +-------------------------+------------------------+--------------------------+
             | M                       | M                      | M                        | M
             v                         v                        v                          v
   +-------------------+     +-------------------+    +--------------------+     +-------------------+
   |    categories     |     |   transactions    |    |      budgets       |     |   notifications   |
   +-------------------+     +-------------------+    +--------------------+     +-------------------+
             | 1                       |                        |
             +-------------------------+------------------------+
             | M (optional fk)
             v
   +-----------------------+
   | recurring_transactions|
   +-----------------------+
```

1. **`users`**: User identity, hashed passwords, currency preference (`USD`, `INR`, `EUR`, `GBP`, etc.), theme preference (`light` or `dark`), timestamps.
2. **`categories`**: Default system categories and user-customized categories (type: `income` or `expense`, color code, icon).
3. **`transactions`**: Granular income/expense log with title, amount `DECIMAL(12,2)`, category reference, date, payment method, description.
4. **`budgets`**: Monthly spending limits per category or global with threshold alerting (`warning_percentage` default 80%).
5. **`recurring_transactions`**: Subscriptions and recurring bills (daily, weekly, monthly, yearly), next scheduled execution date, active toggle.
6. **`notifications`**: User alerts for budget warnings (>=80%), budget exceeded (>=100%), recurring bill reminders, and read/unread status.

---

### 4. Implementation Phases

- **Phase 1: Project Foundation & Baseline Integration**
  - Project directory scaffolding (`backend/`, `frontend/`, `database/`).
  - Database schema (`schema.sql`) and comprehensive seed dataset (`seed.sql`).
  - Backend Express server setup with MySQL pool health check endpoint.
  - Frontend Vite + React + Tailwind setup with API client and layout shell.
  - Verify seamless communication between Frontend <-> Backend <-> MySQL.

- **Phase 2: Authentication & User Profile Management (Module 1)**
  - JWT auth (Registration, Login, User verification middleware).
  - Secure password hashing with bcryptjs (10 salt rounds).
  - Frontend AuthContext, Protected Routes, Login and Register UI with form validation.
  - Profile view with password change and preferences (currency, theme).

- **Phase 3: Category Management & Transaction Engine (Modules 3 & 4)**
  - Category CRUD APIs with default categories fallback.
  - Transaction CRUD with advanced search, multi-field filtering (date range, type, category), and pagination.
  - Mathematical integrity tests: Income - Expense = Available Balance.
  - Interactive Transactions list, Add/Edit modal/pages with dynamic category pickers.

- **Phase 4: Budget Management & Real-time Warning Engine (Modules 5 & 10)**
  - Category-wise monthly budget allocation.
  - Spending accumulation query against active budget caps.
  - Visual progress indicators (green < 80%, yellow 80-99%, red >= 100%).
  - Automated notification triggers when budgets hit threshold or exceed limits.

- **Phase 5: Financial Analytics & Recharts Data Visualizations (Module 6)**
  - Aggregation queries (Income vs Expense monthly, Category distribution, Day-by-day trends).
  - Recharts integration (PieChart, BarChart, Area/LineChart) with responsive containers and custom tooltips.
  - Net savings rate calculation and historical trends.

- **Phase 6: Executive Dashboard & Rule-Based Smart Insights (Modules 2 & 8)**
  - High-level KPI summary cards (Total Income, Total Expense, Net Balance, Savings Rate).
  - Recent transactions feed & quick actions.
  - Rule-based algorithmic insights engine:
    - Highest expense category this month.
    - Spending velocity vs previous calendar month (% change).
    - Anomaly detection (transactions > 2.5x category average).
    - Actionable automated savings recommendations.

- **Phase 7: Recurring Commitments & Financial Reports (Modules 7 & 9)**
  - Subscription & recurring bill management engine (automatic detection and status tracking).
  - Report generator with date-range filters, category breakdown, print-friendly styling, and clean CSV export.

- **Phase 8: Theme Switcher, Polish, Mobile Responsiveness & Error Handling**
  - Polished Light and Dark mode using CSS custom properties / Tailwind classes.
  - Loading skeleton states, empty states, toast notification system.
  - Fully responsive navigation drawer and responsive dashboard grid.

- **Phase 9: Comprehensive Verification, Testing & PBL Documentation Deliverables**
  - End-to-end user journey tests and data isolation verification.
  - Complete Academic PBL Project Report (`PBL_REPORT.md`).
  - Viva Presentation Outline & Slide-by-slide script (`PBL_PRESENTATION_OUTLINE.md`).
  - Demonstration and Viva defense checklist.

