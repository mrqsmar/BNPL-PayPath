import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../index";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

// GET /api/invoice/:token — public, no auth
router.get("/:token", async (req: Request<{ token: string }>, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { token: req.params.token },
  });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status === "PAID") {
    res.status(410).json({ error: "This invoice has already been paid", status: "PAID" });
    return;
  }

  res.json({
    customerName: invoice.customerName,
    businessName: invoice.businessName,
    invoiceNumber: invoice.invoiceNumber,
    descriptionOfService: invoice.descriptionOfService,
    amountDue: Number(invoice.amountDue),
    status: invoice.status,
  });
});

// POST /api/invoice/:token/payment-intent — public, no auth
router.post("/:token/payment-intent", async (req: Request<{ token: string }>, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { token: req.params.token },
  });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (invoice.status === "PAID") {
    res.status(410).json({ error: "This invoice has already been paid" });
    return;
  }

  const stripe = getStripe();

  // Idempotency: reuse existing PaymentIntent if still usable
  if (invoice.stripePaymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);
      if (existing.status !== "succeeded" && existing.status !== "canceled") {
        res.json({ clientSecret: existing.client_secret });
        return;
      }
    } catch {
      // Fall through to create a new one if retrieval fails
    }
  }

  const amountCents = Math.round(Number(invoice.amountDue) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    payment_method_types: ["card", "affirm", "klarna", "link"],
    metadata: {
      customer_name: invoice.customerName,
      invoice_number: invoice.invoiceNumber,
      business_name: invoice.businessName,
      business_email: invoice.businessEmail,
      invoice_token: invoice.token,
    },
    description: `Invoice #${invoice.invoiceNumber} — ${invoice.descriptionOfService}`,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

export default router;
