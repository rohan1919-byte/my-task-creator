import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Bell,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import api from "./services/api";

const CATS = [
  "Work",
  "Job Search",
  "Interview",
  "Learning",
  "Project",
  "Personal",
  "Other",
];
const REM = [
  ["none", "No reminder"],
  ["due-date", "On due date"],
  ["1-day", "1 day before"],
  ["1-hour", "1 hour before"],
  ["30-minutes", "30 minutes before"],
  ["15-minutes", "15 minutes before"],
];
const tz = "Asia/Kolkata";
const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const dstr = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: tz });
const label = (t) => {
  if (t.status === "completed") return "Completed";
  const n = Date.now();
  if (new Date(t.dueAt) < n) return "Overdue";
  const d = dstr(t.dueAt);
  return d === dstr(n)
    ? "Due Today"
    : d === dstr(n + 864e5)
      ? "Due Tomorrow"
      : "Upcoming";
};
const PC = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};
const changed = () => window.dispatchEvent(new Event("tasks-changed"));
const err = (e) => toast.error(e.friendly || "Something went wrong");
function useReload(fn) {
  useEffect(() => {
    fn();
    window.addEventListener("tasks-changed", fn);
    return () => window.removeEventListener("tasks-changed", fn);
  }, [fn]);
}
const Btn = ({ c = "", ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${c}`}
  />
);
const Primary = (p) => (
  <Btn {...p} c="bg-purple-600 text-white hover:bg-purple-700" />
);
const Empty = ({ text }) => (
  <div className="rounded-xl border border-dashed border-purple-200 p-6 text-center text-sm text-gray-500">
    {text}
  </div>
);
const Skeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-24 animate-pulse rounded-xl bg-purple-50" />
    ))}
  </div>
);

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
function Confirm({ onYes, onNo }) {
  return (
    <Modal onClose={onNo}>
      <p className="mb-4 font-medium">
        Are you sure you want to delete this task?
      </p>
      <div className="flex justify-end gap-2">
        <Btn c="border" onClick={onNo}>
          Cancel
        </Btn>
        <Btn c="bg-red-600 text-white" onClick={onYes}>
          Delete
        </Btn>
      </div>
    </Modal>
  );
}
const L= ({ t, children }) => (
  <label className="block text-xs font-medium text-gray-600">
    {t}
    {children}
  </label>
);

function TaskForm({ task, onClose }) {
  const [f, setF] = useState(
    task
      ? {
          ...task,
          dueDate: dstr(task.dueAt),
          custom: !CATS.includes(task.category),
        }
      : {
          title: "",
          description: "",
          priority: "medium",
          status: "pending",
          dueDate: "",
          dueTime: "",
          category: "Work",
          reminder: "due-date",
          notes: "",
          custom: false,
        },
  );
  const [errs, setErrs] = useState("");
  const set = (k) => (e) => {
    setF((prev) => ({
      ...prev,
      [k]: e.target.value,
    }));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setErrs("Title is required");
    if (!f.dueDate) return setErrs("Due date is required");
    if (!f.dueTime) return setErrs("Due time is required");
    if (f.description.length > 2000 || f.notes.length > 2000)
      return setErrs("Description/notes max 2000 characters");
    try {
      task
        ? await api.put("/tasks/" + task._id, f)
        : await api.post("/tasks", f);
      toast.success(
        task ? "Task updated successfully." : "Task created successfully.",
      );
      changed();
      onClose();
    } catch (x) {
      setErrs(x.friendly);
    }
  };
  const I =
     "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-semibold">
          {task ? "Edit Task" : "Add Task"}
        </h2>
        {errs && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-600">{errs}</p>
        )}
        <L t="Title *">
  <input
    autoFocus
    className={I}
    value={f.title}
    onChange={set("title")}
  />
</L>
        <L t="Description">
          <textarea
            className={I}
            rows={2}
            value={f.description}
            onChange={set("description")}
          />
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L t="Priority">
            <select className={I} value={f.priority} onChange={set("priority")}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </L>
          <L t="Status">
            <select className={I} value={f.status} onChange={set("status")}>
              {["pending", "in-progress", "completed"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </L>
          <L t="Due Date *">
            <input
              type="date"
              className={I}
              value={f.dueDate}
              onChange={set("dueDate")}
            />
          </L>
          <L t="Due Time *">
            <input
              type="time"
              className={I}
              value={f.dueTime}
              onChange={set("dueTime")}
            />
          </L>
          <L t="Category">
            <select
              className={I}
              value={f.custom ? "__c" : f.category}
              onChange={(e) =>
                e.target.value === "__c"
                  ? setF({ ...f, custom: true, category: "" })
                  : setF({ ...f, custom: false, category: e.target.value })
              }
            >
              {CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="__c">Custom…</option>
            </select>
          </L>
          <L t="Reminder">
            <select className={I} value={f.reminder} onChange={set("reminder")}>
              {REM.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </L>
        </div>
        {f.custom && (
          <input
            className={I}
            placeholder="Custom category"
            value={f.category}
            onChange={set("category")}
          />
        )}
        <L t="Notes">
          <textarea
            className={I}
            rows={2}
            value={f.notes}
            onChange={set("notes")}
          />
        </L>
        <div className="flex justify-end gap-2">
          <Btn type="button" c="border" onClick={onClose}>
            Cancel
          </Btn>
          <Primary type="submit">{task ? "Save" : "Create"}</Primary>
        </div>
      </form>
    </Modal>
  );
}

function TaskCard({ t, onEdit, compact }) {
  const [del, setDel] = useState(false),
    [view, setView] = useState(false);
  const l = label(t);
  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      changed();
    } catch (e) {
      err(e);
    }
  };
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${t.status === "completed" ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-semibold ${t.status === "completed" ? "line-through" : ""}`}
        >
          {t.title}
        </h3>
        {l === "Overdue" && (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            OVERDUE
          </span>
        )}
      </div>
      {!compact && t.description && (
        <p className="mt-1 text-sm text-gray-600">{t.description}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 capitalize ${PC[t.priority]}`}
        >
          {t.priority}
        </span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 capitalize text-purple-700">
          {t.status}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {t.category}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">{l}</span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Due {fmt(t.dueAt)}
        {!compact && (
          <> · Reminder: {REM.find((r) => r[0] === t.reminder)?.[1]}</>
        )}
      </p>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn c="border" onClick={() => setView(true)}>
            View
          </Btn>
          <Btn c="border" onClick={() => onEdit(t)}>
            <Pencil size={14} />
            Edit
          </Btn>
          {t.status === "completed" ? (
            <Btn
              c="border"
              onClick={() =>
                act(() => api.patch(`/tasks/${t._id}/reopen`), "Task reopened.")
              }
            >
              <RotateCcw size={14} />
              Reopen
            </Btn>
          ) : (
            <Btn
              c="bg-green-600 text-white"
              onClick={() =>
                act(
                  () => api.patch(`/tasks/${t._id}/complete`),
                  "Task marked as completed.",
                )
              }
            >
              <Check size={14} />
              Complete
            </Btn>
          )}
          <Btn
            c="text-red-600 border border-red-200"
            onClick={() => setDel(true)}
          >
            <Trash2 size={14} />
            Delete
          </Btn>
        </div>
      )}
      {del && (
        <Confirm
          onNo={() => setDel(false)}
          onYes={() =>
            act(
              () => api.delete("/tasks/" + t._id),
              "Task deleted successfully.",
            )
          }
        />
      )}
      {view && (
        <Modal onClose={() => setView(false)}>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {t.description || "No description"}
          </p>
          <p className="mt-3 text-sm">
            <b>Notes:</b> {t.notes || "—"}
          </p>
          <p className="text-sm">
            <b>Due:</b> {fmt(t.dueAt)}
          </p>
          {t.completedAt && (
            <p className="text-sm">
              <b>Completed:</b> {fmt(t.completedAt)}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function Section({ title, params, onEdit }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => {
    api
      .get("/tasks", { params: { ...params, limit: 5 } })
      .then((r) => setD(r.data.tasks))
      .catch(err);
  }, [JSON.stringify(params)]);
  useReload(load);
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {!d ? (
        <Skeleton />
      ) : d.length ? (
        <div className="space-y-3">
          {d.map((t) => (
            <TaskCard key={t._id} t={t} compact onEdit={onEdit} />
          ))}
        </div>
      ) : (
        <Empty
          text={
            params.deadline === "today"
              ? "You're all caught up for today."
              : "Nothing here."
          }
        />
      )}
    </section>
  );
}

function Dashboard({ onEdit }) {
  const [s, setS] = useState(null);
  const load = useCallback(() => {
    api
      .get("/tasks/statistics")
      .then((r) => setS(r.data))
      .catch(err);
  }, []);
  useReload(load);
  const h = +new Date().toLocaleString("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  });
  const cards = s
    ? [
        ["Total Tasks", s.total],
        ["Pending", s.pending],
        ["In Progress", s.inProgress],
        ["Completed", s.completed],
        ["Due Today", s.dueToday],
        ["Overdue", s.overdue],
      ]
    : [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Good {h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening"}, Rohan
      </h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {s ? (
          cards.map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{k}</p>
              <p className="text-2xl font-bold text-purple-700">{v}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full h-20 animate-pulse rounded-xl bg-purple-50" />
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Today's Tasks"
          params={{ deadline: "today", status: "all" }}
          onEdit={onEdit}
        />
        <Section
          title="Upcoming Deadlines"
          params={{ deadline: "upcoming" }}
          onEdit={onEdit}
        />
        <Section
          title="Overdue Tasks"
          params={{ deadline: "overdue" }}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

function Tasks({ onEdit }) {
  const [sp] = useSearchParams();
  const search = sp.get("search") || "";
  const [f, setF] = useState({
    status: "all",
    priority: "all",
    deadline: "all",
    category: "all",
    sort: "dueDate",
    page: 1,
  });
  const [d, setD] = useState(null);
  const [bad, setBad] = useState(false);
  const load = useCallback(() => {
    api
      .get("/tasks", { params: { ...f, search, limit: 10 } })
      .then((r) => {
        setD(r.data);
        setBad(false);
      })
      .catch((e) => {
        setBad(true);
        err(e);
      });
  }, [JSON.stringify(f), search]);
  useReload(load);
  useEffect(() => setF((x) => ({ ...x, page: 1 })), [search]);
  const ch = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });
  const Sel = ({ k, opts }) => (
    <select
      className="rounded-lg border px-2 py-2 text-sm"
      value={f[k]}
      onChange={ch(k)}
    >
      {opts.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
  const cap = (a) => a.map((x) => [x, x[0].toUpperCase() + x.slice(1)]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Tasks</h1>
      <div className="flex flex-wrap gap-2">
        <Sel
          k="status"
          opts={[
            ["all", "All status"],
            ["pending", "Pending"],
            ["in-progress", "In Progress"],
            ["completed", "Completed"],
          ]}
        />
        <Sel
          k="priority"
          opts={[
            ["all", "All priority"],
            ...cap(["low", "medium", "high", "urgent"]),
          ]}
        />
        <Sel
          k="deadline"
          opts={[
            ["all", "All deadlines"],
            ["today", "Today"],
            ["tomorrow", "Tomorrow"],
            ["week", "This Week"],
            ["overdue", "Overdue"],
          ]}
        />
        <Sel
          k="category"
          opts={[["all", "All categories"], ...CATS.map((c) => [c, c])]}
        />
        <Sel
          k="sort"
          opts={[
            ["dueDate", "Due Date"],
            ["newest", "Newest"],
            ["oldest", "Oldest"],
            ["priority", "Priority"],
            ["updated", "Recently Updated"],
          ]}
        />
      </div>
      {bad ? (
        <Empty text="Could not load tasks. Is the server running?" />
      ) : !d ? (
        <Skeleton />
      ) : !d.tasks.length ? (
        <Empty text="No tasks found." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {d.tasks.map((t) => (
            <TaskCard key={t._id} t={t} onEdit={onEdit} />
          ))}
        </div>
      )}
      {d && d.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Btn
            c="border"
            disabled={!d.hasPreviousPage}
            onClick={() => setF({ ...f, page: f.page - 1 })}
          >
            Previous
          </Btn>
          {Array.from({ length: d.totalPages }, (_, i) => i + 1).map((p) => (
            <Btn
              key={p}
              c={p === d.currentPage ? "bg-purple-600 text-white" : "border"}
              onClick={() => setF({ ...f, page: p })}
            >
              {p}
            </Btn>
          ))}
          <Btn
            c="border"
            disabled={!d.hasNextPage}
            onClick={() => setF({ ...f, page: f.page + 1 })}
          >
            Next
          </Btn>
        </div>
      )}
    </div>
  );
}

function Bars({ title, rows }) {
  const m = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {rows.length ? (
        rows.map((r) => (
          <div key={r._id} className="mb-1.5 flex items-center gap-2 text-xs">
            <span className="w-24 truncate capitalize">{r._id}</span>
            <div className="h-3 flex-1 rounded bg-purple-50">
              <div
                className="h-3 rounded bg-purple-600"
                style={{ width: (r.count / m) * 100 + "%" }}
              />
            </div>
            <span>{r.count}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No data</p>
      )}
    </div>
  );
}
function Stats() {
  const [s, setS] = useState(null);
  const load = useCallback(() => {
    api
      .get("/tasks/statistics")
      .then((r) => setS(r.data))
      .catch(err);
  }, []);
  useReload(load);
  if (!s) return <Skeleton />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Statistics</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total", s.total],
          ["Completed", s.completed],
          ["Pending", s.pending],
          ["In Progress", s.inProgress],
          ["Overdue", s.overdue],
          ["Completion", s.completionPercentage + "%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{k}</p>
            <p className="text-2xl font-bold text-purple-700">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Bars
          title="Completed vs Pending"
          rows={[
            { _id: "completed", count: s.completed },
            { _id: "pending", count: s.pending + s.inProgress },
          ]}
        />
        <Bars title="Tasks by Priority" rows={s.byPriority} />
        <Bars title="Tasks by Category" rows={s.byCategory} />
        <Bars title="Completed (last 7 days)" rows={s.completedOverTime} />
      </div>
    </div>
  );
}

function Bell_() {
  const [o, setO] = useState(false),
    [d, setD] = useState({ notifications: [], unreadCount: 0 });
  const load = useCallback(() => {
    api
      .get("/notifications")
      .then((r) => setD(r.data))
      .catch(() => {});
  }, []);
  useReload(load);
  useEffect(() => {
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, [load]);
  const run = async (fn) => {
    await fn();
    load();
  };
  return (
    <div className="relative">
      <button
        onClick={() => setO(!o)}
        className="relative rounded-lg p-2 hover:bg-purple-50"
      >
        <Bell size={20} />
        {d.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
            {d.unreadCount}
          </span>
        )}
      </button>
      {o && (
        <div className="absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-auto rounded-xl border bg-white p-3 shadow-lg">
          <div className="mb-2 flex justify-between">
            <b className="text-sm">Notifications</b>
            <button
              className="text-xs text-purple-600"
              onClick={() => run(() => api.patch("/notifications/read-all"))}
            >
              Mark all read
            </button>
          </div>
          {d.notifications.length ? (
            d.notifications.map((n) => (
              <div
                key={n._id}
                className={`mb-1 flex gap-2 rounded-lg p-2 text-sm ${n.isRead ? "" : "bg-purple-50"}`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    run(() => api.patch(`/notifications/${n._id}/read`))
                  }
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-gray-600">{n.message}</p>
                </div>
                <button
                  onClick={() =>
                    run(() => api.delete("/notifications/" + n._id))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
}

function Layout() {
  const nav = useNavigate();
  const [form, setForm] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== "" || location.pathname === "/tasks")
        nav("/tasks?search=" + encodeURIComponent(q));
    }, 400);
    return () => clearTimeout(t);
  }, [q]);
  const links = [
    ["/", "Dashboard", LayoutDashboard],
    ["/tasks", "My Tasks", ListTodo],
    ["/stats", "Statistics", BarChart3],
  ];
  const edit = (t) => setForm(t || null);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b bg-white px-4 py-2">
        <b className="text-lg text-purple-700">TaskFlow</b>
        <nav className="flex gap-1">
          {links.map(([to, l, Ic]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-purple-50"}`
              }
            >
              <Ic size={16} />
              <span className="hidden sm:inline">{l}</span>
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-3 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks"
              className="w-40 rounded-lg border py-2 pl-7 pr-2 text-sm md:w-64"
            />
          </div>
          <Bell_ />
          <Primary onClick={() => edit()}>
            <Plus size={16} />
            Add Task
          </Primary>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/" element={<Dashboard onEdit={edit} />} />
          <Route path="/tasks" element={<Tasks onEdit={edit} />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      {form !== null && (
        <TaskForm
          task={form?._id ? form : null}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
      <ToastContainer position="bottom-right" />
    </BrowserRouter>
  );
}
