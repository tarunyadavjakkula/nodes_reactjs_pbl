# SpendWise – Smart Personal Expense & Budget Management System

A full-stack personal finance application built with **Node.js, Express, MySQL, React, and Tailwind CSS**. Designed for project-based learning (PBL) with real-world financial analytics, smart receipt OCR scanning, AI financial assistance, budget tracking, and shared expense splitting.

---

## 🌟 Key Features

1. **Authentication & User Management**: Secure JWT-based registration, login, profile management, and multi-currency support (INR ₹, USD $, EUR €, GBP £).
2. **Interactive Dashboard**: Centralized view of available balance, total income, total expenses, savings rate, and recent transactions.
3. **Complete Transaction Management**: Full CRUD operations for income and expenses with descriptions, dates, categories, and payment methods.
4. **Smart Expense Categorization**: Pre-seeded system categories plus custom user-defined categories with customized color tags.
5. **Advanced Search & Filtering**: Multi-field transaction search by title, category, type, payment method, and custom date ranges.
6. **Budget Management**: Category spending limits with real-time threshold alert badges (80% warning / 100% exceeded).
7. **Spending Analytics**: Interactive Recharts visualizations (Category Distribution Donut, 6-Month Income vs Expense BarChart, and Daily Spending Velocity AreaChart).
8. **Savings Goals**: Goal milestone planner with target amounts, current progress indicators, deadlines, and deposit contributor.
9. **Recurring Transactions**: Automatic tracking for subscriptions, bills, memberships, and salaries across daily, weekly, monthly, and yearly intervals.
10. **AI Financial Assistant**: In-app conversational financial copilot providing personalized spending advice, 50/30/20 budget allocations, and affordability checks.
11. **Smart Receipt Scanner**: Client-side optical character recognition (OCR) via Tesseract.js extracting merchant, date, and amount from uploaded receipts.
12. **Shared Expense Management**: Group expense splitter for friends and roommates with automated "Who Owes Whom" debt settlement calculations.
13. **Financial Reports & Statements**: Formatted periodic accounting statements with instant CSV export and print-ready stylesheets.
14. **Notification Center**: Real-time alerts for budget breaches and upcoming bill reminders.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `express-rate-limit`, `multer`
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, Recharts, Axios, React Router v6, Tesseract.js
- **Database**: MySQL 8.0+

---

## 🚀 Getting Started

### 1. Database Setup
Ensure MySQL is running on your machine, then create the database and tables:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p spendwise_db < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DB_USER, DB_PASSWORD, and PORT in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173/`  
Backend API runs on: `http://localhost:5001/`

---

## 📄 License
ISC License
