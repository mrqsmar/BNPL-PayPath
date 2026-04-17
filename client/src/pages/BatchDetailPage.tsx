import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, UploadBatch, Invoice } from "../lib/api";

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

  useEffect(() => {
    if (!id) return;
    api
      .getBatch(parseInt(id))
      .then(setBatch)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!batch) {
    return <p className="text-red-600">Batch not found.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/batches" className="text-gray-400 hover:text-gray-600">
          &larr; Batches
        </Link>
        <h2 className="text-2xl font-bold">
          Batch #{batch.id}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Link</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {batch.invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">{inv.customerName}</td>
                <td className="px-4 py-3 text-gray-500">{inv.customerEmail}</td>
                <td className="px-4 py-3 text-right font-mono">
                  ${Number(inv.amountDue).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColor[inv.status] || ""
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    /pay/{inv.token}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
