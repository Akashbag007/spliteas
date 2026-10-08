import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

export const getGroupSettlements = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const settlements = await Settlement.find({ groupId })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { settlements },
    });
  } catch (error) {
    next(error);
  }
};

export const createSettlement = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { from, to, amount, status = 'PAID', notes } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'From, To, and Amount are required.',
      });
    }

    if (from.toString() === to.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Sender and recipient cannot be the same user.',
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Settlement amount must be positive.',
      });
    }

    const settlement = await Settlement.create({
      groupId,
      from,
      to,
      amount: Math.round(numericAmount * 100) / 100,
      status: status || 'PAID',
      notes: notes ? notes.trim() : '',
      settledAt: status === 'PAID' ? new Date() : null,
      createdBy: req.user._id,
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar');

    // Send notification to the recipient
    const recipientUser = await User.findById(to);
    const senderUser = await User.findById(from);

    if (recipientUser && senderUser) {
      await createNotification({
        userId: to,
        title: status === 'PAID' ? 'Settlement Completed' : 'Settlement Requested',
        message: `${senderUser.name} recorded a settlement of ₹${numericAmount.toLocaleString('en-IN')} with you in ${group.name}.`,
        type: status === 'PAID' ? 'SETTLEMENT_PAID' : 'SETTLEMENT_CREATED',
        relatedId: settlement._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully.',
      data: { settlement: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettlementStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'PAID' or 'CANCELLED'

    const settlement = await Settlement.findById(id)
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .populate('groupId', 'name');

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    if (!['PAID', 'CANCELLED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid settlement status.' });
    }

    settlement.status = status;
    if (status === 'PAID') {
      settlement.settledAt = new Date();
    } else {
      settlement.settledAt = null;
    }

    await settlement.save();

    // Notify the other party
    const targetUserId =
      req.user._id.toString() === settlement.from._id.toString()
        ? settlement.to._id
        : settlement.from._id;

    await createNotification({
      userId: targetUserId,
      title: `Settlement Marked as ${status}`,
      message: `The settlement of ₹${settlement.amount} was marked as ${status}.`,
      type: status === 'PAID' ? 'SETTLEMENT_PAID' : 'GENERAL',
      relatedId: settlement._id,
    });

    res.status(200).json({
      success: true,
      message: `Settlement marked as ${status}.`,
      data: { settlement },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSettlement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const settlement = await Settlement.findById(id);

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    await Settlement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Settlement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
