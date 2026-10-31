import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../uploads");
const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3001);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadDir));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_LIMIT_MB || 5) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, and PNG files are allowed."));
    }
    cb(null, true);
  }
});

const paymentMethodValues = [
  "BANK_TRANSFER",
  "PAYPAL",
  "CASH_APP",
  "CRYPTO_TRANSFER",
  "WESTERN_UNION"
];

const appSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  contactNumber: z.string().min(7),
  countryOfResidence: z.string().min(2),
  currentHomeAddress: z.string().min(8),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  preferredContactMethod: z.string().min(2),
  newApartmentAddress: z.string().min(5),
  newApartmentCity: z.string().min(2),
  newApartmentState: z.string().min(2),
  newApartmentPostalCode: z.string().min(2),
  monthlyRentalBudget: z.coerce.number().positive(),
  preferredMoveInDate: z.string().min(1),
  intendedDurationOfStay: z.string().min(1),
  numberOfOccupants: z.coerce.number().int().min(1),
  employmentStatus: z.string().min(2),
  employerName: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  lengthOfEmployment: z.string().optional().or(z.literal("")),
  monthlyIncome: z.coerce.number().optional().or(z.literal("")),
  alternativeIncome: z.string().optional().or(z.literal("")),
  hasPriorRentalHistory: z.enum(["true", "false"]),
  previousRentalAddress: z.string().optional().or(z.literal("")),
  previousLandlordName: z.string().optional().or(z.literal("")),
  previousLandlordContact: z.string().optional().or(z.literal("")),
  previousTenancyLength: z.string().optional().or(z.literal("")),
  reasonForLeaving: z.string().optional().or(z.literal("")),
  intendedOccupants: z.string().optional().or(z.literal("")),
  pets: z.string().optional().or(z.literal("")),
  additionalInformation: z.string().optional().or(z.literal("")),
  specialAccommodation: z.string().optional().or(z.literal("")),
  consentToProcess: z.enum(["true", "false"]),
  privacyNoticeAccepted: z.enum(["true", "false"])
});

function sanitizeNullable(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

function generateRefNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AP-${year}-${random}`;
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "") || null;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.post("/api/applications", upload.single("incomeProof"), async (req, res) => {
  try {
    const parsed = appSchema.parse(req.body);

    if (parsed.consentToProcess !== "true" || parsed.privacyNoticeAccepted !== "true") {
      return res.status(400).json({
        message: "You must accept the declaration and privacy notice before submitting."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Proof of employment or income is required."
      });
    }

    const duplicate = await prisma.application.findFirst({
      where: {
        email: parsed.email.trim().toLowerCase(),
        newApartmentAddress: parsed.newApartmentAddress.trim(),
        preferredMoveInDate: new Date(parsed.preferredMoveInDate)
      }
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A similar application already exists. Please contact management if you need to update it."
      });
    }

    const application = await prisma.application.create({
      data: {
        refNumber: generateRefNumber(),
        fullName: parsed.fullName.trim(),
        email: parsed.email.trim().toLowerCase(),
        contactNumber: parsed.contactNumber.trim(),
        countryOfResidence: parsed.countryOfResidence.trim(),
        currentHomeAddress: parsed.currentHomeAddress.trim(),
        city: parsed.city.trim(),
        state: parsed.state.trim(),
        postalCode: parsed.postalCode.trim(),
        preferredContactMethod: parsed.preferredContactMethod.trim(),
        newApartmentAddress: parsed.newApartmentAddress.trim(),
        newApartmentCity: parsed.newApartmentCity.trim(),
        newApartmentState: parsed.newApartmentState.trim(),
        newApartmentPostalCode: parsed.newApartmentPostalCode.trim(),
        monthlyRentalBudget: Number(parsed.monthlyRentalBudget),
        preferredMoveInDate: new Date(parsed.preferredMoveInDate),
        intendedDurationOfStay: parsed.intendedDurationOfStay.trim(),
        numberOfOccupants: Number(parsed.numberOfOccupants),
        employmentStatus: parsed.employmentStatus.trim(),
        employerName: sanitizeNullable(parsed.employerName),
        jobTitle: sanitizeNullable(parsed.jobTitle),
        lengthOfEmployment: sanitizeNullable(parsed.lengthOfEmployment),
        monthlyIncome: parsed.monthlyIncome === "" ? null : Number(parsed.monthlyIncome),
        alternativeIncome: sanitizeNullable(parsed.alternativeIncome),
        hasPriorRentalHistory: parsed.hasPriorRentalHistory === "true",
        previousRentalAddress: sanitizeNullable(parsed.previousRentalAddress),
        previousLandlordName: sanitizeNullable(parsed.previousLandlordName),
        previousLandlordContact: sanitizeNullable(parsed.previousLandlordContact),
        previousTenancyLength: sanitizeNullable(parsed.previousTenancyLength),
        reasonForLeaving: sanitizeNullable(parsed.reasonForLeaving),
        intendedOccupants: sanitizeNullable(parsed.intendedOccupants),
        pets: sanitizeNullable(parsed.pets),
        additionalInformation: sanitizeNullable(parsed.additionalInformation),
        specialAccommodation: sanitizeNullable(parsed.specialAccommodation),
        consentToProcess: true,
        privacyNoticeAccepted: true,
        applicationStatus: "SUBMITTED",
        incomeVerificationDocumentName: req.file.originalname,
        incomeVerificationDocumentPath: `/uploads/${req.file.filename}`,
        incomeVerificationDocumentMime: req.file.mimetype,
        incomeVerificationDocumentSize: req.file.size
      }
    });

    await prisma.document.create({
      data: {
        applicationId: application.id,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: `/uploads/${req.file.filename}`
      }
    });

    await prisma.auditLog.create({
      data: {
        applicationId: application.id,
        action: "APPLICATION_SUBMITTED",
        details: `Application submitted with reference ${application.refNumber}`,
        actorName: "Tenant"
      }
    });

    res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        id: application.id,
        refNumber: application.refNumber,
        status: application.applicationStatus
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed.",
        errors: error.issues.map((issue) => ({
          field: issue.path.join(".") || "unknown",
          message: issue.message
        }))
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${error.message}` });
    }

    console.error("Application submission error:", error);
    return res.status(500).json({ message: "Failed to submit application. Please try again." });
  }
});

app.post("/api/applications/:id/payment-preference", async (req, res) => {
  const { paymentPreference } = req.body;

  if (!paymentPreference || !paymentMethodValues.includes(paymentPreference)) {
    return res.status(400).json({ message: "Please select a valid payment method." });
  }

  const appRecord = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!appRecord) return res.status(404).json({ message: "Application not found." });

  const updated = await prisma.application.update({
    where: { id: appRecord.id },
    data: {
      preferredPaymentMethod: paymentPreference,
      paymentPreferenceSelectedAt: new Date(),
      paymentPreferenceLastUpdatedAt: new Date(),
      lastUpdated: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      applicationId: updated.id,
      action: "PAYMENT_PREFERENCE_SELECTED",
      details: `Preferred payment method selected: ${updated.preferredPaymentMethod}`,
      actorName: "Tenant"
    }
  });

  res.json({ message: "Payment preference saved.", paymentPreference: updated.preferredPaymentMethod });
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: String(email).trim().toLowerCase() }
  });

  if (!admin) return res.status(401).json({ message: "Invalid credentials." });

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) return res.status(401).json({ message: "Invalid credentials." });

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: "ADMIN" }, JWT_SECRET, {
    expiresIn: "8h"
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000
  });

  res.json({
    message: "Logged in successfully.",
    user: { id: admin.id, name: admin.name, email: admin.email }
  });
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out." });
});

app.get("/api/admin/session", requireAdmin, async (req, res) => {
  const adminUser = await prisma.adminUser.findUnique({ where: { id: req.user.sub } });
  res.json({ user: { id: adminUser.id, email: adminUser.email, name: adminUser.name } });
});

app.get("/api/admin/applications", requireAdmin, async (req, res) => {
  const { search, status, paymentMethod } = req.query;

  const where = {
    ...(search
      ? {
          OR: [
            { fullName: { contains: String(search), mode: "insensitive" } },
            { email: { contains: String(search), mode: "insensitive" } },
            { refNumber: { contains: String(search), mode: "insensitive" } }
          ]
        }
      : {}),
    ...(status ? { applicationStatus: String(status) } : {}),
    ...(paymentMethod ? { preferredPaymentMethod: String(paymentMethod) } : {})
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: { submissionDate: "desc" },
    include: { documents: true }
  });

  res.json(applications);
});

app.get("/api/admin/applications/:id", requireAdmin, async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      documents: true,
      audits: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!application) return res.status(404).json({ message: "Application not found." });
  res.json(application);
});

app.patch("/api/admin/applications/:id", requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ADDITIONAL_INFORMATION_REQUESTED",
    "APPROVED",
    "REJECTED"
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid application status." });
  }

  const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Application not found." });

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      applicationStatus: status,
      notes: notes ?? existing.notes,
      lastUpdated: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      applicationId: updated.id,
      action: "APPLICATION_STATUS_CHANGED",
      details: `Status changed to ${updated.applicationStatus}`,
      actorName: req.user.email
    }
  });

  res.json(updated);
});

app.patch("/api/admin/applications/:id/payment-preference", requireAdmin, async (req, res) => {
  const { preferredPaymentMethod } = req.body;

  if (preferredPaymentMethod && !paymentMethodValues.includes(preferredPaymentMethod)) {
    return res.status(400).json({ message: "Invalid payment preference value." });
  }

  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application) return res.status(404).json({ message: "Application not found." });

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      preferredPaymentMethod: preferredPaymentMethod || null,
      paymentPreferenceLastUpdatedAt: new Date(),
      lastUpdated: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      applicationId: updated.id,
      action: "PAYMENT_PREFERENCE_UPDATED",
      details: `Payment preference updated: ${updated.preferredPaymentMethod ?? "CLEARED"}`,
      actorName: req.user.email
    }
  });

  res.json({ message: "Payment preference updated.", application: updated });
});

app.get("/api/admin/export/csv", requireAdmin, async (_req, res) => {
  const applications = await prisma.application.findMany({
    orderBy: { submissionDate: "desc" }
  });

  const rows = [
    [
      "Reference",
      "Full Name",
      "Email",
      "Contact Number",
      "New Apartment Address",
      "Monthly Rental Budget",
      "Preferred Move-In Date",
      "Status",
      "Preferred Payment Method",
      "Submission Date"
    ]
  ];

  applications.forEach((application) => {
    rows.push([
      application.refNumber,
      application.fullName,
      application.email,
      application.contactNumber,
      application.newApartmentAddress,
      application.monthlyRentalBudget,
      application.preferredMoveInDate.toISOString(),
      application.applicationStatus,
      application.preferredPaymentMethod || "",
      application.submissionDate.toISOString()
    ]);
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.header("Content-Type", "text/csv");
  res.attachment("rental-applications.csv");
  res.send(csv);
});

app.get("/api/admin/documents/:documentId", requireAdmin, async (req, res) => {
  const document = await prisma.document.findUnique({ where: { id: req.params.documentId } });
  if (!document) return res.status(404).json({ message: "Document not found." });

  const filePath = path.resolve(__dirname, "..", document.filePath.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found on disk." });

  res.download(filePath, document.originalName);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Rental app backend started on http://localhost:${PORT}`);
});
