import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Filter,
} from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load financial report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('spendwise_token');
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `http://localhost:5001/api/reports/export-csv?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendwise-financial-report-${period}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Reports & Statements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate formal periodic statements, export structured CSV spreadsheets, or print for accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          {['monthly', 'weekly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setStartDate('');
                setEndDate('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === p && !startDate
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Custom Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
        </div>
      </div>

      {/* Printable Financial Statement Body */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Compiling financial statement...
        </div>
      ) : report ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Statement Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                SpendWise Official Statement
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statement Period: <strong className="text-slate-800 dark:text-slate-200 font-mono">{report.period.startDate}</strong> to <strong className="text-slate-800 dark:text-slate-200 font-mono">{report.period.endDate}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Statement Summary KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">Total Income</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
                {formatCurrency(report.summary.totalIncome, user?.currency)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">Total Expenses</span>
              <p className="text-xl font-bold text-rose-600 font-mono mt-1">
                {formatCurrency(report.summary.totalExpense, user?.currency)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">Net Period Savings</span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {formatCurrency(report.summary.netSavings, user?.currency)}
              </p>
            </div>
          </div>

          {/* Category Allocation Table */}
          {report.categories?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Category Spending Allocation
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                      <th className="py-2">Category</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Transactions</th>
                      <th className="py-2 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.categories.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{c.name}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.type === 'income'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500">{c.count}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(c.total, user?.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction Ledger Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Itemized Transaction Records ({report.transactions?.length || 0})
            </h3>
            {report.transactions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                      <th className="py-2">Date</th>
                      <th className="py-2">Title</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Payment</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 font-mono text-[11px] text-slate-500">{tx.date}</td>
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{tx.title}</td>
                        <td className="py-2.5 text-slate-500">{tx.category_name}</td>
                        <td className="py-2.5 text-slate-500">{tx.payment_method}</td>
                        <td
                          className={`py-2.5 text-right font-mono font-bold ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, user?.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No transactions recorded in this period.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
