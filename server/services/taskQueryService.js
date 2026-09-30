import { startOfISTDay, addDays, endOfISTWeekExclusive, parseDateOnly } from '../utils/time.js';
import { PRIORITIES, STATUSES, DEFAULT_CATEGORIES } from '../utils/validators.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Translates query-string params into a MongoDB filter */
export function buildTaskFilter(q = {}, now = new Date()) {
  const and = [];

  const search = typeof q.search === 'string' ? q.search.trim() : '';
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: [{ title: rx }, { description: rx }, { category: rx }] });
  }

  const status = String(q.status || '').toLowerCase();
  if (STATUSES.includes(status)) and.push({ status });

  const priority = String(q.priority || '').toLowerCase();
  if (PRIORITIES.includes(priority)) and.push({ priority });

  const category = typeof q.category === 'string' ? q.category.trim() : '';
  if (category && category.toLowerCase() !== 'all') {
    if (category.toLowerCase() === 'other') {
      // "Other" also covers every custom category
      const named = DEFAULT_CATEGORIES.filter((c) => c !== 'Other');
      and.push({ category: { $nin: named } });
    } else {
      and.push({ category: new RegExp(`^${escapeRegex(category)}$`, 'i') });
    }
  }

  const today = startOfISTDay(now);
  switch (String(q.deadline || '').toLowerCase()) {
    case 'today':
      and.push({ dueDate: today });
      break;
    case 'tomorrow':
      and.push({ dueDate: addDays(today, 1) });
      break;
    case 'week':
      and.push({ dueDate: { $gte: today, $lt: endOfISTWeekExclusive(now) } });
      break;
    case 'overdue':
      and.push({ status: { $ne: 'completed' }, dueAt: { $lt: now } });
      break;
    case 'upcoming': // incomplete tasks due after today
      and.push({ status: { $ne: 'completed' }, dueDate: { $gte: addDays(today, 1) } });
      break;
    default:
  }

  // Date range (used by the calendar): from/to are inclusive YYYY-MM-DD values
  const from = parseDateOnly(q.from);
  const to = parseDateOnly(q.to);
  if (from) and.push({ dueDate: { $gte: from } });
  if (to) and.push({ dueDate: { $lte: to } });

  return and.length ? { $and: and } : {};
}

export function buildSort(sort) {
  switch (sort) {
    case 'newest':
      return { createdAt: -1, _id: -1 };
    case 'oldest':
      return { createdAt: 1, _id: 1 };
    case 'priority':
      return { priorityRank: -1, dueAt: 1, _id: 1 };
    case 'updated':
      return { updatedAt: -1, _id: -1 };
    case 'dueDate':
    default:
      return { dueAt: 1, _id: 1 };
  }
}
