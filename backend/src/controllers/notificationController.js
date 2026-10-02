const Notification = require('../models/Notification');

/**
 * @desc Get all in-app notifications for current user
 * @route GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
};

/**
 * @desc Mark single notification as read
 * @route PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
};

/**
 * @desc Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
