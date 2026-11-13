import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft,
  PlusCircle,
  ScanLine,
  Upload,
  CheckCircle,
  Loader2,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  FileText,
} from 'lucide-react';
import Tesseract from 'tesseract.js';

export const AddTransactionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Credit Card',
    description: '',
  });

  // Receipt Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success && res.data) {
          setCategories(res.data);
          // Set default category
          const firstExp = res.data.find((c) => c.type === 'expense');
          if (firstExp) {
            setFormData((prev) => ({ ...prev, category_id: firstExp.id }));
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Update category when type changes
  const handleTypeChange = (newType) => {
    const matchingCat = categories.find((c) => c.type === newType);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category_id: matchingCat ? matchingCat.id : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Transaction title is required.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formData.category_id) {
      setError('Please select a category.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id, 10),
      });

      if (res.success) {
        navigate('/transactions');
      }
    } catch (err) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Smart Receipt OCR & Auto-fill
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanProgress(0);
    setScanStatus('Initializing OCR engine...');
    setScanSuccess(false);
    setError('');

    try {
      // 1. Client-side OCR using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
            setScanStatus(`Scanning receipt: ${Math.round(m.progress * 100)}%`);
          } else {
            setScanStatus(m.status);
          }
        },
      });

      setScanStatus('Analyzing receipt data...');

      // 2. Send parsed OCR text to smart receipt endpoint
      const res = await api.post('/receipts/scan', { text });
      if (res.success && res.data) {
        const parsed = res.data;

        // Find matching category ID if available
        let matchedCatId = formData.category_id;
        if (parsed.category) {
          const found = categories.find(
            (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
          );
          if (found) matchedCatId = found.id;
        }

        setFormData((prev) => ({
          ...prev,
          title: parsed.merchant || prev.title || 'Scanned Receipt',
          amount: parsed.amount ? parsed.amount.toString() : prev.amount,
          date: parsed.date || prev.date,
          category_id: matchedCatId,
          payment_method: parsed.payment_method || prev.payment_method,
          description: `Auto-scanned receipt from ${parsed.merchant || 'Store'}. Items: ${
            parsed.items?.map((i) => `${i.name} ($${i.price})`).join(', ') || 'N/A'
          }`,
        }));

        setScanSuccess(true);
      }
    } catch (err) {
      console.error('OCR scanning error:', err);
      setError('Could not scan receipt. Please enter transaction details manually.');
    } finally {
      setScanning(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Transactions
      </button>

      {/* Smart Receipt Scanner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Smart Receipt Scanner</h3>
              <p className="text-xs text-slate-500">
                Upload a bill or receipt to automatically extract merchant, date, and amount.
              </p>
            </div>
          </div>

          <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0">
            <Upload className="w-4 h-4" />
            <span>Upload Receipt</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptUpload}
              disabled={scanning}
            />
          </label>
        </div>

        {scanning && (
          <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium mb-1.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{scanStatus}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {scanSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl">
            <CheckCircle className="w-4 h-4" />
            <span>Receipt scanned successfully! Details have been auto-populated below.</span>
          </div>
        )}
      </div>

      {/* Main Form */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Record Transaction</h1>
            <p className="text-xs text-slate-500">Fill in the details for your new record</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium border border-rose-100 dark:border-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income vs Expense Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  formData.type === 'expense'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  formData.type === 'income'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title / Payee <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Grocery shopping, Client payment, Shell fuel"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount ({user?.currency || 'USD'}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/categories"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  + Manage Categories
                </Link>
              </div>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI / Online">UPI / Online</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes / Description (Optional)
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Additional details, itemized notes, or tags..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionPage;
