import Notification from '../models/Notification.js';

export async function createNotification(task, type, title, message) {
  return Notification.create({ taskId: task._id, type, title, message });
}
