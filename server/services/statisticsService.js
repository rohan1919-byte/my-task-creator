import Task from '../models/Task.js';
import { PRIORITIES } from '../utils/validators.js';
import { startOfISTDay, addDays, toISTDateString } from '../utils/time.js';

const CHART_DAYS = 30;

export async function computeStatistics(now = new Date()) {
  const today = startOfISTDay(now);
  const since = addDays(today, -(CHART_DAYS - 1));

  const [statusAgg, dueToday, overdue, priorityAgg, categoryAgg, completedAgg] = await Promise.all([
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Due today = still open, due later today (already-late tasks count as overdue)
    Task.countDocuments({ status: { $ne: 'completed' }, dueDate: today, dueAt: { $gte: now } }),
    Task.countDocuments({ status: { $ne: 'completed' }, dueAt: { $lt: now } }),
    Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 12 }]),
    Task.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(statusAgg.map((r) => [r._id, r.count]));
  const pending = byStatus.pending || 0;
  const inProgress = byStatus['in-progress'] || 0;
  const completed = byStatus.completed || 0;
  const total = pending + inProgress + completed;

  const priorityMap = Object.fromEntries(priorityAgg.map((r) => [r._id, r.count]));
  const byPriority = PRIORITIES.map((p) => ({ name: p, value: priorityMap[p] || 0 }));
  const byCategory = categoryAgg.map((r) => ({ name: r._id, value: r.count }));

  const completedMap = Object.fromEntries(completedAgg.map((r) => [r._id, r.count]));
  const completedOverTime = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = toISTDateString(addDays(since, i));
    return { date, count: completedMap[date] || 0 };
  });

  return {
    total,
    pending,
    inProgress,
    completed,
    dueToday,
    overdue,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    byPriority,
    byCategory,
    completedOverTime,
  };
}
