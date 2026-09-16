import {
  Bookmark,
  Clapperboard,
  Compass,
  Flame,
  History,
  LogOut,
  Search,
  UserCircle,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import GlassCard from "./GlassCard";

const nav = [
  { to: "/dashboard", label: "My studio", icon: Video },
  { to: "/shorts", label: "Shorts & Reels", icon: Flame },
  { to: "/history", label: "Watch history", icon: History },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryFromUrl = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryFromUrl);

  useEffect(() => {
    setSearchTerm(queryFromUrl);
  }, [queryFromUrl]);

  const handleLogout = async () => {
    await logout();
    toast.success("You’re signed out");
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchTerm.trim();

    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-extrabold shrink-0"
          >
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e50914] shadow-[0_0_28px_rgba(229,9,20,.6)]">
              <Clapperboard size={20} />
            </span>

            <span className="hidden sm:inline">streamline</span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md mx-2"
          >
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search channels, creators, videos…"
              className="w-full rounded-full border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-brand focus:bg-white/10 focus:ring-1 focus:ring-brand"
            />
          </form>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-white/10 p-4 md:block">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-l-2 border-brand bg-brand/15 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}

          <GlassCard className="mt-6 p-4" hover={false}>
            <Compass className="mb-3 text-brand" />

            <p className="text-sm font-bold">Your channel</p>

            <p className="mt-1 truncate text-xs text-slate-400">
              @{user?.username}
            </p>

            <Link
              className="mt-3 block text-xs font-bold text-red-400 hover:text-red-300"
              to={`/channel/${user?.username}`}
            >
              View public profile →
            </Link>
          </GlassCard>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
