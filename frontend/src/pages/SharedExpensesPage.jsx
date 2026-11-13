import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Users,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  ArrowRight,
  UserPlus,
  Receipt,
  Scale,
  Loader2,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const SharedExpensesPage = () => {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Group Modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newMembersInput, setNewMembersInput] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Add Member Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Add Expense Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitType, setExpSplitType] = useState('equal');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingExpense, setAddingExpense] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shared-groups');
      if (res.success && res.data) {
        setGroups(res.data);
        if (res.data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (id) => {
    if (!id) return;
    try {
      setLoadingDetails(true);
      const res = await api.get(`/shared-groups/${id}`);
      if (res.success && res.data) {
        setGroupDetails(res.data);
        if (res.data.members?.length > 0 && !expPaidBy) {
          setExpPaidBy(res.data.members[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setCreatingGroup(true);
      const members = newMembersInput
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const res = await api.post('/shared-groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        members,
      });

      if (res.success && res.data) {
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setNewMembersInput('');
        await fetchGroups();
        setSelectedGroupId(res.data.group.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !selectedGroupId) return;

    try {
      setAddingMember(true);
      const res = await api.post(`/shared-groups/${selectedGroupId}/members`, {
        name: newMemberName.trim(),
      });
      if (res.success) {
        setShowAddMember(false);
        setNewMemberName('');
        fetchGroupDetails(selectedGroupId);
      }
    } catch (err) {
      alert(err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || parseFloat(expAmount) <= 0 || !selectedGroupId) return;

    try {
      setAddingExpense(true);
      const res = await api.post(`/shared-groups/${selectedGroupId}/expenses`, {
        title: expTitle.trim(),
        amount: parseFloat(expAmount),
        paid_by: expPaidBy || groupDetails?.members?.[0]?.name || 'You',
        split_type: expSplitType,
        date: expDate,
      });

      if (res.success) {
        setShowAddExpense(false);
        setExpTitle('');
        setExpAmount('');
        fetchGroupDetails(selectedGroupId);
        fetchGroups();
      }
    } catch (err) {
      alert(err.message || 'Failed to record shared expense');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this shared expense?')) return;
    try {
      await api.delete(`/shared-groups/${selectedGroupId}/expenses/${expenseId}`);
      fetchGroupDetails(selectedGroupId);
      fetchGroups();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this entire group and its expense history?')) return;
    try {
      await api.delete(`/shared-groups/${groupId}`);
      setSelectedGroupId(null);
      setGroupDetails(null);
      fetchGroups();
    } catch (err) {
      alert(err.message || 'Failed to delete group');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Shared Expense Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Split costs equally or custom with friends, roommates, and travel groups. Automated "Who Owes Whom" calculation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateGroup(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      </div>

      {/* Main Layout */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading shared groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No shared groups yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create groups for roommates, dinner splits, or trips. SpendWise calculates net settlements automatically.
          </p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Your Groups ({groups.length})
            </h3>
            <div className="space-y-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGroupId === g.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {g.total_members} members • {formatCurrency(g.total_expenses, user?.currency)} spent
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(g.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Group Details & Ledger */}
          <div className="lg:col-span-2 space-y-6">
            {loadingDetails || !groupDetails ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading ledger & settlement matrix...
              </div>
            ) : (
              <>
                {/* Group Summary Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {groupDetails.group.name}
                        </h2>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {groupDetails.members.length} members
                        </span>
                      </div>
                      {groupDetails.group.description && (
                        <p className="text-xs text-slate-500 mt-1">{groupDetails.group.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add Member
                      </button>
                      <button
                        onClick={() => setShowAddExpense(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Add Shared Bill
                      </button>
                    </div>
                  </div>

                  {/* Members Chips */}
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Members:</span>
                    {groupDetails.members.map((m) => (
                      <span
                        key={m.id}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Who Owes Whom (Settlements Matrix) */}
                <div className="p-6 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                        Smart Debt Settlement (Who Owes Whom)
                      </h3>
                    </div>
                    <span className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                      Total Group Spent: {formatCurrency(groupDetails.totalSpent, user?.currency)}
                    </span>
                  </div>

                  {groupDetails.settlements?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {groupDetails.settlements.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-600">{s.from}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-emerald-600">{s.to}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(s.amount, user?.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      ⚖️ All balances are fully settled! No outstanding debts in this group.
                    </div>
                  )}
                </div>

                {/* Expenses Ledger */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Group Expense Ledger ({groupDetails.expenses.length})
                    </h3>
                  </div>

                  {groupDetails.expenses?.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupDetails.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{exp.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Paid by <strong className="text-indigo-600">{exp.paid_by}</strong> • {exp.date} • Split equally ({groupDetails.members.length} ways)
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                              {formatCurrency(exp.amount, user?.currency)}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-500">
                      No shared expenses logged in this group yet. Click "Add Shared Bill" to record one!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Shared Expense Group
              </h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Flatmates 302, Weekend Outing"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shared grocery, rent, travel, electricity bills"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Initial Member Names (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex, Rahul, Priya, Sam"
                  value={newMembersInput}
                  onChange={(e) => setNewMembersInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  "You" is automatically included as a member.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Member to {groupDetails?.group.name}
              </h3>
              <button onClick={() => setShowAddMember(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Friend / Roommate Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shared Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Shared Bill / Expense
              </h3>
              <button onClick={() => setShowAddExpense(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dinner at BBQ Nation, Groceries, WiFi bill"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
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
                    min="1"
                    placeholder="e.g. 1200.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Paid By
                  </label>
                  <select
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {groupDetails?.members?.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Split Type
                  </label>
                  <select
                    value={expSplitType}
                    onChange={(e) => setExpSplitType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="equal">Equally across all members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingExpense}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingExpense ? 'Recording...' : 'Record & Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedExpensesPage;

