import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  BarChart3,
  Activity,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [insights, setInsights] = useState([]);

  const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [catRes, monthRes, dailyRes, insightsRes] = await Promise.allSettled([
          api.get(`/analytics/category-breakdown?month=${month}&type=expense`),
          api.get('/analytics/monthly-trends?months=6'),
          api.get(`/analytics/daily-trends?month=${month}`),
          api.get(`/analytics/insights?month=${month}`),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.success) {
          setCategoryData(catRes.value.data.breakdown || []);
        }
        if (monthRes.status === 'fulfilled' && monthRes.value?.success) {
          setMonthlyTrends(monthRes.value.data || []);
        }
        if (dailyRes.status === 'fulfilled' && dailyRes.value?.success) {
          setDailyTrends(dailyRes.value.data || []);
        }
        if (insightsRes.status === 'fulfilled' && insightsRes.value?.success) {
          setInsights(insightsRes.value.data?.insights || []);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [month]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-900 dark:text-white mb-1">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="flex items-center gap-2" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-mono font-semibold">
                {formatCurrency(entry.value, user?.currency)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Spending Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual breakdown of your financial flows and automated spending trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Aggregating financial charts...
        </div>
      ) : (
        <>
          {/* Smart Insights Highlights */}
          {insights.length > 0 && (
            <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  Automated Financial Insights
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.map((ins, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{ins.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ins.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Row 1: Category Breakdown & Monthly Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown (Donut) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Expense Distribution by Category
                  </h3>
                  <p className="text-xs text-slate-500">Current month spending share</p>
                </div>
                <PieChartIcon className="w-4 h-4 text-slate-400" />
              </div>

              {categoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="w-full sm:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-60 pr-2">
                    {categoryData.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color || COLORS[i % COLORS.length] }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                            {c.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">
                            {formatCurrency(c.value, user?.currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({c.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No expense records logged for {month} yet.
                </div>
              )}
            </div>

            {/* Monthly Trends (Income vs Expense Bar Chart) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Income vs Expenses (6 Months)
                  </h3>
                  <p className="text-xs text-slate-500">Historical performance comparison</p>
                </div>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>

              {monthlyTrends.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No historical trend data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: Daily Spending Flow (Area Chart) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Spending Velocity
                </h3>
                <p className="text-xs text-slate-500">Expense and income spikes through {month}</p>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>

            {dailyTrends.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) => d.slice(8)}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#6366F1"
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                No daily transactions recorded in this month.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
