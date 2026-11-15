import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  X,
  Coins,
  Sparkles,
} from 'lucide-react';

export const SavingsGoalsPage = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Technology');
  const [color, setColor] = useState('#6366F1');

  // Contribute Modal
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const colorPalette = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      if (res.success && res.data) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please provide a goal title and positive target amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/goals', {
        title: title.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        category,
        color,
      });

      if (res.success) {
        setShowModal(false);
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
        fetchGoals();
      }
    } catch (err) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) return;

    try {
      setContributing(true);
      const res = await api.patch(`/goals/${contributeGoal.id}/contribute`, {
        amount: parseFloat(contributeAmount),
      });

      if (res.success) {
        setContributeGoal(null);
        setContributeAmount('');
        fetchGoals();
      }
    } catch (err) {
      alert(err.message || 'Failed to contribute to goal');
    } finally {
      setContributing(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Set ambitious targets, deposit funds, and track your milestone achievements.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Saved Across Goals</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalSaved, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500">{overallProgress}% of aggregate targets</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Cumulative Target</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalTarget, user?.currency)}
          </p>
          <span className="text-[11px] text-slate-500">{goals.length} active/completed goals</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Remaining to Save</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrency(Math.max(0, totalTarget - totalSaved), user?.currency)}
          </p>
          <span className="text-[11px] text-indigo-500">Remaining journey</span>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading savings goals...
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const isCompleted = g.status === 'completed' || g.current_amount >= g.target_amount;

            return (
              <div
                key={g.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: g.color || '#6366F1' }}
                      >
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {g.title}
                        </h3>
                        <span className="text-[11px] text-slate-400">{g.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                          {g.progressPercent}%
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Saved</span>
                      <strong className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(g.current_amount, user?.currency)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Target</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">
                        {formatCurrency(g.target_amount, user?.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${g.progressPercent}%`,
                        backgroundColor: g.color || '#6366F1',
                      }}
                    />
                  </div>

                  {/* Deadlines and Days */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {g.daysRemaining !== null
                        ? g.daysRemaining > 0
                          ? `${g.daysRemaining} days left`
                          : 'Due date reached'
                        : 'No deadline'}
                    </span>
                    <span>
                      {isCompleted
                        ? 'Target achieved!'
                        : `${formatCurrency(g.remaining, user?.currency)} to go`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!isCompleted && (
                  <button
                    onClick={() => setContributeGoal(g)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Funds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No savings goals yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Break big milestones into achievable savings goals like an Emergency Fund, New Laptop, or Vacation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Goal
          </button>
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create New Savings Goal
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

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. New MacBook Pro, Emergency Cushion, Japan Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target ({user?.currency || 'INR'}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="1000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Deposit ({user?.currency || 'INR'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Travel & Vacation">Travel & Vacation</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Vehicle & Transport">Vehicle & Transport</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Personal Growth">Personal Growth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Funds Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Contribute to "{contributeGoal.title}"
              </h3>
              <button
                onClick={() => setContributeGoal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 100.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contributing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {contributing ? 'Depositing...' : 'Add Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsPage;

