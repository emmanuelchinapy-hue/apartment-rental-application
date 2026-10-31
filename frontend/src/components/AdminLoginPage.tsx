import { type FormEvent, useState } from "react";
import { api } from "../api";
import AdminDashboardPage from "./AdminDashboardPage";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@rental.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post("/admin/login", { email, password });
      setLoggedIn(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed.");
    }
  }

  if (loggedIn) return <AdminDashboardPage />;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Private admin</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Management Login</h2>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <button type="submit" className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
