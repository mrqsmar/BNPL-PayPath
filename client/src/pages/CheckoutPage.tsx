import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { api, PublicInvoice } from "../lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

type PageState = "loading" | "ready" | "paid" | "not_found" | "error";

export default function CheckoutPage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    api
      .getPublicInvoice(token)
      .then((inv) => {
        setInvoice(inv);
        return api.createPaymentIntent(token);
      })
      .then(({ clientSecret }) => {
        setClientSecret(clientSecret);
        setPageState("ready");
      })
      .catch((err: unknown) => {
        const e = err as { body?: { status?: string; error?: string }; message?: string };
        if (e.body?.status === "PAID") {
          setPageState("paid");
        } else if (e.message?.includes("404") || e.body?.error?.includes("not found")) {
          setPageState("not_found");
        } else {
          setErrorMsg(e.message || "Something went wrong");
          setPageState("error");
        }
      });
  }, [token]);

  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageState === "paid") {
    return (
      <Shell>
        <div className="text-center py-8">
          <div className="text-green-500 text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Already Paid</h2>
          <p className="text-gray-500">This invoice has already been paid. Thank you!</p>
        </div>
      </Shell>
    );
  }

  if (pageState === "not_found") {
    return (
      <Shell>
        <div className="text-center py-8">
          <p className="text-gray-500">This payment link is invalid or has expired.</p>
        </div>
      </Shell>
    );
  }

  if (pageState === "error") {
    return (
      <Shell>
        <div className="text-center py-8">
          <p className="text-red-600">{errorMsg}</p>
        </div>
      </Shell>
    );
  }

  if (!invoice || !clientSecret) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Business header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.businessName}</h1>
          <p className="text-gray-500 text-sm mt-1">Secure Payment Portal</p>
        </div>

        {/* Invoice details card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Payment Request for</p>
            <p className="text-lg font-medium text-gray-900">{invoice.customerName}</p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice</span>
              <span className="font-mono font-medium text-gray-800">#{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="text-gray-800 text-right max-w-56">{invoice.descriptionOfService}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Amount Due</span>
              <span className="text-3xl font-bold text-gray-900">
                ${invoice.amountDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment form card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Payment Method</p>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#111827",
                  borderRadius: "8px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                },
              },
            }}
          >
            <PaymentForm token={token!} amountDue={invoice.amountDue} />
          </Elements>
        </div>

        <p className="text-center text-xs text-gray-400">
          Payments are processed securely via Stripe. Your card details are never stored.
        </p>
      </div>
    </div>
  );
}

function PaymentForm({ token, amountDue }: { token: string; amountDue: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/${token}/success`,
      },
    });

    // confirmPayment only returns here if there was an error
    if (error) {
      setErrorMsg(error.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "accordion",
        }}
      />

      {errorMsg && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{errorMsg}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Processing..." : `Pay $${amountDue.toFixed(2)}`}
      </button>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
        {children}
      </div>
    </div>
  );
}
