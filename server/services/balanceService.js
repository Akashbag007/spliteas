import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import { simplifyDebts } from './debtSimplification.js';

/**
 * Calculates complete balance details for a specific group
 * @param {String} groupId
 */
export const calculateGroupBalances = async (groupId) => {
  const group = await Group.findById(groupId).populate('members.user', 'name email avatar');
  if (!group) {
    throw new Error('Group not found');
  }

  const expenses = await Expense.find({ groupId })
    .populate('paidBy', 'name email avatar')
    .populate('participants.user', 'name email avatar');

  const paidSettlements = await Settlement.find({ groupId, status: 'PAID' })
    .populate('from', 'name email avatar')
    .populate('to', 'name email avatar');

  // Initialize ledger for all members
  const memberMap = {};
  group.members.forEach((m) => {
    if (m.user) {
      const uId = m.user._id.toString();
      memberMap[uId] = {
        user: {
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
        },
        totalPaid: 0,
        totalShare: 0,
        settledPaid: 0,
        settledReceived: 0,
        netBalance: 0,
      };
    }
  });

  let totalSpending = 0;

  // Process expenses
  expenses.forEach((expense) => {
    totalSpending += expense.amount;
    const payerId = expense.paidBy?._id ? expense.paidBy._id.toString() : expense.paidBy?.toString();

    if (memberMap[payerId]) {
      memberMap[payerId].totalPaid += expense.amount;
    }

    if (Array.isArray(expense.participants)) {
      expense.participants.forEach((p) => {
        const pId = p.user?._id ? p.user._id.toString() : p.user?.toString();
        if (memberMap[pId]) {
          memberMap[pId].totalShare += p.shareAmount;
        }
      });
    }
  });

  // Process paid settlements
  paidSettlements.forEach((settlement) => {
    const fromId = settlement.from?._id ? settlement.from._id.toString() : settlement.from?.toString();
    const toId = settlement.to?._id ? settlement.to._id.toString() : settlement.to?.toString();

    if (memberMap[fromId]) {
      memberMap[fromId].settledPaid += settlement.amount;
    }
    if (memberMap[toId]) {
      memberMap[toId].settledReceived += settlement.amount;
    }
  });

  // Compute final net balances
  const balances = Object.values(memberMap).map((item) => {
    const totalOut = item.totalPaid + item.settledPaid;
    const totalIn = item.totalShare + item.settledReceived;
    const net = Math.round((totalOut - totalIn) * 100) / 100;

    let status = 'SETTLED';
    if (net > 0.01) status = 'OWED';
    else if (net < -0.01) status = 'OWES';

    return {
      user: item.user,
      totalPaid: Math.round(item.totalPaid * 100) / 100,
      totalShare: Math.round(item.totalShare * 100) / 100,
      settledPaid: Math.round(item.settledPaid * 100) / 100,
      settledReceived: Math.round(item.settledReceived * 100) / 100,
      netBalance: net,
      status,
    };
  });

  // Compute debt simplification: Who owes whom
  const simplifiedDebts = simplifyDebts(balances);

  return {
    group: {
      _id: group._id,
      name: group.name,
      currency: group.currency,
    },
    totalGroupSpending: Math.round(totalSpending * 100) / 100,
    balances,
    simplifiedDebts,
  };
};

/**
 * Calculates global financial overview for a logged-in user
 * @param {String} userId
 */
export const calculateUserOverview = async (userId) => {
  const groups = await Group.find({ 'members.user': userId });
  const groupIds = groups.map((g) => g._id);

  let totalExpensesSum = 0;
  let youOwe = 0;
  let youAreOwed = 0;

  // Compute balances across all groups the user is in
  for (const group of groups) {
    const { simplifiedDebts } = await calculateGroupBalances(group._id);

    simplifiedDebts.forEach((debt) => {
      const fromId = debt.from._id.toString();
      const toId = debt.to._id.toString();

      if (fromId === userId.toString()) {
        youOwe += debt.amount;
      } else if (toId === userId.toString()) {
        youAreOwed += debt.amount;
      }
    });
  }

  // Calculate total user-involved expenses
  const userExpenses = await Expense.find({
    $or: [{ paidBy: userId }, { 'participants.user': userId }],
  });

  userExpenses.forEach((exp) => {
    totalExpensesSum += exp.amount;
  });

  youOwe = Math.round(youOwe * 100) / 100;
  youAreOwed = Math.round(youAreOwed * 100) / 100;
  const netBalance = Math.round((youAreOwed - youOwe) * 100) / 100;

  return {
    totalGroups: groups.length,
    totalExpensesAmount: Math.round(totalExpensesSum * 100) / 100,
    totalExpensesCount: userExpenses.length,
    youOwe,
    youAreOwed,
    netBalance,
  };
};
