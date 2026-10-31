export type PaymentMethod =
  | "BANK_TRANSFER"
  | "PAYPAL"
  | "CASH_APP"
  | "CRYPTO_TRANSFER"
  | "WESTERN_UNION";

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export interface ApplicationRecord {
  id: string;
  refNumber: string;
  fullName: string;
  email: string;
  contactNumber: string;
  newApartmentAddress: string;
  monthlyRentalBudget: number;
  preferredMoveInDate: string;
  applicationStatus: ApplicationStatus;
  preferredPaymentMethod?: PaymentMethod | null;
  submissionDate: string;
  notes?: string | null;
  documents?: Array<{ id: string; originalName: string; filePath: string }>;
}
