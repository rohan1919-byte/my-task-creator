import Notification from '../models/Notification.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ isRead: false }),
  ]);
  res.json({ notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!n) throw new HttpError(404, 'Notification not found.');
  res.json({ notification: n });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read.', modified: result.modifiedCount });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndDelete(req.params.id);
  if (!n) throw new HttpError(404, 'Notification not found.');
  res.json({ message: 'Notification deleted.' });
});


