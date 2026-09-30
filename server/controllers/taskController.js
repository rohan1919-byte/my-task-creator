const Task = require("../models/Task");
const N = require("../models/Notification");
const { toDueAt, dayStart } = require("../utils/time");
const RANK = { low: 1, medium: 2, high: 3, urgent: 4 };
const validate = (b) => {
  if (!b.title || !b.title.trim()) return "Title is required";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(b.dueDate || "") ||
    isNaN(new Date(b.dueDate))
  )
    return "A valid due date is required";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.dueTime || ""))
    return "A valid due time is required";
  if ((b.description || "").length > 2000)
    return "Description is too long (max 2000)";
  if ((b.notes || "").length > 2000) return "Notes are too long (max 2000)";
};
const build = (b) => ({
  title: b.title.trim(),
  description: b.description || "",
  priority: b.priority || "medium",
  priorityRank: RANK[b.priority || "medium"],
  status: b.status || "pending",
  dueDate: toDueAt(b.dueDate, "00:00"),
  dueTime: b.dueTime,
  dueAt: toDueAt(b.dueDate, b.dueTime),
  category: (b.category || "Other").trim(),
  reminder: b.reminder || "due-date",
  notes: b.notes || "",
  completedAt: b.status === "completed" ? new Date() : null,
  
});
const wrap = (f) => (req, res) =>
  f(req, res).catch((e) =>
    res.status(e.name === "CastError" ? 400 : 500).json({ message: e.message }),
  );
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.create = wrap(async (req, res) => {
  const e = validate(req.body);
  if (e) return res.status(400).json({ message: e });
  res.status(201).json(await Task.create(build(req.body)));
});
exports.list = wrap(async (req, res) => {
  const {
    search,
    status,
    priority,
    category,
    deadline,
    sort = "dueDate",
  } = req.query;
  const page = Math.max(1, +req.query.page || 1),
    limit = Math.min(50, Math.max(1, +req.query.limit || 10));
  const q = {},
    now = new Date(),
    ts = dayStart(0);
  if (search) {
    const r = new RegExp(esc(search), "i");
    q.$or = [{ title: r }, { description: r }, { category: r }];
  }
  if (status && status !== "all") q.status = status;
  if (priority && priority !== "all") q.priority = priority;
  if (category && category !== "all")
    q.category = new RegExp("^" + esc(category), "i");
  const R = {
    today: [ts, dayStart(1)],
    tomorrow: [dayStart(1), dayStart(2)],
    week: [ts, dayStart(7)],
  };
  if (R[deadline]) q.dueAt = { $gte: R[deadline][0], $lt: R[deadline][1] };
  if (deadline === "overdue") {
    q.dueAt = { $lt: now };
    q.status = { $ne: "completed" };
  }
  if (deadline === "upcoming") {
    q.dueAt = { $gte: now };
    q.status = { $ne: "completed" };
  }
  const S = {
    dueDate: { dueAt: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priority: { priorityRank: -1, dueAt: 1 },
    updated: { updatedAt: -1 },
  };
  const [tasks, totalTasks] = await Promise.all([
    Task.find(q)
      .sort(S[sort] || S.dueDate)
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(q),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalTasks / limit));
  res.json({
    tasks,
    currentPage: page,
    totalPages,
    totalTasks,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
});
exports.get = wrap(async (req, res) => {
  const t = await Task.findById(req.params.id);
  t ? res.json(t) : res.status(404).json({ message: "Task not found" });
});
exports.update = wrap(async (req, res) => {
  const e = validate(req.body);
  if (e) return res.status(400).json({ message: e });
  const t = await Task.findByIdAndUpdate(req.params.id, build(req.body), {
    new: true,
    runValidators: true,
  });
  t ? res.json(t) : res.status(404).json({ message: "Task not found" });
});
exports.remove = wrap(async (req, res) => {
  const t = await Task.findByIdAndDelete(req.params.id);
  if (!t) return res.status(404).json({ message: "Task not found" });
  await N.deleteMany({ taskId: t._id });
  res.json({ message: "Task deleted successfully." });
});
exports.complete = wrap(async (req, res) => {
  const t = await Task.findByIdAndUpdate(
    req.params.id,
    { status: "completed", completedAt: new Date() },
    { new: true },
  );
  if (!t) return res.status(404).json({ message: "Task not found" });
  await N.create({
    taskId: t._id,
    title: "Task completed",
    message: `"${t.title}" was marked as completed`,
    type: "completed",
  });
  res.json(t);
});
exports.reopen = wrap(async (req, res) => {
  const t = await Task.findByIdAndUpdate(
    req.params.id,
    { status: "pending", completedAt: null },
    { new: true },
  );
  t ? res.json(t) : res.status(404).json({ message: "Task not found" });
});
exports.stats = wrap(async (req, res) => {
  const now = new Date(),
    ts = dayStart(0),
    open = { $ne: "completed" },
    c = (f) => Task.countDocuments(f);
  const [
    total,
    pending,
    inProgress,
    completed,
    dueToday,
    overdue,
    byPriority,
    byCategory,
    over,
  ] = await Promise.all([
    c({}),
    c({ status: "pending" }),
    c({ status: "in-progress" }),
    c({ status: "completed" }),
    c({ status: open, dueAt: { $gte: ts, $lt: dayStart(1) } }),
    c({ status: open, dueAt: { $lt: now } }),
    Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Task.aggregate([
      { $match: { completedAt: { $gte: dayStart(-6) } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completedAt",
              timezone: "Asia/Kolkata",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json({
    total,
    pending,
    inProgress,
    completed,
    dueToday,
    overdue,
    completionPercentage: total ? Math.round((completed / total) * 100) : 0,
    byPriority,
    byCategory,
    completedOverTime: over,
  });
});
