import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../index";

const router = Router();

router.use(requireAdmin);

router.get("/invoices", async (_req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadBatch: true },
  });
  res.json(invoices);
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
