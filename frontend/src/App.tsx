import { useState } from "react";
import TenantApplicationForm from "./components/TenantApplicationForm";
import AdminLoginPage from "./components/AdminLoginPage";

export default function App() {
  const [view, setView] = useState<"tenant" | "admin">("tenant");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Apex Rental Applications</h1>
            <p className="text-sm text-slate-600">Apartment application management portal</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("tenant")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "tenant" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Applicant
            </button>
            <button
              onClick={() => setView("admin")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "admin" ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {view === "tenant" ? <TenantApplicationForm /> : <AdminLoginPage />}
    </div>
  );
}
