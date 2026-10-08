import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { Avatar } from '../components/common/Avatar';

const CATEGORIES = [
  'Food',
  'Travel',
  'Hotel',
  'Shopping',
  'Entertainment',
  'Education',
  'Medical',
  'Rent',
  'Utilities',
  'Other',
];

export const EditExpensePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [receiptFile, setReceiptFile] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState('');
  const [participantState, setParticipantState] = useState({});

  useEffect(() => {
    const fetchExpenseAndGroup = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/expenses/${id}`);
        const exp = res.data.data.expense;

        setTitle(exp.title);
        setAmount(exp.amount.toString());
        setPaidBy(exp.paidBy?._id || exp.paidBy);
        setCategory(exp.category);
        setDate(new Date(exp.date).toISOString().split('T')[0]);
        setNotes(exp.notes || '');
        setSplitType(exp.splitType);
        setExistingReceipt(exp.receipt || '');

        // Fetch Group
        const grpRes = await api.get(`/groups/${exp.groupId._id}`);
        const grp = grpRes.data.data.group;
        setGroup(grp);

        // Prepopulate participants
        const partMap = {};
        grp.members?.forEach((m) => {
          if (m.user) {
            const existingP = exp.participants?.find(
              (p) => (p.user?._id || p.user).toString() === m.user._id.toString()
            );
            partMap[m.user._id] = {
              selected: Boolean(existingP),
              value: existingP ? (existingP.inputValue || existingP.shareAmount || '') : '',
            };
          }
        });
        setParticipantState(partMap);
      } catch (err) {
        console.error('Failed to load expense for editing:', err);
        toastError('Failed to load expense.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseAndGroup();
  }, [id, toastError]);

  const handleToggleParticipant = (userId) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        selected: !prev[userId]?.selected,
      },
    }));
  };

  const handleParticipantValueChange = (userId, val) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        value: val,
      },
    }));
  };

  const parsedAmount = parseFloat(amount) || 0;
  const selectedMembers = group?.members?.filter(
    (m) => participantState[m.user?._id]?.selected
  ) || [];

  let liveCalculations = [];
  let validationError = '';

  if (selectedMembers.length === 0) {
    validationError = 'At least one participant must be selected.';
  } else if (parsedAmount <= 0) {
    //
  } else {
    switch (splitType) {
      case 'equal': {
        const share = Math.floor((parsedAmount / selectedMembers.length) * 100) / 100;
        const remainder = Math.round((parsedAmount - share * selectedMembers.length) * 100);

        liveCalculations = selectedMembers.map((m, idx) => ({
          user: m.user,
          shareAmount: idx < remainder ? Math.round((share + 0.01) * 100) / 100 : share,
        }));
        break;
      }

      case 'exact': {
        let currentTotal = 0;
        liveCalculations = selectedMembers.map((m) => {
          const val = parseFloat(participantState[m.user._id]?.value) || 0;
          currentTotal += val;
          return {
            user: m.user,
            shareAmount: val,
          };
        });

        currentTotal = Math.round(currentTotal * 100) / 100;
        if (Math.abs(currentTotal - parsedAmount) > 0.01) {
          validationError = `The split amounts (total: ₹${currentTotal.toFixed(
            2
          )}) must equal ₹${parsedAmount.toFixed(2)}. Difference: ₹${(
            parsedAmount - currentTotal
          ).toFixed(2)}`;
        }
        break;
      }

      case 'percentage': {
        let totalPct = 0;
        selectedMembers.forEach((m) => {
          const pct = parseFloat(participantState[m.user._id]?.value) || 0;
          totalPct += pct;
        });

        totalPct = Math.round(totalPct * 100) / 100;

        liveCalculations = selectedMembers.map((m) => {
          const pct = parseFloat(participantState[m.user._id]?.value) || 0;
          const share = Math.round(((parsedAmount * pct) / 100) * 100) / 100;
          return {
            user: m.user,
            shareAmount: share,
            percentage: pct,
          };
        });

        if (Math.abs(totalPct - 100) > 0.01) {
          validationError = `Total percentage must equal 100%. Currently it is ${totalPct}%.`;
        }
        break;
      }

      case 'shares': {
        let totalShares = 0;
        selectedMembers.forEach((m) => {
          const s = parseFloat(participantState[m.user._id]?.value) || 1;
          totalShares += s;
        });

        liveCalculations = selectedMembers.map((m) => {
          const s = parseFloat(participantState[m.user._id]?.value) || 1;
          const share =
            totalShares > 0
              ? Math.round(((parsedAmount * s) / totalShares) * 100) / 100
              : 0;
          return {
            user: m.user,
            shareAmount: share,
            shares: s,
          };
        });
        break;
      }

      default:
        break;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || parsedAmount <= 0 || !paidBy) {
      toastError('Please provide a title, valid amount, and payer.');
      return;
    }

    if (validationError) {
      toastError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const participantsPayload = selectedMembers.map((m) => {
        const state = participantState[m.user._id];
        let val = 1;
        if (splitType === 'exact' || splitType === 'percentage' || splitType === 'shares') {
          val = parseFloat(state.value) || 0;
        }
        return {
          user: m.user._id,
          inputValue: val,
        };
      });

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('amount', parsedAmount);
      formData.append('paidBy', paidBy);
      formData.append('category', category);
      formData.append('date', date);
      formData.append('notes', notes.trim());
      formData.append('splitType', splitType);
      formData.append('participants', JSON.stringify(participantsPayload));

      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      await api.put(`/expenses/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      success('Expense updated successfully!');
      navigate(`/expenses/${id}`);
    } catch (err) {
      console.error('Failed to update expense:', err);
      toastError(err.response?.data?.message || 'Failed to update expense.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading expense for edit..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/expenses/${id}`)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Edit Expense
          </h1>
          <p className="text-xs text-slate-500">
            Updating &quot;{title}&quot; in {group?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Expense Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Input
                label={`Amount (${group?.currency || '₹'})`}
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Paid By <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  required
                >
                  {group?.members?.map((m) => (
                    <option key={m.user?._id} value={m.user?._id}>
                      {m.user?.name} {m.user?._id === user?._id && '(You)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Split Options Card */}
        <Card>
          <CardHeader>
            <CardTitle>Split Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'equal', label: '= Equal' },
                { id: 'exact', label: '₹ Exact' },
                { id: 'percentage', label: '% Percentage' },
                { id: 'shares', label: '÷ Shares' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSplitType(m.id)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    splitType === m.id
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {group?.members?.map((m) => {
                const uId = m.user?._id;
                const isSelected = participantState[uId]?.selected;
                const inputValue = participantState[uId]?.value || '';
                const calcItem = liveCalculations.find((c) => c.user?._id === uId);

                return (
                  <div
                    key={uId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(isSelected)}
                        onChange={() => handleToggleParticipant(uId)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                      />
                      <Avatar src={m.user?.avatar} name={m.user?.name} size="xs" />
                      <span className="text-xs font-bold text-slate-900">
                        {m.user?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSelected && splitType === 'exact' && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={inputValue}
                            onChange={(e) =>
                              handleParticipantValueChange(uId, e.target.value)
                            }
                            className="w-24 text-right rounded-lg border border-slate-200 py-1 px-2 text-xs font-bold"
                          />
                        </div>
                      )}

                      {isSelected && splitType === 'percentage' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={inputValue}
                            onChange={(e) =>
                              handleParticipantValueChange(uId, e.target.value)
                            }
                            className="w-20 text-right rounded-lg border border-slate-200 py-1 px-2 text-xs font-bold"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      )}

                      {isSelected && splitType === 'shares' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={inputValue}
                            onChange={(e) =>
                              handleParticipantValueChange(uId, e.target.value)
                            }
                            className="w-18 text-right rounded-lg border border-slate-200 py-1 px-2 text-xs font-bold"
                          />
                          <span className="text-xs text-slate-400">shares</span>
                        </div>
                      )}

                      {isSelected && calcItem && (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 min-w-20 text-right">
                          ₹{calcItem.shareAmount?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/expenses/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting} disabled={Boolean(validationError)}>
            Update Expense
          </Button>
        </div>
      </form>
    </div>
  );
};
