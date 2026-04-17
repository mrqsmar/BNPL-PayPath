import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api, UploadBatch, Invoice, SendBatchResult, MessagePreview } from "../lib/api";

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<(UploadBatch & { invoices: Invoice[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendBatchResult | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<(MessagePreview & { invoiceName: string }) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadBatch = useCallback(() => {
    if (!id) return Promise.resolve();
    return api.getBatch(parseInt(id)).then(setBatch);
  }, [id]);

  useEffect(() => {
    loadBatch().finally(() => setLoading(false));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadBatch]);

  async function handleSendAll() {
    if (!batch) return;
    setSending(true);
    setSendResult(null);

    pollRef.current = setInterval(() => loadBatch(), 2000);

    try {
      const result = await api.sendBatchMessages(batch.id);
      setSendResult(result);
      await loadBatch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Send failed";
      setSendResult({ sent: 0, failed: 0, errors: [{ invoiceId: 0, invoiceNumber: "", error: msg }] });
    } finally {
      setSending(false);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }

  async function handleResend(invoiceId: number) {
    setResendingId(invoiceId);
    try {
      await api.resendInvoice(invoiceId);
      await loadBatch();
    } finally {
      setResendingId(null);
    }
  }

  async function handlePreview(invoice: Invoice) {
    const data = await api.getMessagePreview(invoice.id);
    setPreview({ ...data, invoiceName: invoice.customerName });
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!batch) return <p className="text-red-600">Batch not found.</p>;

  const pendingCount = batch.invoices.filter((i) => i.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/batches" className="text-gray-400 hover:text-gray-600">
          &larr; Batches
        </Link>
        <h2 className="text-2xl font-bold">Batch #{batch.id}</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-gray-500">File:</span>{" "}
              <span className="font-medium">{batch.filename}</span>
            </div>
            <div>
              <span className="text-gray-500">Uploaded:</span>{" "}
              {new Date(batch.uploadedAt).toLocaleString()}
            </div>
            <div>
              <span className="text-gray-500">Invoices:</span>{" "}
              <span className="font-mono">{batch.invoiceCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Pending:</span>{" "}
              <span className="font-mono">{pendingCount}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {batch.invoices.length > 0 && (
              <button
                onClick={() => handlePreview(batch.invoices[0])}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Preview Messages
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={handleSendAll}
                disabled={sending}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 font-medium disabled:opacity-50"
              >
                {sending ? "Sending..." : `Send All Messages (${pendingCount})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {sending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-800 text-sm">Sending messages... This may take a moment.</p>
        </div>
      )}

      {sendResult && (
        <div
          className={`rounded-lg p-4 mb-4 border ${
            sendResult.failed > 0
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <p className={`font-medium ${sendResult.failed > 0 ? "text-yellow-800" : "text-green-800"}`}>
            {sendResult.sent} sent, {sendResult.failed} failed
            {sendResult.message && ` — ${sendResult.message}`}
          </p>
          {sendResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {sendResult.errors.map((e, i) => (
                <p key={i} className="text-sm text-red-600">
                  {e.invoiceNumber ? `Invoice ${e.invoiceNumber}: ` : ""}{e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Messages</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {batch.invoices.map((inv) => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                resending={resendingId === inv.id}
                onResend={() => handleResend(inv.id)}
                onPreview={() => handlePreview(inv)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <PreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  resending,
  onResend,
  onPreview,
}: {
  invoice: Invoice;
  resending: boolean;
  onResend: () => void;
  onPreview: () => void;
}) {
  const [messages, setMessages] = useState<{ channel: string; status: string }[] | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  async function toggleMessages() {
    if (showMessages) {
      setShowMessages(false);
      return;
    }
    const data = await api.getInvoiceMessages(invoice.id);
    setMessages(data);
    setShowMessages(true);
  }

  const canResend = invoice.status === "SENT" || invoice.status === "FAILED" || invoice.status === "PENDING";

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 font-mono">{invoice.invoiceNumber}</td>
        <td className="px-4 py-3">{invoice.customerName}</td>
        <td className="px-4 py-3 text-gray-500">{invoice.customerEmail}</td>
        <td className="px-4 py-3 text-right font-mono">
          ${Number(invoice.amountDue).toFixed(2)}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[invoice.status] || ""}`}>
            {invoice.status}
          </span>
        </td>
        <td className="px-4 py-3">
          {invoice.status !== "PENDING" && (
            <button onClick={toggleMessages} className="text-blue-600 hover:underline text-xs">
              {showMessages ? "Hide" : "View Log"}
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={onPreview} className="text-gray-500 hover:text-gray-700 text-xs">
              Preview
            </button>
            {canResend && (
              <button
                onClick={onResend}
                disabled={resending}
                className="text-blue-600 hover:underline text-xs disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            )}
          </div>
        </td>
      </tr>
      {showMessages && messages && (
        <tr>
          <td colSpan={7} className="px-4 py-2 bg-gray-50">
            <div className="space-y-1">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-400">No messages sent yet.</p>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="font-medium w-12">{m.channel}</span>
                    <span className={m.status === "SENT" || m.status === "DELIVERED" ? "text-green-600" : "text-red-600"}>
                      {m.status === "SENT" || m.status === "DELIVERED" ? "\u2713" : "\u2717"} {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PreviewModal({
  preview,
  onClose,
}: {
  preview: { subject: string; html: string; sms: string | null; invoiceName: string };
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"email" | "sms">("email");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Message Preview — {preview.invoiceName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="flex gap-2 px-4 pt-4">
          <button
            onClick={() => setTab("email")}
            className={`px-3 py-1 text-sm rounded ${
              tab === "email" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Email
          </button>
          {preview.sms && (
            <button
              onClick={() => setTab("sms")}
              className={`px-3 py-1 text-sm rounded ${
                tab === "sms" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              SMS
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {tab === "email" && (
            <div>
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Subject:</span>{" "}
                <span className="font-medium">{preview.subject}</span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={preview.html}
                  title="Email preview"
                  className="w-full h-[500px] border-0"
                  sandbox=""
                />
              </div>
            </div>
          )}
          {tab === "sms" && preview.sms && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                SMS ({preview.sms.length} chars{preview.sms.length > 160 ? " — will be split into multiple messages" : ""})
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm max-w-xs">
                {preview.sms}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
