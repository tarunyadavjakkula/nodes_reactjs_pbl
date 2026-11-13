import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  PiggyBank,
  PieChart,
  FileSpreadsheet,
  Repeat,
  Settings,
  Wallet,
  X,
  Target,
  ScanLine,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Add Transaction', path: '/transactions/add', icon: PlusCircle },
  { name: 'Receipt Scanner', path: '/receipt-scanner', icon: ScanLine },
  { name: 'Budgets', path: '/budgets', icon: PiggyBank },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Savings Goals', path: '/goals', icon: Target },
  { name: 'Recurring Bills', path: '/recurring', icon: Repeat },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, closeSidebar }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/dashboard" className="flex items-center gap-3" onClick={closeSidebar}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Spend<span className="text-indigo-600 dark:text-indigo-400">Wise</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Financial Intelligence</p>
            </div>
          </NavLink>

          <button
            onClick={closeSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Features
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              SpendWise v1.0
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Smart Personal Expense & Budget Management
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
