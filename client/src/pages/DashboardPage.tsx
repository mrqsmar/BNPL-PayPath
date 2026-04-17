import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DashboardPage() {
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);

  useEffect(() => {
    api.getInvoices().then((data) => setInvoiceCount(data.length));
    api.getBatches().then((data) => setBatchCount(data.length));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-3xl font-bold mt-1">{invoiceCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Upload Batches</p>
          <p className="text-3xl font-bold mt-1">{batchCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-medium mt-1 text-green-600">System Online</p>
        </div>
      </div>
    </div>
  );
}
