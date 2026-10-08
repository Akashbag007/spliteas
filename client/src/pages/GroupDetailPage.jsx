import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import {
  Users2,
  Receipt,
  Scale,
  HandCoins,
  BarChart3,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  UserPlus,
  Calendar,
  FileSpreadsheet,
  FileText,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { exportGroupToCSV, exportGroupToPDF } from '../utils/exportUtils';

const CATEGORY_COLORS = {
  Food: '#10b981',
  Travel: '#3b82f6',
  Hotel: '#8b5cf6',
  Shopping: '#ec4899',
  Entertainment: '#f59e0b',
  Education: '#06b6d4',
  Medical: '#ef4444',
  Rent: '#6366f1',
  Utilities: '#14b8a6',
  Other: '#64748b',
};

export const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const activeTab = searchParams.get('tab') || 'expenses';

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [balancesData, setBalancesData] = useState({
    balances: [],
    simplifiedDebts: [],
    totalGroupSpending: 0,
  });
  const [settlements, setSettlements] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Filters for expenses tab
  const [expenseSearch, setExpenseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modals
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [recordingSettle, setRecordingSettle] = useState(false);

  // Confirm delete dialogs
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [deleteGroupId, setDeleteGroupId] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAllGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const [grpRes, balRes, expRes, setRes, anaRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/balances`),
        api.get(`/groups/${groupId}/expenses?sort=${sortBy}`),
        api.get(`/groups/${groupId}/settlements`),
        api.get(`/analytics/group/${groupId}`),
      ]);

      setGroup(grpRes.data.data.group);
      setBalancesData(balRes.data.data);
      setExpenses(expRes.data.data.expenses || []);
      setSettlements(setRes.data.data.settlements || []);
      setAnalyticsData(anaRes.data.data || null);
    } catch (err) {
      console.error('Failed to load group details:', err);
      toastError(err.response?.data?.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  }, [groupId, sortBy, toastError]);

  useEffect(() => {
    fetchAllGroupData();
  }, [fetchAllGroupData]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      setAddingMember(true);
      const res = await api.post(`/groups/${groupId}/members`, {
        email: newMemberEmail.trim(),
      });
      success(res.data.message || 'Member added.');
      setGroup(res.data.data.group);
      setNewMemberEmail('');
      setAddMemberModalOpen(false);
      fetchAllGroupData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      success('Member removed from group.');
      fetchAllGroupData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // Record Settlement
  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settleFrom || !settleTo || !settleAmount) {
      toastError('Please fill in sender, recipient and amount.');
      return;
    }

    try {
      setRecordingSettle(true);
      await api.post(`/groups/${groupId}/settlements`, {
        from: settleFrom,
        to: settleTo,
        amount: parseFloat(settleAmount),
        notes: settleNotes,
        status: 'PAID',
      });
      success('Settlement payment recorded successfully!');
      setSettleModalOpen(false);
      setSettleFrom('');
      setSettleTo('');
      setSettleAmount('');
      setSettleNotes('');
      fetchAllGroupData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to record settlement.');
    } finally {
      setRecordingSettle(false);
    }
  };

  // Mark Settlement as Paid
  const handleMarkSettlementPaid = async (settlementId) => {
    try {
      await api.put(`/settlements/${settlementId}/settle`, { status: 'PAID' });
      success('Settlement marked as PAID.');
      fetchAllGroupData();
    } catch (err) {
      toastError('Failed to update settlement status.');
    }
  };

  // Delete Expense
  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      setDeleting(true);
      await api.delete(`/expenses/${deleteExpenseId}`);
      success('Expense deleted.');
      setDeleteExpenseId(null);
      fetchAllGroupData();
    } catch (err) {
      toastError('Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  // Delete Group
  const confirmDeleteGroup = async () => {
    try {
      setDeleting(true);
      await api.delete(`/groups/${groupId}`);
      success('Group deleted.');
      navigate('/groups');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete group.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      !expenseSearch ||
      e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.notes?.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || e.category === categoryFilter;
    const matchesMember =
      memberFilter === 'All' ||
      e.paidBy?._id === memberFilter ||
      e.participants?.some((p) => p.user?._id === memberFilter);
    return matchesSearch && matchesCategory && matchesMember;
  });

  if (loading && !group) {
    return <Loader message="Loading group details..." />;
  }

  if (!group) {
    return (
      <EmptyState
        icon={Users2}
        title="Group Not Found"
        description="The group you are looking for does not exist or you do not have permission to view it."
        actionLabel="Back to Groups"
        onAction={() => navigate('/groups')}
      />
    );
  }

  const isCreator = group.createdBy?._id === user?._id;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Group Header Hero */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              {group.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {group.name}
                </h1>
                <Badge variant="emerald">{group.currency}</Badge>
              </div>
              {group.description && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                  {group.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                <span>Created by {group.createdBy?.name || 'Admin'}</span>
                <span>•</span>
                <span>{group.members?.length} members</span>
                <span>•</span>
                <span>{expenses.length} expenses recorded</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Summary */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => setAddMemberModalOpen(true)}
              icon={UserPlus}
            >
              Add Member
            </Button>
            <Button
              size="md"
              onClick={() => navigate(`/groups/${groupId}/expenses/add`)}
              icon={Plus}
              className="shadow-md shadow-emerald-600/20"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Group Totals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Spending
            </span>
            <p className="text-lg font-bold text-slate-900">
              ₹{(balancesData.totalGroupSpending || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Your Share
            </span>
            <p className="text-lg font-bold text-slate-900">
              ₹
              {(
                balancesData.balances.find((b) => b.user?._id === user?._id)
                  ?.totalShare || 0
              ).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Your Total Paid
            </span>
            <p className="text-lg font-bold text-slate-900">
              ₹
              {(
                balancesData.balances.find((b) => b.user?._id === user?._id)
                  ?.totalPaid || 0
              ).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Your Net Status
            </span>
            {(() => {
              const uBalance =
                balancesData.balances.find((b) => b.user?._id === user?._id)
                  ?.netBalance || 0;
              return (
                <p
                  className={`text-lg font-bold ${
                    uBalance > 0
                      ? 'text-emerald-600'
                      : uBalance < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {uBalance > 0
                    ? `+₹${uBalance.toLocaleString('en-IN')}`
                    : uBalance < 0
                    ? `-₹${Math.abs(uBalance).toLocaleString('en-IN')}`
                    : 'Settled'}
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-0.5">
        {[
          { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenses.length },
          { id: 'balances', label: 'Balances & Debts', icon: Scale },
          { id: 'settlements', label: 'Settlements', icon: HandCoins, count: settlements.length },
          { id: 'members', label: 'Members', icon: Users2, count: group.members?.length },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'export', label: 'Export Report', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Member Filter */}
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Members</option>
                {group.members?.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.name}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses found"
              description="No expenses match your filters or no bills have been added yet."
              actionLabel="Add Expense"
              onAction={() => navigate(`/groups/${groupId}/expenses/add`)}
              actionIcon={Plus}
            />
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const userParticipant = exp.participants?.find(
                  (p) => p.user?._id === user?._id
                );
                const isPayer = exp.paidBy?._id === user?._id;

                return (
                  <div
                    key={exp._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[exp.category] || '#10b981',
                        }}
                      >
                        <Receipt className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <NavLink
                            to={`/expenses/${exp._id}`}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors truncate"
                          >
                            {exp.title}
                          </NavLink>
                          <Badge variant="default" size="sm">
                            {exp.category}
                          </Badge>
                          {exp.receipt && (
                            <Badge variant="blue" size="sm">
                              Receipt Attached
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Paid by <strong className="text-slate-700">{exp.paidBy?.name}</strong> •{' '}
                          {new Date(exp.date).toLocaleDateString()} • Split method:{' '}
                          <span className="capitalize">{exp.splitType}</span> ({exp.participants?.length} members)
                        </p>

                        {exp.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                            &quot;{exp.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: Amount & User share badge */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-slate-900 block">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                        {isPayer ? (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            You paid full
                          </span>
                        ) : userParticipant ? (
                          <span className="text-[11px] font-semibold text-rose-600">
                            Your share: ₹{userParticipant.shareAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Not involved
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <NavLink
                          to={`/expenses/${exp._id}`}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </NavLink>
                        <NavLink
                          to={`/expenses/${exp._id}/edit`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </NavLink>
                        <button
                          onClick={() => setDeleteExpenseId(exp._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BALANCES & DEBT SIMPLIFICATION */}
      {activeTab === 'balances' && (
        <div className="space-y-8">
          {/* DEBT SIMPLIFICATION SECTION: "Who Owes Whom?" */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/60">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Simplified Settlement Plan
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Who owes whom?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Greedy debt minimization converts individual balances into the minimum practical payments.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setSettleModalOpen(true)}
                icon={HandCoins}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                Record Payment
              </Button>
            </div>

            {balancesData.simplifiedDebts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-bold text-white">Everyone is settled up!</p>
                <p className="text-xs text-slate-400 mt-1">
                  No outstanding debts are currently owed in this group.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balancesData.simplifiedDebts.map((debt, index) => {
                  const isYouDebtor = debt.from._id === user?._id;
                  const isYouCreditor = debt.to._id === user?._id;

                  return (
                    <div
                      key={index}
                      className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-md hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={debt.from.avatar}
                          name={debt.from.name}
                          size="sm"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">
                            <span className="text-rose-400">
                              {debt.from.name} {isYouDebtor && '(You)'}
                            </span>
                            <span className="text-slate-400 mx-1.5 font-normal">
                              owes
                            </span>
                            <span className="text-emerald-400">
                              {debt.to.name} {isYouCreditor && '(You)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Direct settlement
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-white">
                          ₹{debt.amount.toLocaleString('en-IN')}
                        </span>
                        <Button
                          size="sm"
                          variant="subtle"
                          className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs py-1 px-2.5"
                          onClick={() => {
                            setSettleFrom(debt.from._id);
                            setSettleTo(debt.to._id);
                            setSettleAmount(debt.amount.toString());
                            setSettleModalOpen(true);
                          }}
                        >
                          Settle Up
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INDIVIDUAL BALANCES LEDGER TABLE */}
          <Card>
            <CardHeader>
              <CardTitle>Member Balances Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3">Total Paid</th>
                      <th className="py-3 px-3">Total Share</th>
                      <th className="py-3 px-3">Settled (Paid / Recv)</th>
                      <th className="py-3 px-3">Net Balance</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {balancesData.balances.map((item) => {
                      const isMe = item.user._id === user?._id;
                      const isOwed = item.status === 'OWED';
                      const isOwes = item.status === 'OWES';

                      return (
                        <tr
                          key={item.user._id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isMe ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 flex items-center gap-2.5">
                            <Avatar
                              src={item.user.avatar}
                              name={item.user.name}
                              size="sm"
                            />
                            <div>
                              <p className="font-bold text-slate-900">
                                {item.user.name} {isMe && '(You)'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.user.email}
                              </p>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            ₹{item.totalPaid.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            ₹{item.totalShare.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-3 text-slate-500 font-medium">
                            ₹{item.settledPaid.toLocaleString('en-IN')} / ₹
                            {item.settledReceived.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`font-bold ${
                                isOwed
                                  ? 'text-emerald-600'
                                  : isOwes
                                  ? 'text-rose-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {isOwed ? '+' : ''}₹
                              {item.netBalance.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isOwed ? (
                              <Badge variant="emerald">You are owed</Badge>
                            ) : isOwes ? (
                              <Badge variant="rose">You owe</Badge>
                            ) : (
                              <Badge variant="default">Settled</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recorded Settlements
              </h3>
              <p className="text-xs text-slate-500">
                Keep track of offline cash transfers and UPI payments
              </p>
            </div>
            <Button
              size="md"
              onClick={() => setSettleModalOpen(true)}
              icon={HandCoins}
            >
              Record Payment
            </Button>
          </div>

          {settlements.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No settlements recorded yet"
              description="When a member pays back debt via UPI, cash, or bank transfer, record it here to keep balances accurate."
              actionLabel="Record Settlement"
              onAction={() => setSettleModalOpen(true)}
              actionIcon={HandCoins}
            />
          ) : (
            <div className="space-y-3">
              {settlements.map((setRecord) => {
                const isPaid = setRecord.status === 'PAID';
                const isPending = setRecord.status === 'PENDING';

                return (
                  <div
                    key={setRecord._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <HandCoins className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {setRecord.from?.name}
                          </span>
                          <span className="text-xs text-slate-400">paid</span>
                          <span className="font-bold text-sm text-emerald-700">
                            {setRecord.to?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(setRecord.createdAt).toLocaleDateString()} •{' '}
                          {setRecord.notes || 'Direct payment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{setRecord.amount.toLocaleString('en-IN')}
                      </span>

                      {isPaid ? (
                        <Badge variant="emerald" icon={CheckCircle2}>
                          PAID
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="amber" icon={Clock}>
                            PENDING
                          </Badge>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleMarkSettlementPaid(setRecord._id)}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Group Members</h3>
              <p className="text-xs text-slate-500">
                People authorized to add and split expenses in this group
              </p>
            </div>
            <Button
              size="md"
              onClick={() => setAddMemberModalOpen(true)}
              icon={UserPlus}
            >
              Add Member
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.members?.map((m) => {
              const isMemberCreator = m.user?._id === group.createdBy?._id;
              const isCurrentUser = m.user?._id === user?._id;

              return (
                <div
                  key={m.user?._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={m.user?.avatar}
                      name={m.user?.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {m.user?.name} {isCurrentUser && '(You)'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {m.user?.email}
                      </p>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mt-1">
                        {isMemberCreator ? 'Group Creator' : m.role}
                      </span>
                    </div>
                  </div>

                  {!isMemberCreator && (isCreator || isCurrentUser) && (
                    <button
                      onClick={() => handleRemoveMember(m.user?._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Delete Group Card (Creator only) */}
          {isCreator && (
            <div className="mt-8 p-5 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-rose-900">Delete this group</h4>
                <p className="text-xs text-rose-600 mt-0.5">
                  Permanently deletes the group, its expenses, and all settlement records.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteGroupId(true)}
              >
                Delete Group
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsData && (
            <>
              {/* Analytics Top Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs text-slate-500 font-semibold">Total Expenses</span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    ₹{(analyticsData.totalSpending || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Across {analyticsData.expenseCount} entries
                  </p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs text-slate-500 font-semibold">Average Expense</span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    ₹{(analyticsData.averageExpense || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Per transaction</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs text-slate-500 font-semibold">Highest Expense</span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    ₹{(analyticsData.highestExpense?.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {analyticsData.highestExpense?.title || 'None'}
                  </p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-xs text-slate-500 font-semibold">Top Category</span>
                  <div className="text-xl font-black text-emerald-600 mt-1 truncate">
                    {analyticsData.mostExpensiveCategory || 'N/A'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Highest spend area</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categories || []}
                            dataKey="amount"
                            nameKey="category"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {(analyticsData.categories || []).map((entry, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                      {analyticsData.categories?.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{cat.category}</span>
                          <span className="font-bold text-slate-900">
                            ₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Member Contribution Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Member Contributions (Paid vs Share)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.memberContributions || []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(val, name) => [
                              `₹${val.toLocaleString('en-IN')}`,
                              name === 'totalPaid' ? 'Paid' : 'Share',
                            ]}
                          />
                          <Bar
                            dataKey="totalPaid"
                            name="Paid"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="totalShare"
                            name="Share"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 6: EXPORT REPORT */}
      {activeTab === 'export' && (
        <Card>
          <CardHeader>
            <CardTitle>Export Group Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-xl leading-relaxed">
              Generate full auditing reports for this group. The export includes all detailed expenses,
              member shares, net balances, and settlement transactions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">PDF Report</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Printable formatted document with branded tables and headers.
                  </p>
                </div>
                <Button
                  size="md"
                  className="mt-5 w-full"
                  icon={Download}
                  onClick={() =>
                    exportGroupToPDF(
                      group,
                      expenses,
                      balancesData.balances,
                      settlements,
                      balancesData.totalGroupSpending
                    )
                  }
                >
                  Download PDF
                </Button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">CSV Spreadsheet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Raw tabular data compatible with Microsoft Excel and Google Sheets.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="md"
                  className="mt-5 w-full"
                  icon={Download}
                  onClick={() =>
                    exportGroupToCSV(
                      group,
                      expenses,
                      balancesData.balances,
                      settlements
                    )
                  }
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Add Member to Group"
        description="Enter the email address of the person you want to invite."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Member Email
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddMemberModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addingMember}>
              Add to Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Settlement Modal */}
      <Modal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        title="Record Debt Settlement"
        description="Mark money paid between two members to update balances."
      >
        <form onSubmit={handleRecordSettlement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Who Paid? (Payer)
            </label>
            <select
              value={settleFrom}
              onChange={(e) => setSettleFrom(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
            >
              <option value="">Select Member</option>
              {group.members?.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Who Received? (Recipient)
            </label>
            <select
              value={settleTo}
              onChange={(e) => setSettleTo(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
            >
              <option value="">Select Member</option>
              {group.members?.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 500"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Google Pay transfer"
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={recordingSettle}>
              Record as Paid
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Expense Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteExpenseId)}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This will recalculate all group member balances."
        isLoading={deleting}
      />

      {/* Confirm Delete Group Dialog */}
      <ConfirmDialog
        isOpen={deleteGroupId}
        onClose={() => setDeleteGroupId(false)}
        onConfirm={confirmDeleteGroup}
        title="Delete Group"
        message="This action cannot be undone. All expenses, settlements, and balances will be permanently removed."
        isLoading={deleting}
      />
    </div>
  );
};
