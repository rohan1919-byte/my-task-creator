const m = require("mongoose");
const s = new m.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    priorityRank: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    dueDate: { type: Date, required: true },
    dueTime: { type: String, required: true },
    dueAt: { type: Date, required: true },
    category: { type: String, default: "Other" },
    reminder: {
      type: String,
      enum: ["none", "due-date", "1-day", "1-hour", "30-minutes", "15-minutes"],
      default: "due-date",
    },
    notes: { type: String, default: "" },
   
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
["dueDate", "dueAt", "status", "priority", "category", "createdAt"].forEach(
  (k) => s.index({ [k]: 1 }),
);
module.exports = m.model("Task", s);
