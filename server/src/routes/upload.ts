import { Router, Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import crypto from "crypto";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../index";

const router = Router();
router.use(requireAdmin);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const REQUIRED_COLUMNS = [
  "customer_name",
  "customer_email",
  "amount_due",
  "invoice_number",
  "description_of_service",
  "business_name",
  "business_email",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CsvRow {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  amount_due?: string;
  invoice_number?: string;
  description_of_service?: string;
  business_name?: string;
  business_email?: string;
}

interface RowError {
  row: number;
  errors: string[];
}

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  let records: CsvRow[];
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    res.status(400).json({ error: "Failed to parse CSV. Ensure it is a valid CSV file." });
    return;
  }

  if (records.length === 0) {
    res.status(400).json({ error: "CSV file is empty" });
    return;
  }

  const headers = Object.keys(records[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    res.status(400).json({
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    });
    return;
  }

  const rowErrors: RowError[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const errors: string[] = [];
    const rowNum = i + 2; // +2 for header row + 0-index

    for (const col of REQUIRED_COLUMNS) {
      if (!row[col] || row[col]!.trim() === "") {
        errors.push(`${col} is required`);
      }
    }

    if (row.customer_email && !EMAIL_RE.test(row.customer_email)) {
      errors.push("customer_email is not a valid email");
    }

    if (row.business_email && !EMAIL_RE.test(row.business_email)) {
      errors.push("business_email is not a valid email");
    }

    const amount = parseFloat(row.amount_due || "");
    if (isNaN(amount) || amount <= 0) {
      errors.push("amount_due must be a positive number");
    }

    if (errors.length > 0) {
      rowErrors.push({ row: rowNum, errors });
    }
  }

  if (rowErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed",
      rowErrors,
    });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.create({
      data: {
        filename: req.file!.originalname,
        invoiceCount: records.length,
      },
    });

    const invoices = await Promise.all(
      records.map((row) =>
        tx.invoice.create({
          data: {
            token: crypto.randomUUID(),
            customerName: row.customer_name!.trim(),
            customerEmail: row.customer_email!.trim(),
            customerPhone: row.customer_phone?.trim() || null,
            amountDue: parseFloat(row.amount_due!),
            invoiceNumber: row.invoice_number!.trim(),
            descriptionOfService: row.description_of_service!.trim(),
            businessName: row.business_name!.trim(),
            businessEmail: row.business_email!.trim(),
            uploadBatchId: batch.id,
          },
        })
      )
    );

    return { batch, invoices };
  });

  res.json({
    batchId: result.batch.id,
    filename: result.batch.filename,
    invoiceCount: result.invoices.length,
    invoices: result.invoices.map((inv) => ({
      id: inv.id,
      token: inv.token,
      customerName: inv.customerName,
      invoiceNumber: inv.invoiceNumber,
      amountDue: inv.amountDue,
      status: inv.status,
    })),
  });
});

router.get("/batches", async (_req: Request, res: Response) => {
  const batches = await prisma.uploadBatch.findMany({
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });
  res.json(batches);
});

router.get("/batches/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const batch = await prisma.uploadBatch.findUnique({
    where: { id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  res.json(batch);
});

export default router;
