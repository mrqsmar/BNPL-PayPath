import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { prisma } from "../index";

interface InvoiceForMessage {
  id: number;
  token: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  amountDue: number | { toNumber(): number };
  invoiceNumber: string;
  descriptionOfService: string;
  businessName: string;
  businessEmail: string;
}

function formatCurrency(amount: number | { toNumber(): number }): string {
  const num = typeof amount === "number" ? amount : amount.toNumber();
  return `$${num.toFixed(2)}`;
}

function paymentLink(token: string): string {
  const base = (process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/pay/${token}`;
}

function buildEmailHtml(invoice: InvoiceForMessage): string {
  const link = paymentLink(invoice.token);
  const amount = formatCurrency(invoice.amountDue);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#111827;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px">PayPath</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.5">
        Hi ${invoice.customerName},
      </p>
      <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.5">
        <strong>${invoice.businessName}</strong> has a payment option available for your recent invoice.
        You can now pay securely online with flexible payment options, including the ability to pay over time.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
          <tr><td style="padding:6px 0;color:#6b7280">Invoice #</td><td style="padding:6px 0;text-align:right;font-weight:600">${invoice.invoiceNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Service</td><td style="padding:6px 0;text-align:right">${invoice.descriptionOfService}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Amount Due</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:18px;color:#111827">${amount}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:0 0 24px">
        <a href="${link}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600">
          Pay Now
        </a>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center">
        Flexible payment options available including pay-over-time plans.
        <br>This is a secure payment link from ${invoice.businessName}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildSmsBody(invoice: InvoiceForMessage): string {
  const link = paymentLink(invoice.token);
  const amount = formatCurrency(invoice.amountDue);
  return `${invoice.businessName}: Hi ${invoice.customerName}, you have an outstanding balance of ${amount} (Invoice #${invoice.invoiceNumber}). Pay securely with flexible options: ${link}`;
}

export async function sendEmail(
  invoice: InvoiceForMessage
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    const msg = "SendGrid not configured (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL)";
    await prisma.messageLog.create({
      data: { invoiceId: invoice.id, channel: "EMAIL", status: "FAILED" },
    });
    return { success: false, error: msg };
  }

  sgMail.setApiKey(apiKey);

  try {
    const [response] = await sgMail.send({
      to: invoice.customerEmail,
      from: fromEmail,
      subject: `A payment option is available for your ${invoice.businessName} invoice`,
      html: buildEmailHtml(invoice),
    });

    const messageId = response?.headers?.["x-message-id"] as string | undefined;

    await prisma.messageLog.create({
      data: {
        invoiceId: invoice.id,
        channel: "EMAIL",
        status: "SENT",
        providerMessageId: messageId || null,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Email send failed";
    await prisma.messageLog.create({
      data: { invoiceId: invoice.id, channel: "EMAIL", status: "FAILED" },
    });
    return { success: false, error };
  }
}

export async function sendSMS(
  invoice: InvoiceForMessage
): Promise<{ success: boolean; error?: string }> {
  if (!invoice.customerPhone) {
    return { success: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    const msg = "Twilio not configured (missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER)";
    await prisma.messageLog.create({
      data: { invoiceId: invoice.id, channel: "SMS", status: "FAILED" },
    });
    return { success: false, error: msg };
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      to: invoice.customerPhone,
      from: fromNumber,
      body: buildSmsBody(invoice),
    });

    await prisma.messageLog.create({
      data: {
        invoiceId: invoice.id,
        channel: "SMS",
        status: "SENT",
        providerMessageId: message.sid,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "SMS send failed";
    await prisma.messageLog.create({
      data: { invoiceId: invoice.id, channel: "SMS", status: "FAILED" },
    });
    return { success: false, error };
  }
}

export function getEmailPreview(invoice: InvoiceForMessage) {
  return {
    subject: `A payment option is available for your ${invoice.businessName} invoice`,
    html: buildEmailHtml(invoice),
    sms: invoice.customerPhone ? buildSmsBody(invoice) : null,
  };
}
