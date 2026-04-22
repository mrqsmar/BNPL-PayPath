import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../index";
import { sendEmail, sendSMS, getEmailPreview } from "../services/messaging";

const router = Router();
router.use(requireAdmin);

router.post("/batches/:id/send", async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.id as string);

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    include: {
      invoices: { where: { status: "PENDING" } },
    },
  });

  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  if (batch.invoices.length === 0) {
    res.json({ sent: 0, failed: 0, errors: [], message: "No pending invoices to send" });
    return;
  }

  let sent = 0;
  let failed = 0;
  const errors: { invoiceId: number; invoiceNumber: string; error: string }[] = [];

  for (const invoice of batch.invoices) {
    const inv = {
      ...invoice,
      amountDue: Number(invoice.amountDue),
    };

    const emailResult = await sendEmail(inv);
    const smsResult = await sendSMS(inv);

    const emailOk = emailResult.success;
    const smsOk = smsResult.success;

    if (emailOk && smsOk) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
      sent++;
    } else {
      const errParts: string[] = [];
      if (!emailOk) errParts.push(`Email: ${emailResult.error}`);
      if (!smsOk) errParts.push(`SMS: ${smsResult.error}`);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "FAILED" },
      });
      failed++;
      errors.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        error: errParts.join("; "),
      });
    }
  }

  res.json({ sent, failed, errors });
});

router.post("/invoices/:id/resend", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status !== "PENDING" && invoice.status !== "SENT" && invoice.status !== "FAILED") {
    res.status(400).json({ error: `Cannot resend invoice with status ${invoice.status}` });
    return;
  }

  const inv = { ...invoice, amountDue: Number(invoice.amountDue) };

  const emailResult = await sendEmail(inv);
  const smsResult = await sendSMS(inv);

  const newStatus = emailResult.success && smsResult.success ? "SENT" : "FAILED";

  await prisma.invoice.update({
    where: { id },
    data: { status: newStatus },
  });

  res.json({
    success: emailResult.success && smsResult.success,
    email: emailResult,
    sms: smsResult,
    status: newStatus,
  });
});

router.get("/invoices/:id/messages", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const messages = await prisma.messageLog.findMany({
    where: { invoiceId: id },
    orderBy: { sentAt: "desc" },
  });

  res.json(messages);
});

router.get("/invoices/:id/preview", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const preview = getEmailPreview({ ...invoice, amountDue: Number(invoice.amountDue) });
  res.json(preview);
});

export default router;
