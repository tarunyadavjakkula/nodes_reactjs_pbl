import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ArrowUpRight, ArrowDownRight, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, txRes] = await Promise.allSettled([
          api.get('/transactions/summary'),
          api.get('/transactions?limit=5&sortBy=date&sortOrder=DESC'),
        ]);

        if (isMounted) {
          if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) {
            setSummary(summaryRes.value.data);
          }
          if (txRes.status === 'fulfilled' && txRes.value?.success) {
            setRecentTransactions(txRes.value.data?.transactions || []);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const availableBalance = summary?.availableBalance || 0;
  const savingsRate = summary?.savingsRate || 0;
  const totalTransactions = summary?.totalTransactions || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.name || 'User'}. Here is your financial overview in{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {user?.currency || 'INR'}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/transactions/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatCurrency(totalIncome, user?.currency)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {totalTransactions > 0 ? 'Recorded income' : 'No income recorded yet'}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatCurrency(totalExpense, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {totalTransactions} transaction{totalTransactions === 1 ? '' : 's'} logged
          </span>
        </div>

        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Balance</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-3 ${availableBalance < 0 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {formatCurrency(availableBalance, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Income minus Expenses</span>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Savings Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
            {savingsRate}%
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {totalIncome > 0 ? 'Of total earnings saved' : 'Calculated upon first income'}
          </span>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your latest financial activity</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View All
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{tx.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {tx.category_name || 'General'} • {tx.date}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, user?.currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No transactions logged yet
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by adding your first income or expense to see your financial analytics.
            </p>
            <Link
              to="/transactions/add"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Transaction
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
