import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { calculateSplit } from '../utils/splitCalculator.js';
import { notifyGroupMembers, createNotification } from '../services/notificationService.js';

export const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { search, category, member, sort, startDate, endDate } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const query = { groupId };

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (member && member !== 'All') {
      query.$or = [{ paidBy: member }, { 'participants.user': member }];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    let sortOption = { date: -1 };
    if (sort === 'date_asc') sortOption = { date: 1 };
    else if (sort === 'amount_desc') sortOption = { amount: -1 };
    else if (sort === 'amount_asc') sortOption = { amount: 1 };

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    let { title, amount, paidBy, category, date, notes, splitType, participants } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Parse participants if passed as JSON string (common in multipart form-data)
    if (typeof participants === 'string') {
      try {
        participants = JSON.parse(participants);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid participants JSON format.',
        });
      }
    }

    if (!title || !amount || !paidBy || !participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, payer, and at least one participant.',
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number.',
      });
    }

    // Compute splits
    const calculatedParticipants = calculateSplit({
      amount: numericAmount,
      splitType: splitType || 'equal',
      participants,
    });

    let receiptPath = '';
    if (req.file) {
      receiptPath = `/uploads/${req.file.filename}`;
    }

    const expense = await Expense.create({
      groupId,
      title: title.trim(),
      amount: numericAmount,
      paidBy,
      category: category || 'Food',
      splitType: splitType || 'equal',
      participants: calculatedParticipants,
      notes: notes ? notes.trim() : '',
      receipt: receiptPath,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Notify group members
    await notifyGroupMembers({
      group,
      excludeUserId: req.user._id,
      title: 'New Expense Added',
      message: `${req.user.name} added "₹${numericAmount.toLocaleString('en-IN')}" for ${expense.title} in ${group.name}.`,
      type: 'EXPENSE_ADDED',
      relatedId: expense._id,
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully.',
      data: { expense: populatedExpense },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('groupId', 'name currency members')
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const isMember = expense.groupId.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let { title, amount, paidBy, category, date, notes, splitType, participants } = req.body;

    if (typeof participants === 'string') {
      try {
        participants = JSON.parse(participants);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid participants format.' });
      }
    }

    if (title) expense.title = title.trim();
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes.trim();
    if (paidBy) expense.paidBy = paidBy;
    if (req.file) expense.receipt = `/uploads/${req.file.filename}`;

    const effectiveAmount = amount ? parseFloat(amount) : expense.amount;
    const effectiveSplitType = splitType || expense.splitType;
    const effectiveParticipants = participants || expense.participants;

    if (amount || splitType || participants) {
      expense.amount = effectiveAmount;
      expense.splitType = effectiveSplitType;
      expense.participants = calculateSplit({
        amount: effectiveAmount,
        splitType: effectiveSplitType,
        participants: effectiveParticipants,
      });
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    await notifyGroupMembers({
      group,
      excludeUserId: req.user._id,
      title: 'Expense Updated',
      message: `${req.user.name} updated the expense "${expense.title}".`,
      type: 'EXPENSE_UPDATED',
      relatedId: expense._id,
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: { expense: updatedExpense },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const title = expense.title;
    await Expense.findByIdAndDelete(expense._id);

    await notifyGroupMembers({
      group,
      excludeUserId: req.user._id,
      title: 'Expense Deleted',
      message: `${req.user.name} removed the expense "${title}".`,
      type: 'EXPENSE_DELETED',
      relatedId: group._id,
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
