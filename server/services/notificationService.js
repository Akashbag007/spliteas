import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, title, message, type = 'GENERAL', relatedId = null }) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

export const notifyGroupMembers = async ({
  group,
  excludeUserId = null,
  title,
  message,
  type = 'GENERAL',
  relatedId = null,
}) => {
  try {
    if (!group || !group.members) return;

    const notifications = group.members
      .filter((m) => {
        const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
        return !excludeUserId || memberId !== excludeUserId.toString();
      })
      .map((m) => {
        const memberId = m.user?._id ? m.user._id : m.user;
        return {
          userId: memberId,
          title,
          message,
          type,
          relatedId,
        };
      });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Failed to notify group members:', err.message);
  }
};
