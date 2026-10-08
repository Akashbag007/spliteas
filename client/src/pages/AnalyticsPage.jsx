import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Receipt,
  Scale,
  Award,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../api/axios';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { Badge } from '../components/common/Badge';

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

export const AnalyticsPage = () => {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [globalRes, monthlyRes] = await Promise.all([
          api.get('/analytics/global'),
          api.get('/analytics/monthly'),
        ]);

        setGlobalData(globalRes.data.data);
        setMonthlyTrends(monthlyRes.data.data.monthlyTrends || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        toastError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toastError]);

  if (loading) {
    return <Loader message="Generating spending analytics & charts..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Financial Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed breakdown of your shared expenditures across categories and monthly trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Share Spent</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(globalData?.totalSpending || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all groups</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Average Expense</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(globalData?.averageExpense || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Per transaction share</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Highest Expense</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(globalData?.highestExpense?.amount || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {globalData?.highestExpense?.title || 'None'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Top Category</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 truncate">
            {globalData?.mostExpensiveCategory || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Most frequented expense</p>
        </div>
      </div>

      {/* Row 1: Category Breakdown & Group Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {(!globalData?.categories || globalData.categories.length === 0) ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No category data available yet.
              </div>
            ) : (
              <div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={globalData.categories}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {globalData.categories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']}
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

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  {globalData.categories.map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[c.category] || '#64748b',
                          }}
                        />
                        <span className="text-slate-600">{c.category}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{c.amount.toLocaleString('en-IN')} ({c.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Spending Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Group</CardTitle>
          </CardHeader>
          <CardContent>
            {(!globalData?.groupSpending || globalData.groupSpending.length === 0) ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No group spending recorded yet.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={globalData.groupSpending}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="groupName"
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Group Total']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Monthly Trends Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No trend data available yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, name) => [
                      `₹${val.toLocaleString('en-IN')}`,
                      name === 'yourShare'
                        ? 'Your Share'
                        : name === 'paidByYou'
                        ? 'Paid By You'
                        : 'Total Group Spend',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="yourShare"
                    name="Your Share"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="paidByYou"
                    name="Paid By You"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Group Spend"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
