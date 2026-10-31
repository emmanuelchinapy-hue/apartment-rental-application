import { useEffect, useState } from "react";
import { api } from "../api";
import type { ApplicationRecord, ApplicationStatus, PaymentMethod } from "../types";

const statusLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ADDITIONAL_INFORMATION_REQUESTED: "Additional Information Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected"
};

const paymentLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bank transfer",
  PAYPAL: "PayPal",
  CASH_APP: "Cash App",
  CRYPTO_TRANSFER: "Crypto transfer",
  WESTERN_UNION: "Western Union"
};

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [notes, setNotes] = useState("");
  const [authError, setAuthError] = useState("");

  async function loadApplications() {
    try {
      const response = await api.get("/admin/applications", {
        params: {
          search,
          status: statusFilter || undefined,
          paymentMethod: paymentFilter || undefined
        }
      });
      setApplications(response.data);
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || "Unable to load applications.");
    }
  }

  useEffect(() => {
    loadApplications();
  }, [search, statusFilter, paymentFilter]);

  async function openApplication(id: string) {
    try {
      const response = await api.get(`/admin/applications/${id}`);
      setSelectedApp(response.data);
      setNotes(response.data.notes || "");
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || "Unable to load application.");
    }
  }

  async function saveApplication() {
    if (!selectedApp) return;
    await api.patch(`/admin/applications/${selectedApp.id}`, {
      status: selectedApp.applicationStatus,
      notes
    });
    await loadApplications();
    await openApplication(selectedApp.id);
  }

  async function updatePaymentPreference(value: string) {
    if (!selectedApp) return;
    await api.patch(`/admin/applications/${selectedApp.id}/payment-preference`, {
      preferredPaymentMethod: value || null
    });
    await loadApplications();
    await openApplication(selectedApp.id);
  }

  async function clearPaymentPreference() {
    if (!selectedApp) return;
    await api.patch(`/admin/applications/${selectedApp.id}/payment-preference`, {
      preferredPaymentMethod: null
    });
    await loadApplications();
    await openApplication(selectedApp.id);
  }

  function exportCsv() {
    window.open("http://localhost:3001/api/admin/export/csv", "_blank");
  }

  const total = applications.length;
  const newApplications = applications.filter((app) => app.applicationStatus === "SUBMITTED").length;
  const underReview = applications.filter((app) => app.applicationStatus === "UNDER_REVIEW").length;
  const approved = applications.filter((app) => app.applicationStatus === "APPROVED").length;
  const rejected = applications.filter((app) => app.applicationStatus === "REJECTED").length;

  return (
    <div className="mx-auto max-w-7xl p-4 py-8">
      {authError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{authError}</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-5">
            <div className="panel"><p className="text-sm text-slate-500">Total applications</p><h3 className="mt-2 text-2xl font-bold">{total}</h3></div>
            <div className="panel"><p className="text-sm text-slate-500">New</p><h3 className="mt-2 text-2xl font-bold">{newApplications}</h3></div>
            <div className="panel"><p className="text-sm text-slate-500">Under review</p><h3 className="mt-2 text-2xl font-bold">{underReview}</h3></div>
            <div className="panel"><p className="text-sm text-slate-500">Approved</p><h3 className="mt-2 text-2xl font-bold">{approved}</h3></div>
            <div className="panel"><p className="text-sm text-slate-500">Rejected</p><h3 className="mt-2 text-2xl font-bold">{rejected}</h3></div>
          </div>

          <div className="panel mb-6">
            <div className="grid gap-4 md:grid-cols-4">
              <input className="input" placeholder="Search by name, email, or ref" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select className="select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="">All payment methods</option>
                {Object.entries(paymentLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button onClick={exportCsv} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white">Export CSV</button>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Applicant</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Email</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Apartment</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Budget</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Move-in</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Status</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Payment</th>
                    <th className="px-4 py-3 text-xs uppercase text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{app.fullName}</div>
                        <div className="text-xs text-slate-500">Ref: {app.refNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{app.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{app.contactNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{app.newApartmentAddress}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">${app.monthlyRentalBudget}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{new Date(app.preferredMoveInDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabels[app.applicationStatus]}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-700">{app.preferredPaymentMethod ? paymentLabels[app.preferredPaymentMethod] : "Not set"}</td>
                      <td className="px-4 py-3"><button onClick={() => openApplication(app.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedApp && (
            <div className="panel">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Application</p>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedApp.fullName} · {selectedApp.refNumber}</h3>
                </div>
                <button onClick={() => setSelectedApp(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Applicant details</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li><strong>Email:</strong> {selectedApp.email}</li>
                      <li><strong>Contact:</strong> {selectedApp.contactNumber}</li>
                      <li><strong>Country:</strong> {selectedApp.countryOfResidence}</li>
                      <li><strong>Address:</strong> {selectedApp.currentHomeAddress}</li>
                      <li><strong>City:</strong> {selectedApp.city}, {selectedApp.state} {selectedApp.postalCode}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Apartment information</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li><strong>Address:</strong> {selectedApp.newApartmentAddress}</li>
                      <li><strong>City:</strong> {selectedApp.newApartmentCity}, {selectedApp.newApartmentState} {selectedApp.newApartmentPostalCode}</li>
                      <li><strong>Budget:</strong> ${selectedApp.monthlyRentalBudget}</li>
                      <li><strong>Move-in date:</strong> {new Date(selectedApp.preferredMoveInDate).toLocaleDateString()}</li>
                      <li><strong>Duration:</strong> {selectedApp.intendedDurationOfStay}</li>
                      <li><strong>Occupants:</strong> {selectedApp.numberOfOccupants}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Employment and income</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li><strong>Status:</strong> {selectedApp.employmentStatus}</li>
                      <li><strong>Employer:</strong> {selectedApp.employerName || "N/A"}</li>
                      <li><strong>Job title:</strong> {selectedApp.jobTitle || "N/A"}</li>
                      <li><strong>Monthly income:</strong> ${selectedApp.monthlyIncome || "N/A"}</li>
                      <li><strong>Alternative income:</strong> {selectedApp.alternativeIncome || "N/A"}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Supporting documents</h4>
                    {selectedApp.documents?.length ? (
                      <ul className="space-y-2">
                        {selectedApp.documents.map((doc: any) => (
                          <li key={doc.id}><a href={`http://localhost:3001${doc.filePath}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700">{doc.originalName}</a></li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No uploaded documents.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Payment preference</h4>
                    <div className="space-y-3">
                      <select className="select" value={selectedApp.preferredPaymentMethod || ""} onChange={(e) => updatePaymentPreference(e.target.value)}>
                        <option value="">No preference selected</option>
                        {Object.entries(paymentLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button onClick={clearPaymentPreference} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Clear payment preference</button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Application status</h4>
                    <select className="select" value={selectedApp.applicationStatus} onChange={(e) => setSelectedApp((prev: any) => ({ ...prev, applicationStatus: e.target.value }))}>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <textarea className="input mt-3 min-h-[100px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add management notes..." />
                    <button onClick={saveApplication} className="mt-3 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white">Save changes</button>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Audit log</h4>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {(selectedApp.audits || []).map((audit: any) => (
                        <div key={audit.id} className="rounded-lg border border-slate-200 p-3 text-xs text-slate-700">
                          <div className="font-semibold">{audit.action}</div>
                          <div className="mt-1">{audit.details}</div>
                          <div className="mt-1 text-slate-500">{new Date(audit.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
