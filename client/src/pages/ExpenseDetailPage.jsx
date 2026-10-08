import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Calendar,
  User,
  Tag,
  FileText,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  Users,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Loader } from '../components/common/Loader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ExpenseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/expenses/${id}`);
        setExpense(res.data.data.expense);
      } catch (err) {
        console.error('Failed to load expense:', err);
        toastError('Failed to load expense details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, toastError]);

  const handleDeleteExpense = async () => {
    try {
      setDeleting(true);
      await api.delete(`/expenses/${id}`);
      success('Expense deleted successfully.');
      navigate(`/groups/${expense.groupId._id}`);
    } catch (err) {
      toastError('Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading expense details..." />;
  }

  if (!expense) {
    return (
      <div className="py-12 text-center text-slate-500">
        Expense not found.
      </div>
    );
  }

  const isPayer = expense.paidBy?._id === user?._id;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top back button & action buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/groups/${expense.groupId?._id || ''}`)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {expense.groupId?.name || 'Group'}</span>
        </button>

        <div className="flex items-center gap-2">
          <NavLink to={`/expenses/${id}/edit`}>
            <Button variant="outline" size="sm" icon={Edit2}>
              Edit
            </Button>
          </NavLink>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Expense Details Card */}
      <Card>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="emerald">{expense.category}</Badge>
                <span className="text-xs text-slate-400">
                  in {expense.groupId?.name}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {expense.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(expense.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
            </div>

            {/* Total Amount Box */}
            <div className="sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Amount
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{expense.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Paid By section */}
          <div className="py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={expense.paidBy?.avatar}
                name={expense.paidBy?.name}
                size="md"
              />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Paid Full Amount By
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {expense.paidBy?.name} {isPayer && '(You)'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Paid ₹{expense.amount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Notes if present */}
          {expense.notes && (
            <div className="py-5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Notes
              </span>
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                &quot;{expense.notes}&quot;
              </p>
            </div>
          )}

          {/* SPLIT BREAKDOWN TABLE */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Split Breakdown ({expense.splitType})</span>
              </h3>
              <span className="text-xs text-slate-400">
                {expense.participants?.length} participants
              </span>
            </div>

            <div className="space-y-2">
              {expense.participants?.map((p, idx) => {
                const isUserParticipant = p.user?._id === user?._id;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isUserParticipant
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={p.user?.avatar}
                        name={p.user?.name}
                        size="xs"
                      />
                      <span className="font-bold text-slate-800">
                        {p.user?.name} {isUserParticipant && '(You)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {expense.splitType === 'percentage' && p.inputValue && (
                        <span className="text-slate-400 font-medium">
                          {p.inputValue}%
                        </span>
                      )}
                      {expense.splitType === 'shares' && p.inputValue && (
                        <span className="text-slate-400 font-medium">
                          {p.inputValue} {p.inputValue === 1 ? 'share' : 'shares'}
                        </span>
                      )}
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{p.shareAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECEIPT ATTACHMENT SECTION */}
          {expense.receipt && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Attached Receipt / Bill
              </span>

              {expense.receipt.endsWith('.pdf') ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900">
                      Receipt PDF Document
                    </p>
                  </div>
                  <a
                    href={expense.receipt}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>View PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 overflow-hidden max-w-sm">
                  <a href={expense.receipt} target="_blank" rel="noreferrer">
                    <img
                      src={expense.receipt}
                      alt="Receipt"
                      className="w-full h-auto object-cover hover:scale-102 transition-transform cursor-pointer"
                    />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? All balances in this group will be updated."
        isLoading={deleting}
      />
    </div>
  );
};
