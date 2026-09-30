import { parseDateOnly, isValidTime, toISTDateString } from './time.js';

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const STATUSES = ['pending', 'in-progress', 'completed'];
export const REMINDERS = ['none', 'due-date', '1-day', '1-hour', '30-minutes', '15-minutes'];
export const DEFAULT_CATEGORIES = ['Work', 'Job Search', 'Interview', 'Learning', 'Project', 'Personal', 'Other'];

const LIMITS = { title: 200, description: 2000, notes: 2000, category: 50 };

const asString = (v) => (v === undefined || v === null ? '' : String(v).trim());

/** Accepts "YYYY-MM-DD" or a full ISO timestamp, returns Date at 00:00 IST or null */
function normaliseDueDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const v = value.trim();
  const direct = parseDateOnly(v);
  if (direct) return direct;
  const parsed = new Date(v);
  if (Number.isNaN(parsed.getTime())) return null;
  return parseDateOnly(toISTDateString(parsed));
}

/** Validates a full task payload. Returns { data, errors } */
export function validateTaskInput(input = {}) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const data = {};

  data.title = asString(input.title);
  if (!data.title) add('title', 'Title is required.');
  else if (data.title.length > LIMITS.title) add('title', `Title must be at most ${LIMITS.title} characters.`);

  data.description = asString(input.description);
  if (data.description.length > LIMITS.description)
    add('description', `Description must be at most ${LIMITS.description} characters.`);

  data.notes = asString(input.notes);
  if (data.notes.length > LIMITS.notes) add('notes', `Notes must be at most ${LIMITS.notes} characters.`);

  data.priority = asString(input.priority).toLowerCase() || 'medium';
  if (!PRIORITIES.includes(data.priority)) add('priority', 'Priority must be low, medium, high or urgent.');

  data.status = asString(input.status).toLowerCase() || 'pending';
  if (!STATUSES.includes(data.status)) add('status', 'Status must be pending, in-progress or completed.');

  data.reminder = asString(input.reminder) || 'due-date';
  if (!REMINDERS.includes(data.reminder)) add('reminder', 'Invalid reminder option.');

  const rawDate = asString(input.dueDate);
  if (!rawDate) add('dueDate', 'Due date is required.');
  else {
    const d = normaliseDueDate(rawDate);
    if (!d) add('dueDate', 'Due date is not a valid date.');
    else data.dueDate = d;
  }

  data.dueTime = asString(input.dueTime);
  if (!data.dueTime) add('dueTime', 'Due time is required.');
  else if (!isValidTime(data.dueTime)) add('dueTime', 'Due time must be a valid time (HH:mm).');

  let category = asString(input.category) || 'Other';
  const known = DEFAULT_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
  if (known) category = known;
  if (category.length > LIMITS.category) add('category', `Category must be at most ${LIMITS.category} characters.`);
  data.category = category;

  return { data, errors };
}
