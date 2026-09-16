import { Clapperboard, Eye, EyeOff, UploadCloud } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    avatar: null,
    coverImage: null,
  });
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const update = (e) =>
    setData({
      ...data,
      [e.target.name]: e.target.files?.[0] || e.target.value,
    });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) {
        await login({
          username: data.username || undefined,
          email: data.email || undefined,
          password: data.password,
        });
      } else {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => v && fd.append(k, v));
        await authService.register(fd);
        await login({ username: data.username, password: data.password });
      }
      toast.success(isLogin ? "Welcome back!" : "Your channel is ready!");
      nav(loc.state?.from?.pathname || "/dashboard");
    } catch (error) {
      // Clear password field only, keeping username/email intact
      setData((prev) => ({ ...prev, password: "" }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-[radial-gradient(circle_at_25%_20%,rgba(229,9,20,.5),transparent_28rem),linear-gradient(145deg,#220306,#080808)] p-12 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand">
            <Clapperboard size={20} />
          </span>
          streamline
        </div>
        <div className="my-auto max-w-lg">
          <span className="inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-[.18em] text-red-200">
            STREAMLINE ORIGINALS
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight">
            Every story deserves
            <br />a premiere.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            A clear, beautiful home for your videos, audience, and creative
            momentum.
          </p>
        </div>
        <div className="flex gap-2 text-sm text-slate-400">
          <UploadCloud size={18} /> Built for independent creators
        </div>
      </section>
      <main className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand">
              <Clapperboard size={20} />
            </span>
            streamline
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand">
            {isLogin ? "Welcome back" : "Start creating"}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">
            {isLogin ? "Sign in to your studio" : "Create your channel"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin
              ? "Pick up where you left off."
              : "It takes less than a minute."}
          </p>
          <div className="mt-7 space-y-4">
            {!isLogin && (
              <>
                <input
                  className="input"
                  name="fullname"
                  value={data.fullname}
                  placeholder="Full name"
                  required
                  onChange={update}
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer rounded-xl border border-dashed border-white/20 p-3 text-xs text-slate-400 hover:border-brand">
                    Avatar{" "}
                    <input
                      className="mt-2 block w-full text-xs"
                      type="file"
                      name="avatar"
                      accept="image/*"
                      required
                      onChange={update}
                    />
                  </label>
                  <label className="cursor-pointer rounded-xl border border-dashed border-white/20 p-3 text-xs text-slate-400 hover:border-brand">
                    Cover{" "}
                    <input
                      className="mt-2 block w-full text-xs"
                      type="file"
                      name="coverImage"
                      accept="image/*"
                      onChange={update}
                    />
                  </label>
                </div>
              </>
            )}

            {/* Conditional Username & Email handling */}
            {isLogin ? (
              <input
                className="input"
                name="username"
                value={data.username}
                placeholder="Username or Email"
                required
                onChange={update}
              />
            ) : (
              <>
                <input
                  className="input"
                  name="username"
                  value={data.username}
                  placeholder="Username"
                  required
                  onChange={update}
                />
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={data.email}
                  placeholder="Email address"
                  required
                  onChange={update}
                />
              </>
            )}

            <div className="relative">
              <input
                className="input pr-12"
                type={showPass ? "text" : "password"}
                name="password"
                value={data.password}
                placeholder="Password"
                required
                onChange={update}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-slate-400"
              >
                {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>
          <button disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Create my channel"}
          </button>
          <p className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <Link
              className="font-bold text-red-400 hover:text-red-300"
              to={isLogin ? "/register" : "/login"}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
