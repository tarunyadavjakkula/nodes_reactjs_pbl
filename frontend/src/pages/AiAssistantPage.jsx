import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CheckCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export const AiAssistantPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'How much did I spend this month?',
    'Where am I spending the most money?',
    'How can I save more money this month?',
    'Am I close to exceeding any of my budgets?',
    'Can I afford a 5000 purchase right now?',
    'Apply the 50/30/20 budgeting rule to my income',
  ];

  // Fetch financial context on mount
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await api.get('/ai/context');
        if (res.success && res.data) {
          setContext(res.data);
        }
      } catch (err) {
        console.error('Failed to load AI financial context:', err);
      }
    };

    fetchContext();

    // Initial greeting
    setMessages([
      {
        sender: 'ai',
        text: `Hello ${user?.name || 'there'}! I am your SpendWise AI Financial Copilot. I have analyzed your income, expense transactions, active budgets, and savings goals.\n\nAsk me anything about your finances, or pick one of the suggestions below!`,
        recommendations: [],
      },
    ]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: query });
      if (res.success && res.data) {
        const aiMsg = {
          sender: 'ai',
          text: res.data.reply,
          recommendations: res.data.recommendations || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I encountered an error analyzing your data. Please ensure your backend is reachable and try again.',
          recommendations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        sender: 'ai',
        text: `Chat reset. What financial question can I help you explore next?`,
        recommendations: [],
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Financial Assistant
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intelligent spending analysis, personalized savings recommendations, and real-time budget forecasting.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-[600px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <p className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400">
                        Actionable Recommendations:
                      </p>
                      {m.recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-1.5 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Analyzing transactions & formulating advice...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-[11px] font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your spending, budget, or financial goals..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Live Context Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Financial Context
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Balance</span>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatCurrency(context?.summary?.availableBalance || 0, user?.currency)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Income</span>
                  <span className="font-semibold text-emerald-600 font-mono">
                    {formatCurrency(context?.summary?.totalIncome || 0, user?.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Spent</span>
                  <span className="font-semibold text-rose-600 font-mono">
                    {formatCurrency(context?.summary?.totalExpense || 0, user?.currency)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block">Savings Discipline</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {context?.summary?.savingsRate || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              💡 Smart Budgeting Tip
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Automate moving 10-20% of your earnings into Savings Goals on the day you get paid. This ensures you pay yourself first!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;

