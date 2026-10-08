import Expense from '../models/Expense.js';
import Group from '../models/Group.js';

export const getGroupAnalytics = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members.user', 'name email avatar');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ date: 1 });

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? Math.round((totalSpending / expenseCount) * 100) / 100 : 0;
    const highestExpense = expenses.reduce(
      (max, e) => (e.amount > (max ? max.amount : 0) ? e : max),
      null
    );

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((e) => {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { category: e.category, amount: 0, count: 0 };
      }
      categoryMap[e.category].amount += e.amount;
      categoryMap[e.category].count += 1;
    });

    const categories = Object.values(categoryMap).map((cat) => ({
      ...cat,
      amount: Math.round(cat.amount * 100) / 100,
      percentage: totalSpending > 0 ? Math.round((cat.amount / totalSpending) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const mostExpensiveCategory = categories.length > 0 ? categories[0].category : 'N/A';

    // Member contributions (paidBy vs actual share)
    const memberContributionMap = {};
    group.members.forEach((m) => {
      if (m.user) {
        memberContributionMap[m.user._id.toString()] = {
          userId: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          totalPaid: 0,
          totalShare: 0,
        };
      }
    });

    expenses.forEach((e) => {
      const pId = e.paidBy?._id ? e.paidBy._id.toString() : e.paidBy?.toString();
      if (memberContributionMap[pId]) {
        memberContributionMap[pId].totalPaid += e.amount;
      }
      e.participants.forEach((p) => {
        const uId = p.user?._id ? p.user._id.toString() : p.user?.toString();
        if (memberContributionMap[uId]) {
          memberContributionMap[uId].totalShare += p.shareAmount;
        }
      });
    });

    const memberContributions = Object.values(memberContributionMap).map((m) => ({
      ...m,
      totalPaid: Math.round(m.totalPaid * 100) / 100,
      totalShare: Math.round(m.totalShare * 100) / 100,
    }));

    // Monthly / Date trend
    const monthlyMap = {};
    expenses.forEach((e) => {
      const monthKey = new Date(e.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthlyMap[monthKey].amount += e.amount;
      monthlyMap[monthKey].count += 1;
    });

    const monthlySpending = Object.values(monthlyMap).map((m) => ({
      ...m,
      amount: Math.round(m.amount * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSpending: Math.round(totalSpending * 100) / 100,
        expenseCount,
        averageExpense,
        highestExpense: highestExpense
          ? {
              _id: highestExpense._id,
              title: highestExpense.title,
              amount: highestExpense.amount,
              date: highestExpense.date,
              paidBy: highestExpense.paidBy,
            }
          : null,
        mostExpensiveCategory,
        categories,
        memberContributions,
        monthlySpending,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    // All expenses where user is payer or participant
    const userGroups = await Group.find({ 'members.user': req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const expenses = await Expense.find({
      groupId: { $in: groupIds },
      $or: [{ paidBy: req.user._id }, { 'participants.user': req.user._id }],
    }).sort({ date: 1 });

    const monthlyMap = {};
    expenses.forEach((e) => {
      const monthKey = new Date(e.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, paidByYou: 0, yourShare: 0, total: 0 };
      }

      monthlyMap[monthKey].total += e.amount;

      if (e.paidBy.toString() === req.user._id.toString()) {
        monthlyMap[monthKey].paidByYou += e.amount;
      }

      const userPart = e.participants.find(
        (p) => p.user.toString() === req.user._id.toString()
      );
      if (userPart) {
        monthlyMap[monthKey].yourShare += userPart.shareAmount;
      }
    });

    const monthlyTrends = Object.values(monthlyMap).map((m) => ({
      month: m.month,
      paidByYou: Math.round(m.paidByYou * 100) / 100,
      yourShare: Math.round(m.yourShare * 100) / 100,
      total: Math.round(m.total * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: { monthlyTrends },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryAnalytics = async (req, res, next) => {
  try {
    const userGroups = await Group.find({ 'members.user': req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const expenses = await Expense.find({
      groupId: { $in: groupIds },
      $or: [{ paidBy: req.user._id }, { 'participants.user': req.user._id }],
    });

    const categoryMap = {};
    let totalSpending = 0;

    expenses.forEach((e) => {
      const userPart = e.participants.find(
        (p) => p.user.toString() === req.user._id.toString()
      );
      const userShare = userPart ? userPart.shareAmount : 0;

      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { category: e.category, amount: 0, count: 0 };
      }
      categoryMap[e.category].amount += userShare > 0 ? userShare : e.amount;
      categoryMap[e.category].count += 1;
      totalSpending += userShare > 0 ? userShare : e.amount;
    });

    const categories = Object.values(categoryMap).map((cat) => ({
      category: cat.category,
      amount: Math.round(cat.amount * 100) / 100,
      count: cat.count,
      percentage: totalSpending > 0 ? Math.round((cat.amount / totalSpending) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount);

    res.status(200).json({
      success: true,
      data: {
        totalSpending: Math.round(totalSpending * 100) / 100,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGlobalAnalytics = async (req, res, next) => {
  try {
    const userGroups = await Group.find({ 'members.user': req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const expenses = await Expense.find({
      groupId: { $in: groupIds },
      $or: [{ paidBy: req.user._id }, { 'participants.user': req.user._id }],
    }).sort({ date: 1 });

    const totalSpending = expenses.reduce((sum, e) => {
      const userPart = e.participants.find((p) => p.user.toString() === req.user._id.toString());
      return sum + (userPart ? userPart.shareAmount : (e.paidBy.toString() === req.user._id.toString() ? e.amount : 0));
    }, 0);

    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? Math.round((totalSpending / expenseCount) * 100) / 100 : 0;
    const highestExpense = expenses.reduce((max, e) => (e.amount > (max ? max.amount : 0) ? e : max), null);

    // Group-by-group breakdown
    const groupSpendingMap = {};
    userGroups.forEach((g) => {
      groupSpendingMap[g._id.toString()] = {
        groupId: g._id,
        groupName: g.name,
        amount: 0,
      };
    });

    expenses.forEach((e) => {
      const gId = e.groupId.toString();
      if (groupSpendingMap[gId]) {
        const userPart = e.participants.find((p) => p.user.toString() === req.user._id.toString());
        groupSpendingMap[gId].amount += userPart ? userPart.shareAmount : e.amount;
      }
    });

    const groupSpending = Object.values(groupSpendingMap).map((g) => ({
      ...g,
      amount: Math.round(g.amount * 100) / 100,
    })).filter((g) => g.amount > 0);

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((e) => {
      const userPart = e.participants.find((p) => p.user.toString() === req.user._id.toString());
      const share = userPart ? userPart.shareAmount : e.amount;
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { category: e.category, amount: 0, count: 0 };
      }
      categoryMap[e.category].amount += share;
      categoryMap[e.category].count += 1;
    });

    const categories = Object.values(categoryMap).map((cat) => ({
      ...cat,
      amount: Math.round(cat.amount * 100) / 100,
      percentage: totalSpending > 0 ? Math.round((cat.amount / totalSpending) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Monthly spending
    const monthlyMap = {};
    expenses.forEach((e) => {
      const monthKey = new Date(e.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, amount: 0 };
      }
      const userPart = e.participants.find((p) => p.user.toString() === req.user._id.toString());
      monthlyMap[monthKey].amount += userPart ? userPart.shareAmount : e.amount;
    });

    const monthlySpending = Object.values(monthlyMap).map((m) => ({
      ...m,
      amount: Math.round(m.amount * 100) / 100,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSpending: Math.round(totalSpending * 100) / 100,
        expenseCount,
        averageExpense,
        highestExpense: highestExpense
          ? {
              _id: highestExpense._id,
              title: highestExpense.title,
              amount: highestExpense.amount,
              category: highestExpense.category,
              date: highestExpense.date,
            }
          : null,
        mostExpensiveCategory: categories.length > 0 ? categories[0].category : 'N/A',
        categories,
        monthlySpending,
        groupSpending,
      },
    });
  } catch (error) {
    next(error);
  }
};
