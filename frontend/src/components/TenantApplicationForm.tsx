import { useState, type FormEvent } from "react";
import { api } from "../api";

const paymentOptions = [
  "BANK_TRANSFER",
  "PAYPAL",
  "CASH_APP",
  "CRYPTO_TRANSFER",
  "WESTERN_UNION"
];

const initialForm = {
  fullName: "",
  email: "",
  contactNumber: "",
  countryOfResidence: "",
  currentHomeAddress: "",
  city: "",
  state: "",
  postalCode: "",
  preferredContactMethod: "Email",
  newApartmentAddress: "110 Cedar Lane, Unit 8B",
  newApartmentCity: "Seattle",
  newApartmentState: "WA",
  newApartmentPostalCode: "98101",
  monthlyRentalBudget: "3200",
  preferredMoveInDate: "",
  intendedDurationOfStay: "12 months",
  numberOfOccupants: "2",
  employmentStatus: "Employed Full-Time",
  employerName: "",
  jobTitle: "",
  lengthOfEmployment: "",
  monthlyIncome: "",
  alternativeIncome: "",
  hasPriorRentalHistory: "true",
  previousRentalAddress: "",
  previousLandlordName: "",
  previousLandlordContact: "",
  previousTenancyLength: "",
  reasonForLeaving: "",
  intendedOccupants: "",
  pets: "",
  additionalInformation: "",
  specialAccommodation: "",
  consentToProcess: "false",
  privacyNoticeAccepted: "false"
};

export default function TenantApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<any>(null);
  const [paymentPreference, setPaymentPreference] = useState<string>("");
  const [paymentSaved, setPaymentSaved] = useState(false);

  const isReady =
    form.fullName &&
    form.email &&
    form.contactNumber &&
    form.countryOfResidence &&
    form.currentHomeAddress &&
    form.city &&
    form.state &&
    form.postalCode &&
    form.newApartmentAddress &&
    form.newApartmentCity &&
    form.newApartmentState &&
    form.newApartmentPostalCode &&
    form.monthlyRentalBudget &&
    form.preferredMoveInDate &&
    form.intendedDurationOfStay &&
    form.numberOfOccupants &&
    form.employmentStatus &&
    form.monthlyIncome &&
    form.consentToProcess === "true" &&
    form.privacyNoticeAccepted === "true" &&
    uploadedFile;

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full legal name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.contactNumber.trim()) nextErrors.contactNumber = "Contact number is required.";
    if (!form.countryOfResidence.trim()) nextErrors.countryOfResidence = "Country of residence is required.";
    if (!form.currentHomeAddress.trim()) nextErrors.currentHomeAddress = "Current home address is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";
    if (!form.postalCode.trim()) nextErrors.postalCode = "Postal code is required.";
    if (!form.newApartmentAddress.trim()) nextErrors.newApartmentAddress = "Apartment address is required.";
    if (!form.newApartmentCity.trim()) nextErrors.newApartmentCity = "Apartment city is required.";
    if (!form.newApartmentState.trim()) nextErrors.newApartmentState = "Apartment state is required.";
    if (!form.newApartmentPostalCode.trim()) nextErrors.newApartmentPostalCode = "Apartment postal code is required.";
    if (!form.preferredMoveInDate) nextErrors.preferredMoveInDate = "Preferred move-in date is required.";
    if (!form.intendedDurationOfStay.trim()) nextErrors.intendedDurationOfStay = "Duration of stay is required.";
    if (!form.numberOfOccupants) nextErrors.numberOfOccupants = "Number of occupants is required.";
    if (!form.employmentStatus.trim()) nextErrors.employmentStatus = "Employment status is required.";
    if (!form.monthlyIncome) nextErrors.monthlyIncome = "Monthly income is required.";
    if (form.consentToProcess !== "true") nextErrors.consentToProcess = "Please confirm the declaration.";
    if (form.privacyNoticeAccepted !== "true") nextErrors.privacyNoticeAccepted = "Please accept the privacy notice.";

    if (!uploadedFile) {
      nextErrors.incomeProof = "Proof of employment or income is required.";
    } else {
      const allowed = ["application/pdf", "image/png", "image/jpeg"];
      const maxBytes = 5 * 1024 * 1024;
      if (!allowed.includes(uploadedFile.type)) {
        nextErrors.incomeProof = "Only PDF, JPG, and PNG files are allowed.";
      }
      if (uploadedFile.size > maxBytes) {
        nextErrors.incomeProof = "File must be 5 MB or less.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, String(value)));
    if (uploadedFile) formData.append("incomeProof", uploadedFile);

    try {
      const response = await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess(response.data);
      setLoading(false);
      setPaymentPreference("");
      setPaymentSaved(false);
    } catch (error: any) {
      setLoading(false);
      const apiErrors = error?.response?.data?.errors || [];
      if (apiErrors.length) {
        const nextErrors: Record<string, string> = {};
        apiErrors.forEach((entry: any) => {
          nextErrors[entry.field] = entry.message;
        });
        setErrors(nextErrors);
      } else {
        setErrors({ form: error?.response?.data?.message || "Submission failed." });
      }
    }
  }

  async function handlePaymentSave() {
    if (!success?.application?.id || !paymentPreference) return;

    try {
      await api.post(`/applications/${success.application.id}/payment-preference`, {
        paymentPreference
      });
      setPaymentSaved(true);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Unable to save payment preference.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 py-8 md:p-8">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Apartment rental</p>
        <h2 className="mt-2 text-2xl font-bold">Application Form</h2>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="panel">
            <h3 className="text-2xl font-bold text-slate-900">Application submitted successfully</h3>
            <p className="mt-3 text-slate-600">Your unique application reference number is:</p>
            <div className="mt-4 inline-block rounded-xl bg-brand-50 px-4 py-2 text-xl font-bold text-brand-900">
              {success.application.refNumber}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-semibold text-slate-900">Preferred payment method</h3>
            <p className="mt-2 text-sm text-slate-600">
              This does not authorize an immediate payment and does not guarantee approval. Management may request payment later only after review.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center rounded-xl border p-3 text-sm font-medium ${
                    paymentPreference === option
                      ? "border-brand-500 bg-brand-50 text-brand-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentPreference"
                    value={option}
                    checked={paymentPreference === option}
                    onChange={() => setPaymentPreference(option)}
                    className="mr-2"
                  />
                  {option.replace(/_/g, " ")}
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePaymentSave}
              disabled={!paymentPreference}
              className="mt-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save payment preference
            </button>

            {paymentSaved && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Your preferred payment method has been saved.
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section A: Personal Information</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 1</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Full legal name</label>
                <input className="input" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
                {errors.fullName && <div className="error">{errors.fullName}</div>}
              </div>
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                {errors.email && <div className="error">{errors.email}</div>}
              </div>
              <div>
                <label className="label">Contact number</label>
                <input className="input" value={form.contactNumber} onChange={(e) => updateField("contactNumber", e.target.value)} />
                {errors.contactNumber && <div className="error">{errors.contactNumber}</div>}
              </div>
              <div>
                <label className="label">Country of residence</label>
                <input className="input" value={form.countryOfResidence} onChange={(e) => updateField("countryOfResidence", e.target.value)} />
                {errors.countryOfResidence && <div className="error">{errors.countryOfResidence}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="label">Current home address</label>
                <input className="input" value={form.currentHomeAddress} onChange={(e) => updateField("currentHomeAddress", e.target.value)} />
                {errors.currentHomeAddress && <div className="error">{errors.currentHomeAddress}</div>}
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                {errors.city && <div className="error">{errors.city}</div>}
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
                {errors.state && <div className="error">{errors.state}</div>}
              </div>
              <div>
                <label className="label">Postal code</label>
                <input className="input" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
                {errors.postalCode && <div className="error">{errors.postalCode}</div>}
              </div>
              <div>
                <label className="label">Preferred contact method</label>
                <select className="select" value={form.preferredContactMethod} onChange={(e) => updateField("preferredContactMethod", e.target.value)}>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section B: New Apartment Information</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 2</span>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              <div className="font-semibold">Apartment address supplied by the agent</div>
              <div className="mt-1">{form.newApartmentAddress}, {form.newApartmentCity}, {form.newApartmentState} {form.newApartmentPostalCode}</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Monthly rental budget</label>
                <input className="input" type="number" min="0" value={form.monthlyRentalBudget} onChange={(e) => updateField("monthlyRentalBudget", e.target.value)} />
              </div>
              <div>
                <label className="label">Preferred move-in date</label>
                <input className="input" type="date" value={form.preferredMoveInDate} onChange={(e) => updateField("preferredMoveInDate", e.target.value)} />
                {errors.preferredMoveInDate && <div className="error">{errors.preferredMoveInDate}</div>}
              </div>
              <div>
                <label className="label">Intended duration of stay</label>
                <input className="input" value={form.intendedDurationOfStay} onChange={(e) => updateField("intendedDurationOfStay", e.target.value)} />
                {errors.intendedDurationOfStay && <div className="error">{errors.intendedDurationOfStay}</div>}
              </div>
              <div>
                <label className="label">Number of intended occupants</label>
                <input className="input" type="number" min="1" value={form.numberOfOccupants} onChange={(e) => updateField("numberOfOccupants", e.target.value)} />
                {errors.numberOfOccupants && <div className="error">{errors.numberOfOccupants}</div>}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section C: Employment and Income Verification</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 3</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Current employment status</label>
                <select className="select" value={form.employmentStatus} onChange={(e) => updateField("employmentStatus", e.target.value)}>
                  <option value="Employed Full-Time">Employed Full-Time</option>
                  <option value="Employed Part-Time">Employed Part-Time</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                  <option value="Student">Student</option>
                </select>
              </div>
              <div>
                <label className="label">Employer or business name</label>
                <input className="input" value={form.employerName} onChange={(e) => updateField("employerName", e.target.value)} />
              </div>
              <div>
                <label className="label">Job title or occupation</label>
                <input className="input" value={form.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
              </div>
              <div>
                <label className="label">Length of employment</label>
                <input className="input" value={form.lengthOfEmployment} onChange={(e) => updateField("lengthOfEmployment", e.target.value)} />
              </div>
              <div>
                <label className="label">Monthly income</label>
                <input className="input" type="number" min="0" value={form.monthlyIncome} onChange={(e) => updateField("monthlyIncome", e.target.value)} />
                {errors.monthlyIncome && <div className="error">{errors.monthlyIncome}</div>}
              </div>
              <div>
                <label className="label">Alternative source of income</label>
                <input className="input" value={form.alternativeIncome} onChange={(e) => updateField("alternativeIncome", e.target.value)} />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Proof of employment or income document</p>
              <p className="mt-1 text-xs text-slate-600">Required: employment verification letter, recent payslip, employer letter, or other reasonable proof of income.</p>
              <p className="mt-1 text-xs text-slate-600">Accepted: PDF, JPG, PNG. Maximum 5 MB.</p>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="mt-3 block w-full text-sm text-slate-700"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              />
              {uploadedFile && <div className="mt-2 text-xs text-slate-700">Selected file: {uploadedFile.name}</div>}
              {errors.incomeProof && <div className="error">{errors.incomeProof}</div>}
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section D: Rental History</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 4</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Have you rented a property before?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="hasPriorRentalHistory" value="true" checked={form.hasPriorRentalHistory === "true"} onChange={(e) => updateField("hasPriorRentalHistory", e.target.value)} />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="hasPriorRentalHistory" value="false" checked={form.hasPriorRentalHistory === "false"} onChange={(e) => updateField("hasPriorRentalHistory", e.target.value)} />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Previous rental address</label>
                <input className="input" value={form.previousRentalAddress} onChange={(e) => updateField("previousRentalAddress", e.target.value)} />
              </div>
              <div>
                <label className="label">Previous landlord’s name</label>
                <input className="input" value={form.previousLandlordName} onChange={(e) => updateField("previousLandlordName", e.target.value)} />
              </div>
              <div>
                <label className="label">Previous landlord contact information</label>
                <input className="input" value={form.previousLandlordContact} onChange={(e) => updateField("previousLandlordContact", e.target.value)} />
              </div>
              <div>
                <label className="label">Length of previous tenancy</label>
                <input className="input" value={form.previousTenancyLength} onChange={(e) => updateField("previousTenancyLength", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Reason for leaving</label>
                <textarea className="input min-h-[100px]" value={form.reasonForLeaving} onChange={(e) => updateField("reasonForLeaving", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section E: Additional Information</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 5</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Intended occupants</label>
                <input className="input" value={form.intendedOccupants} onChange={(e) => updateField("intendedOccupants", e.target.value)} />
              </div>
              <div>
                <label className="label">Pets</label>
                <input className="input" value={form.pets} onChange={(e) => updateField("pets", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Additional information</label>
                <textarea className="input min-h-[100px]" value={form.additionalInformation} onChange={(e) => updateField("additionalInformation", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Special accommodation requirements</label>
                <textarea className="input min-h-[80px]" value={form.specialAccommodation} onChange={(e) => updateField("specialAccommodation", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Section F: Declaration</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Step 6</span>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.consentToProcess === "true"} onChange={(e) => updateField("consentToProcess", e.target.checked ? "true" : "false")} />
                <span>I confirm the information is accurate and consent to processing for this rental application.</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.privacyNoticeAccepted === "true"} onChange={(e) => updateField("privacyNoticeAccepted", e.target.checked ? "true" : "false")} />
                <span>I accept the privacy notice explaining how personal information will be used and stored securely.</span>
              </label>
              {errors.consentToProcess && <div className="error">{errors.consentToProcess}</div>}
              {errors.privacyNoticeAccepted && <div className="error">{errors.privacyNoticeAccepted}</div>}
            </div>
          </div>

          {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}

          <div className="panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">Review and submit</p>
                <p className="text-sm text-slate-600">Your application will be saved and assigned a reference number.</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setForm(initialForm); setUploadedFile(null); setErrors({}); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">Clear</button>
                <button type="submit" disabled={loading || !isReady} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
