import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../index";

const router = Router();

router.post("/stripe", async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  // req.body is a Buffer because this route uses express.raw()
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook signature verification failed:", msg);
    res.status(400).json({ error: msg });
    return;
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as {
        metadata?: { invoice_token?: string };
        last_payment_error?: { message?: string };
      };
      const token = pi.metadata?.invoice_token;

      if (token) {
        await prisma.invoice.updateMany({
          where: { token },
          data: { status: "PAID" },
        });
        console.log(`Invoice ${token} marked as PAID`);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as {
        metadata?: { invoice_token?: string };
        last_payment_error?: { message?: string };
      };
      const token = pi.metadata?.invoice_token;
      const reason = pi.last_payment_error?.message || "Unknown failure";
      console.error(`Payment failed for invoice ${token}: ${reason}`);
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
  }

  // Always return 200 quickly
  res.json({ received: true });
});

export default router;
