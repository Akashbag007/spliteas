import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users2,
  Plus,
  Search,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Receipt,
  MoreVertical,
  PlusCircle,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/Avatar';

export const GroupsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for new group
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [creating, setCreating] = useState(false);

  const fetchGroups = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery ? `/groups?search=${encodeURIComponent(searchQuery)}` : '/groups';
      const res = await api.get(url);
      setGroups(res.data?.data?.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      toastError('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(search);
  }, [search]);

  const handleAddMemberEmail = (e) => {
    e.preventDefault();
    if (!memberEmailInput.trim()) return;
    const emailToAdd = memberEmailInput.trim().toLowerCase();
    if (memberEmails.includes(emailToAdd)) {
      toastError('This email is already added.');
      return;
    }
    setMemberEmails([...memberEmails, emailToAdd]);
    setMemberEmailInput('');
  };

  const handleRemoveMemberEmail = (idx) => {
    setMemberEmails(memberEmails.filter((_, i) => i !== idx));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Please enter a group name.');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/groups', {
        name,
        description,
        currency,
        memberEmails,
      });

      success(`Group "${name}" created successfully!`);
      setCreateModalOpen(false);
      setName('');
      setDescription('');
      setMemberEmails([]);
      fetchGroups(search);
      navigate(`/groups/${res.data.data.group._id}`);
    } catch (err) {
      console.error('Create group failed:', err);
      toastError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Expense Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your shared trips, household bills, and friend groups.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          icon={Plus}
          size="md"
        >
          Create New Group
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search groups by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9.5 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loader message="Loading your groups..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={search ? 'No groups matching your search' : 'No groups found'}
          description={
            search
              ? `We couldn't find any groups matching "${search}".`
              : 'Create your first expense group to start splitting hotel bills, dinners, and road trips!'
          }
          actionLabel="Create Group"
          onAction={() => setCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const isPositive = group.userBalance > 0;
            const isNegative = group.userBalance < 0;

            return (
              <div
                key={group._id}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-base border border-emerald-100 group-hover:scale-105 transition-transform">
                        {group.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {group.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Currency: {group.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {group.description}
                    </p>
                  )}

                  {/* Members Avatars preview */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex -space-x-2 overflow-hidden">
                      {group.members?.slice(0, 4).map((m, idx) => (
                        <Avatar
                          key={idx}
                          src={m.user?.avatar}
                          name={m.user?.name}
                          size="xs"
                          className="border-2 border-white ring-0"
                        />
                      ))}
                    </div>
                    {group.members?.length > 4 && (
                      <span className="text-[11px] font-semibold text-slate-400 ml-1.5">
                        +{group.members.length - 4} more
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {group.expenseCount || 0} expenses
                    </span>
                  </div>
                </div>

                {/* Footer Balance status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total spent</span>
                    <span className="font-bold text-slate-800">
                      ₹{(group.totalSpending || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Your balance</span>
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
                        ? `+₹${group.userBalance.toLocaleString('en-IN')}`
                        : isNegative
                        ? `-₹${Math.abs(group.userBalance).toLocaleString('en-IN')}`
                        : 'Settled (₹0)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Group"
        description="Set up an expense group to split bills with friends, family, or flatmates."
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. Goa Trip 2026, Flat 402, Team Dinner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="SGD">SGD ($) - Singapore Dollar</option>
            </select>
          </div>

          {/* Member emails */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Add Members by Email (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="friend@example.com"
                value={memberEmailInput}
                onChange={(e) => setMemberEmailInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddMemberEmail}>
                Add
              </Button>
            </div>

            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {memberEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberEmail(idx)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={creating}>
              Create Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
