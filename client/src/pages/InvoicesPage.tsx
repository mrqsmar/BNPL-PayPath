import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  amountDue: string;
  status: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    api.getInvoices().then((data) => setInvoices(data as Invoice[]));
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Invoices</h2>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No invoices yet. Upload a CSV to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div>{inv.customerName}</div>
                    <div className="text-gray-400 text-xs">{inv.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">{inv.businessName}</td>
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
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
