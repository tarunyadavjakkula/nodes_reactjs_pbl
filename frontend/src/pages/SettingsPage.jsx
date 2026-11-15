import React, { useState } from 'react';
import { Settings, Moon, Sun, DollarSign, Check, Coins } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCurrencyChange = async (newCurrency) => {
    setSelectedCurrency(newCurrency);
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await api.put('/auth/profile', { currency: newCurrency });
      if (res.success && res.data) {
        updateUser({ currency: res.data.currency });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update currency:', err);
      setErrorMsg(err.message || 'Failed to update currency');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Preferences</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure appearance, default currencies, and application parameters.</p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Interface Theme */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme</h3>
            <p className="text-xs text-slate-500 mt-0.5">Switch between Light and Dark interface appearance</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold hover:border-indigo-500 transition-colors"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" /> Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" /> Light Mode
              </>
            )}
          </button>
        </div>

        {/* Active Currency */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Currency</h3>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <Check className="w-3 h-3" /> Saved!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Primary denomination used across your dashboard and financial records</p>
            {errorMsg && <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCurrency}
              disabled={isSaving}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="CAD">CAD (CA$) - Canadian Dollar</option>
              <option value="AUD">AUD (AU$) - Australian Dollar</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
