import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  PiggyBank,
  Plus,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Loader2,
  X,
  TrendingDown,
} from 'lucide-react';

export const BudgetsPage = () => {
  const { user } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [warningThreshold, setWarningThreshold] = useState('80');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/budgets?month=${month}`);
      if (res.success && res.data) {
        // Backend returns: { month, summary, budgets: [...] }
        const budgetList = Array.isArray(res.data.budgets)
          ? res.data.budgets
          : Array.isArray(res.data)
          ? res.data
          : [];

        setBudgets(budgetList);
        if (res.data.summary) {
          setSummary(res.data.summary);
        } else {
          const totalAllocated = budgetList.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
          const totalSpent = budgetList.reduce((acc, b) => acc + (parseFloat(b.spent) || 0), 0);
          setSummary({
            totalAllocated,
            totalSpent,
            totalRemaining: Math.max(0, totalAllocated - totalSpent),
            overallPercentage: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?type=expense');
      if (res.success && res.data) {
        const catList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.categories)
          ? res.data.categories
          : [];
        setCategories(catList);
        if (catList.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load expense categories', err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [month]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid budget amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/budgets', {
        category_id: parseInt(categoryId, 10),
        month,
        amount: parseFloat(amount),
        warning_threshold: parseFloat(warningThreshold),
      });

      if (res.success) {
        setShowModal(false);
        setAmount('');
        fetchBudgets();
      }
    } catch (err) {
      setError(err.message || 'Failed to set budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Set monthly category spending caps and receive live progress alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Set Budget
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Allocated Budget</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary.totalAllocated || 0, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500">{budgets.length} category caps set</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Spent So Far</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(summary.totalSpent || 0, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500">
            {summary.overallPercentage || 0}% of aggregate budget spent
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Remaining Cushion</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(summary.totalRemaining || 0, user?.currency)}
          </p>
          <span className="text-[11px] text-emerald-600">Available to spend</span>
        </div>
      </div>

      {/* Budgets List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading budget plans...
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const allocated = parseFloat(b.amount) || 0;
            const spent = parseFloat(b.spent) || 0;
            const remaining = parseFloat(b.remaining) || 0;
            const percent = parseFloat(b.percentage) || 0;

            const isExceeded = b.status === 'exceeded' || percent >= 100;
            const isWarning = b.status === 'warning' || (percent >= (b.warning_threshold || 80) && !isExceeded);

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ backgroundColor: b.category_color || '#6366F1' }}
                    >
                      {(b.category_name || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {b.category_name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Alert threshold at {b.warning_threshold || 80}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900">
                        <AlertOctagon className="w-3 h-3" /> Exceeded!
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-900">
                        <AlertTriangle className="w-3 h-3" /> Warning ({percent}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> Safe
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Spent:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(spent, user?.currency)}
                      </strong>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Limit:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(allocated, user?.currency)}
                      </strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{percent}% utilized</span>
                    <span>
                      {remaining >= 0
                        ? `${formatCurrency(remaining, user?.currency)} remaining`
                        : `Over by ${formatCurrency(Math.abs(remaining), user?.currency)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <PiggyBank className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No budgets configured for {month}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Setting category budgets helps curb impulsive spending and ensures you stay on track with savings.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Set First Budget
          </button>
        </div>
      )}

      {/* Set Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Set Category Spending Limit
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Cap ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Warning Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  You will receive an alert once spending reaches {warningThreshold}% of this budget.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
