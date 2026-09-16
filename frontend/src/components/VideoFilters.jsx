import { Filter, RotateCcw, X } from "lucide-react";
import { useState } from "react";

const dateOptions = [
  ["", "Any date"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last7Days", "Last 7 days"],
  ["last30Days", "Last 30 days"],
  ["thisMonth", "This month"],
  ["lastMonth", "Last month"],
  ["last3Months", "Last 3 months"],
  ["thisYear", "This year"],
  ["custom", "Custom range"],
];

export default function VideoFilters({ filters, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const update = (key, value) =>
    onChange({ ...filters, [key]: value, page: 1 });
  const activeCount = [
    filters.dateRange,
    filters.type,
    filters.status,
    filters.sortBy !== "newest" ? filters.sortBy : "",
  ].filter(Boolean).length;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Open filters"
        className={`relative grid h-9 w-9 place-items-center rounded-xl border text-slate-300 transition hover:text-white ${open || activeCount ? "border-brand bg-brand/15 text-brand" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
      >
        {open ? <X size={16} /> : <Filter size={16} />}
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-40 grid min-w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-xl border border-white/10 bg-[#181818] p-4 shadow-2xl">
          <label className="text-xs font-semibold text-slate-400">
            Date uploaded
            <select
              value={filters.dateRange}
              onChange={(e) => update("dateRange", e.target.value)}
              className="input mt-1 w-full py-2 text-xs"
            >
              {dateOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-400">
                From
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="input mt-1 w-full py-2 text-xs"
                />
              </label>
              <label className="text-xs font-semibold text-slate-400">
                To
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className="input mt-1 w-full py-2 text-xs"
                />
              </label>
            </div>
          )}
          <label className="text-xs font-semibold text-slate-400">
            Content type
            <select
              value={filters.type}
              onChange={(e) => update("type", e.target.value)}
              className="input mt-1 w-full py-2 text-xs"
            >
              <option value="">All</option>
              <option value="videos">Videos</option>
              <option value="shorts">Shorts</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Status
            <select
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              className="input mt-1 w-full py-2 text-xs"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Sort by
            <select
              value={filters.sortBy}
              onChange={(e) => update("sortBy", e.target.value)}
              className="input mt-1 w-full py-2 text-xs"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
              <option value="mostViewed">Most viewed</option>
              <option value="mostLiked">Most liked</option>
              <option value="mostCommented">Most commented</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="btn-secondary py-2 text-xs"
          >
            <RotateCcw size={14} /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
