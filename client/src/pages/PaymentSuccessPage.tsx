import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, PublicInvoice } from "../lib/api";

export default function PaymentSuccessPage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);

  useEffect(() => {
    if (!token) return;
    // Fetch invoice — it may return 410 if already PAID which is fine; we handle the body
    fetch(`/api/invoice/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setInvoice(data as PublicInvoice);
      })
      .catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</h1>

        {invoice ? (
          <>
            <p className="text-gray-500 mb-6">
              Thank you, <strong>{invoice.customerName}</strong>. Your payment to{" "}
              <strong>{invoice.businessName}</strong> has been processed successfully.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="font-mono font-medium">#{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-gray-900">${invoice.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              A confirmation may be sent to your email. Contact{" "}
              <strong>{invoice.businessName}</strong> with any questions.
            </p>
          </>
        ) : (
          <p className="text-gray-500">
            Your payment has been processed successfully. Thank you!
          </p>
        )}
      </div>
    </div>
  );
}
