import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import { createNotification } from '../services/notificationService.js';
import { calculateGroupBalances } from '../services/balanceService.js';

export const getGroups = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { 'members.user': req.user._id };

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const groups = await Group.find(query)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Enhance each group with active summary
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const expenseCount = await Expense.countDocuments({ groupId: group._id });
        let userBalance = 0;
        let totalSpending = 0;

        try {
          const balanceData = await calculateGroupBalances(group._id);
          totalSpending = balanceData.totalGroupSpending;
          const userItem = balanceData.balances.find(
            (b) => b.user._id.toString() === req.user._id.toString()
          );
          if (userItem) {
            userBalance = userItem.netBalance;
          }
        } catch (e) {
          // fallback if calculation fails
        }

        return {
          ...group.toObject(),
          expenseCount,
          totalSpending,
          userBalance,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { groups: enhancedGroups },
    });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, currency, image, memberEmails } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.',
      });
    }

    const members = [
      {
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date(),
      },
    ];

    // If initial member emails are provided
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      for (const email of memberEmails) {
        if (!email || !email.trim()) continue;
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === req.user.email.toLowerCase()) continue;

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          // Create temporary registered user with a placeholder password
          const tempName = normalizedEmail.split('@')[0];
          user = await User.create({
            name: tempName.charAt(0).toUpperCase() + tempName.slice(1),
            email: normalizedEmail,
            password: 'TempPassword123!',
          });
        }

        if (!members.some((m) => m.user.toString() === user._id.toString())) {
          members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date(),
          });
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      currency: currency || req.user.defaultCurrency || 'INR',
      image: image || '',
      createdBy: req.user._id,
      members,
    });

    // Notify other members
    for (const m of members) {
      if (m.user.toString() !== req.user._id.toString()) {
        await createNotification({
          userId: m.user,
          title: 'Added to New Group',
          message: `${req.user.name} added you to group "${group.name}".`,
          type: 'MEMBER_ADDED',
          relatedId: group._id,
        });
      }
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      data: { group: populatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    const isMember = group.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group.',
      });
    }

    res.status(200).json({
      success: true,
      data: { group },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { name, description, currency, image } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this group.',
      });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (currency) group.currency = currency;
    if (image !== undefined) group.image = image;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      data: { group: updatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete this group.',
      });
    }

    // Clean up expenses and settlements
    await Expense.deleteMany({ groupId: group._id });
    await Settlement.deleteMany({ groupId: group._id });
    await Group.findByIdAndDelete(group._id);

    res.status(200).json({
      success: true,
      message: 'Group and all associated data deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const tempName = normalizedEmail.split('@')[0];
      user = await User.create({
        name: tempName.charAt(0).toUpperCase() + tempName.slice(1),
        email: normalizedEmail,
        password: 'TempPassword123!',
      });
    }

    const isAlreadyMember = group.members.some(
      (m) => m.user.toString() === user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a member of the group.',
      });
    }

    group.members.push({
      user: user._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    await createNotification({
      userId: user._id,
      title: 'Added to Group',
      message: `${req.user.name} added you to group "${group.name}".`,
      type: 'MEMBER_ADDED',
      relatedId: group._id,
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `${user.name} was added to the group.`,
      data: { group: updatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'The group creator cannot be removed from the group.',
      });
    }

    const isSelf = req.user._id.toString() === userId;
    const isCreator = group.createdBy.toString() === req.user._id.toString();

    if (!isSelf && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove this member.',
      });
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== userId
    );

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Member removed from group successfully.',
      data: { group: updatedGroup },
    });
  } catch (error) {
    next(error);
  }
};
