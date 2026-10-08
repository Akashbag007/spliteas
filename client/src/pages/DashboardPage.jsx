import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  PlusCircle,
  TrendingUp,
  PieChart as PieIcon,
  Bell,
  CheckCircle2,
  ChevronRight,
  FolderPlus,
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

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

export const DashboardPage = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalGroups: 0,
    totalExpensesAmount: 0,
    totalExpensesCount: 0,
    youOwe: 0,
    youAreOwed: 0,
    netBalance: 0,
  });
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentSettlements, setRecentSettlements] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectGroupModalOpen, setSelectGroupModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Parallel requests
        const [overviewRes, groupsRes, catRes, monthRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/groups'),
          api.get('/analytics/categories'),
          api.get('/analytics/monthly'),
        ]);

        if (overviewRes.data?.data) {
          setOverview(overviewRes.data.data);
        }

        const groupList = groupsRes.data?.data?.groups || [];
        setGroups(groupList);

        if (catRes.data?.data?.categories) {
          setCategoryData(catRes.data.data.categories);
        }

        if (monthRes.data?.data?.monthlyTrends) {
          setMonthlyData(monthRes.data.data.monthlyTrends);
        }

        // Fetch recent expenses across groups
        if (groupList.length > 0) {
          const sampleGroupId = groupList[0]._id;
          const [expRes, setRes] = await Promise.all([
            api.get(`/groups/${sampleGroupId}/expenses`),
            api.get(`/groups/${sampleGroupId}/settlements`),
          ]);
          setRecentExpenses(expRes.data?.data?.expenses?.slice(0, 5) || []);
          setRecentSettlements(setRes.data?.data?.settlements?.slice(0, 4) || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        toastError('Failed to load dashboard overview.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toastError]);

  const handleAddExpenseClick = () => {
    if (groups.length === 0) {
      navigate('/groups');
    } else if (groups.length === 1) {
      navigate(`/groups/${groups[0]._id}/expenses/add`);
    } else {
      setSelectGroupModalOpen(true);
    }
  };

  if (loading) {
    return <Loader message="Loading your financial dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your live financial snapshot and group debt balance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/groups')}
            icon={FolderPlus}
            size="md"
          >
            Create Group
          </Button>
          <Button
            onClick={handleAddExpenseClick}
            icon={PlusCircle}
            size="md"
            className="shadow-md shadow-emerald-600/20"
          >
            + Add Expense
          </Button>
        </div>
      </div>

      {/* TOP 5 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Groups */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Groups</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{overview.totalGroups}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active communities</p>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{overview.totalExpensesAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overview.totalExpensesCount} bills recorded
          </p>
        </div>

        {/* Card 3: You Owe */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">You Owe</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            ₹{overview.youOwe.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-rose-500/80 mt-1">Pending to pay</p>
        </div>

        {/* Card 4: You Are Owed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">You Are Owed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ₹{overview.youAreOwed.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-500/80 mt-1">Pending to receive</p>
        </div>

        {/* Card 5: Net Balance */}
        <div
          className={`col-span-2 md:col-span-1 rounded-2xl p-4 sm:p-5 border shadow-2xs ${
            overview.netBalance > 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : overview.netBalance < 0
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold opacity-75">Net Balance</span>
            <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black">
            {overview.netBalance > 0 ? '+' : ''}₹
            {overview.netBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] opacity-75 mt-1">
            {overview.netBalance > 0
              ? 'In the green overall'
              : overview.netBalance < 0
              ? 'Debt overall'
              : 'Completely settled'}
          </p>
        </div>
      </div>

      {/* Main Grid: Charts & Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Spending & Category Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Groups Overview */}
          <Card>
            <CardHeader
              action={
                <NavLink
                  to="/groups"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View All ({groups.length}) <ChevronRight className="w-3.5 h-3.5" />
                </NavLink>
              }
            >
              <CardTitle>Active Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <EmptyState
                  icon={Users2}
                  title="You don't have any groups yet."
                  description="Create a group for your roommates, trip, or project to begin tracking shared expenses."
                  actionLabel="Create Your First Group"
                  onAction={() => navigate('/groups')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {groups.slice(0, 4).map((g) => {
                    const isPositive = g.userBalance > 0;
                    const isNegative = g.userBalance < 0;

                    return (
                      <div
                        key={g._id}
                        onClick={() => navigate(`/groups/${g._id}`)}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-600/20">
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {g.name}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {g.members?.length || 0} members • {g.expenseCount || 0} bills
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <span className="text-slate-500">Your status:</span>
                          <span
                            className={`font-bold ${
                              isPositive
                                ? 'text-emerald-600'
                                : isNegative
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {isPositive
                              ? `+₹${g.userBalance.toLocaleString('en-IN')}`
                              : isNegative
                              ? `-₹${Math.abs(g.userBalance).toLocaleString('en-IN')}`
                              : 'Settled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Spending Trend Bar Chart */}
          <Card>
            <CardHeader
              action={
                <NavLink
                  to="/analytics"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Detailed Insights <ChevronRight className="w-3.5 h-3.5" />
                </NavLink>
              }
            >
              <CardTitle>Spending Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  No monthly trends yet. Add expenses to populate data!
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Category Breakdown & Recent Expenses */}
        <div className="space-y-6">
          {/* Category Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No category spending recorded.
                </div>
              ) : (
                <div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="amount"
                          nameKey="category"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 max-h-48 overflow-y-auto">
                    {categoryData.slice(0, 5).map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[cat.category] || '#64748b',
                            }}
                          />
                          <span className="font-medium text-slate-700">
                            {cat.category}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900">
                          ₹{cat.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Group Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No recent expenses recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((exp) => (
                    <div
                      key={exp._id}
                      onClick={() => navigate(`/expenses/${exp._id}`)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {exp.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Paid by {exp.paidBy?.name} • {new Date(exp.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 shrink-0 ml-2">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Select Group Modal for "+ Add Expense" */}
      <Modal
        isOpen={selectGroupModalOpen}
        onClose={() => setSelectGroupModalOpen(false)}
        title="Select Group"
        description="Choose which group you want to add this expense to:"
      >
        <div className="space-y-2.5">
          {groups.map((grp) => (
            <button
              key={grp._id}
              onClick={() => {
                setSelectGroupModalOpen(false);
                navigate(`/groups/${grp._id}/expenses/add`);
              }}
              className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{grp.name}</p>
                <p className="text-xs text-slate-500">
                  {grp.members?.length || 0} members • Currency: {grp.currency}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};
