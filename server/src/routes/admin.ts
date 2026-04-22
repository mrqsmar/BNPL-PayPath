import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../index";

const router = Router();

router.use(requireAdmin);

router.get("/stats", async (_req: Request, res: Response) => {
  const [invoices, messages, batches] = await Promise.all([
    prisma.invoice.findMany({ select: { status: true, amountDue: true } }),
    prisma.messageLog.groupBy({ by: ["status"], _count: true }),
    prisma.uploadBatch.count(),
  ]);

  const counts = { PENDING: 0, SENT: 0, PAID: 0, FAILED: 0 };
  let totalDue = 0;
  let totalCollected = 0;

  for (const inv of invoices) {
    counts[inv.status]++;
    const amt = Number(inv.amountDue);
    totalDue += amt;
    if (inv.status === "PAID") totalCollected += amt;
  }

  const messageCounts: Record<string, number> = {};
  for (const m of messages) {
    messageCounts[m.status] = m._count;
  }

  res.json({
    invoices: {
      total: invoices.length,
      ...counts,
    },
    revenue: {
      totalDue,
      totalCollected,
      collectionRate: invoices.length > 0 ? (counts.PAID / invoices.length) * 100 : 0,
    },
    messages: messageCounts,
    batches,
  });
});

router.get("/invoices", async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;

  const where = status && ["PENDING", "SENT", "PAID", "FAILED"].includes(status)
    ? { status: status as "PENDING" | "SENT" | "PAID" | "FAILED" }
    : {};

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { uploadBatch: true },
  });
  res.json(invoices);
});

router.get("/export/csv", async (_req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadBatch: true },
  });

  const header = [
    "invoice_number",
    "customer_name",
    "customer_email",
    "customer_phone",
    "business_name",
    "business_email",
    "description_of_service",
    "amount_due",
    "status",
    "batch_file",
    "created_at",
  ].join(",");

  const rows = invoices.map((inv) => {
    const fields = [
      inv.invoiceNumber,
      inv.customerName,
      inv.customerEmail,
      inv.customerPhone || "",
      inv.businessName,
      inv.businessEmail,
      `"${inv.descriptionOfService.replace(/"/g, '""')}"`,
      Number(inv.amountDue).toFixed(2),
      inv.status,
      inv.uploadBatch?.filename || "",
      inv.createdAt.toISOString(),
    ];
    return fields.join(",");
  });

  const csv = [header, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="paypath-export-${Date.now()}.csv"`);
  res.send(csv);
});

router.get("/invoices/:id", async (req: Request<{ id: string }>, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id as string) },
    include: { messages: true, uploadBatch: true },
  });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(invoice);
});

router.get("/invoices/:id/stripe", async (req: Request<{ id: string }>, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id as string) },
  });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (!invoice.stripePaymentIntentId) {
    res.json({ paymentIntentId: null, status: null });
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = new Stripe(stripeKey);
  const pi = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);

  res.json({
    paymentIntentId: pi.id,
    status: pi.status,
    amount: pi.amount,
    currency: pi.currency,
    created: pi.created,
  });
});

export default router;
