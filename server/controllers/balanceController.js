import { calculateGroupBalances, calculateUserOverview } from '../services/balanceService.js';
import Group from '../models/Group.js';

export const getGroupBalances = async (req, res, next) => {
  try {
    const { groupId } = req.params;

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

    const balanceData = await calculateGroupBalances(groupId);

    res.status(200).json({
      success: true,
      data: balanceData,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOverview = async (req, res, next) => {
  try {
    const overview = await calculateUserOverview(req.user._id);

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};
