import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  ScanLine,
  Upload,
  CheckCircle,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Tag,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Tesseract from 'tesseract.js';

export const ReceiptScannerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Shopping & Retail');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setScanning(true);
    setScanProgress(0);
    setScanStatus('Initializing OCR engine...');
    setError('');
    setScannedData(null);

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
            setScanStatus(`Extracting text from receipt: ${Math.round(m.progress * 100)}%`);
          } else {
            setScanStatus(m.status);
          }
        },
      });

      setScanStatus('Parsing merchant and totals...');

      const res = await api.post('/receipts/scan', { text });
      if (res.success && res.data) {
        const parsed = res.data;
        setScannedData(parsed);
        setTitle(parsed.merchant || 'Store Receipt');
        setAmount(parsed.amount ? parsed.amount.toString() : '');
        setDate(parsed.date || new Date().toISOString().split('T')[0]);
        setCategory(parsed.category || 'Shopping & Retail');
        setPaymentMethod(parsed.payment_method || 'Credit Card');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Could not scan the receipt text. You can still enter details manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Title and positive amount are required.');
      return;
    }

    try {
      setSaving(true);
      // Fetch categories to get id
      const catRes = await api.get('/categories');
      let catId = null;
      if (catRes.success && catRes.data) {
        const found = catRes.data.find(
          (c) => c.name.toLowerCase() === category.toLowerCase() && c.type === 'expense'
        );
        catId = found ? found.id : catRes.data[0].id;
      }

      await api.post('/transactions', {
        title: title.trim(),
        amount: parseFloat(amount),
        type: 'expense',
        category_id: catId,
        date: date || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        description: `Scanned with Smart Receipt OCR. Confidence: ${Math.round(
          (scannedData?.confidence || 0.9) * 100
        )}%`,
      });

      navigate('/transactions');
    } catch (err) {
      setError(err.message || 'Failed to save scanned transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <ScanLine className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Receipt Scanner
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload any bill or receipt to automatically detect merchant name, transaction date, and total amount via OCR.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload & Preview Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Receipt Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Supports JPEG, PNG, WEBP receipt photos and scanned invoices.
            </p>

            <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to browse or drag & drop receipt
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">High contrast photos yield best accuracy</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={scanning}
                className="hidden"
              />
            </label>
          </div>

          {scanning && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
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

          {imagePreview && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-60">
              <img
                src={imagePreview}
                alt="Receipt preview"
                className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800"
              />
            </div>
          )}
        </div>

        {/* Extracted Transaction Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Extracted Information
              </h3>
              <p className="text-xs text-slate-500">Review and confirm before saving</p>
            </div>
            {scannedData && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> Scanned
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Merchant / Store Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Starbucks, Walmart, Shell"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Amount ({user?.currency || 'USD'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Detected Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation & Travel">Transportation & Travel</option>
                  <option value="Shopping & Retail">Shopping & Retail</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Entertainment & Leisure">Entertainment & Leisure</option>
                  <option value="Other Expenses">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Online</option>
                </select>
              </div>
            </div>

            {scannedData?.items?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Itemized Line Breakdown ({scannedData.items.length} items)
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
                  {scannedData.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{it.name}</span>
                      <span className="font-mono">{formatCurrency(it.price, user?.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving || !amount}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Save to My Transactions</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerPage;

