CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUESTED', 'APPROVED', 'REJECTED');
CREATE TYPE "PreferredPaymentMethod" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'CASH_APP', 'CRYPTO_TRANSFER', 'WESTERN_UNION');

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "currentHomeAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "preferredContactMethod" TEXT NOT NULL,
    "newApartmentAddress" TEXT NOT NULL,
    "newApartmentCity" TEXT NOT NULL,
    "newApartmentState" TEXT NOT NULL,
    "newApartmentPostalCode" TEXT NOT NULL,
    "monthlyRentalBudget" DOUBLE PRECISION NOT NULL,
    "preferredMoveInDate" TIMESTAMP(3) NOT NULL,
    "intendedDurationOfStay" TEXT NOT NULL,
    "numberOfOccupants" INTEGER NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "employerName" TEXT,
    "jobTitle" TEXT,
    "lengthOfEmployment" TEXT,
    "monthlyIncome" DOUBLE PRECISION,
    "alternativeIncome" TEXT,
    "hasPriorRentalHistory" BOOLEAN NOT NULL,
    "previousRentalAddress" TEXT,
    "previousLandlordName" TEXT,
    "previousLandlordContact" TEXT,
    "previousTenancyLength" TEXT,
    "reasonForLeaving" TEXT,
    "intendedOccupants" TEXT,
    "pets" TEXT,
    "additionalInformation" TEXT,
    "specialAccommodation" TEXT,
    "consentToProcess" BOOLEAN NOT NULL,
    "privacyNoticeAccepted" BOOLEAN NOT NULL,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "preferredPaymentMethod" "PreferredPaymentMethod",
    "paymentPreferenceSelectedAt" TIMESTAMP(3),
    "paymentPreferenceLastUpdatedAt" TIMESTAMP(3),
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "incomeVerificationDocumentName" TEXT,
    "incomeVerificationDocumentPath" TEXT,
    "incomeVerificationDocumentMime" TEXT,
    "incomeVerificationDocumentSize" INTEGER,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX "Application_refNumber_key" ON "Application"("refNumber");
CREATE INDEX "Application_email_idx" ON "Application"("email");
CREATE INDEX "Application_applicationStatus_idx" ON "Application"("applicationStatus");
CREATE INDEX "Application_preferredPaymentMethod_idx" ON "Application"("preferredPaymentMethod");
CREATE INDEX "Application_refNumber_idx" ON "Application"("refNumber");

ALTER TABLE "Document"
    ADD CONSTRAINT "Document_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
