import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [insights, setInsights] = useState([]);

  const COLORS = [
    '#6366F1',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EF4444',
    '#14B8A6',
    '#F97316',
    '#06B6D4',
  ];

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

  // Chart.js Category Breakdown Doughnut configuration
  const doughnutChartData = {
    labels: categoryData.map((c) => c.name),
    datasets: [
      {
        data: categoryData.map((c) => c.value),
        backgroundColor: categoryData.map(
          (c, i) => c.color || COLORS[i % COLORS.length]
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatCurrency(val, user?.currency)}`;
          },
        },
      },
    },
    cutout: '65%',
  };

  // Chart.js Monthly Trends Bar configuration
  const barChartData = {
    labels: monthlyTrends.map((m) => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map((m) => m.income),
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: monthlyTrends.map((m) => m.expense),
        backgroundColor: '#EF4444',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` ${context.dataset.label}: ${formatCurrency(
              context.raw || 0,
              user?.currency
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: {
          font: { size: 10 },
          callback: (value) => (value >= 1000 ? `${value / 1000}k` : value),
        },
      },
    },
  };

  // Chart.js Daily Velocity Line configuration
  const lineChartData = {
    labels: dailyTrends.map((d) => d.date?.slice(8) || ''),
    datasets: [
      {
        label: 'Expense',
        data: dailyTrends.map((d) => d.expense),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` Expense: ${formatCurrency(context.raw || 0, user?.currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: {
          font: { size: 10 },
          callback: (value) => (value >= 1000 ? `${value / 1000}k` : value),
        },
      },
    },
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
            Visual breakdown of your financial flows powered by Chart.js.
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
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {ins.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {ins.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Row 1: Category Breakdown & Monthly Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown (Chart.js Doughnut) */}
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
                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                  </div>

                  <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-60 pr-2">
                    {categoryData.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: c.color || COLORS[i % COLORS.length],
                            }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                            {c.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">
                            {formatCurrency(c.value, user?.currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({c.percentage}%)
                          </span>
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

            {/* Monthly Trends (Chart.js Bar Chart) */}
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
                  <Bar data={barChartData} options={barOptions} />
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No historical trend data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: Daily Spending Flow (Chart.js Line Chart) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Spending Velocity
                </h3>
                <p className="text-xs text-slate-500">Expense spikes through {month}</p>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>

            {dailyTrends.length > 0 ? (
              <div className="h-64 w-full">
                <Line data={lineChartData} options={lineOptions} />
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
