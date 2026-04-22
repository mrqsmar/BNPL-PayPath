import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, DashboardStats, UploadBatch } from "../lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<UploadBatch[]>([]);

  useEffect(() => {
    api.getStats().then(setStats);
    api.getBatches().then((b) => setBatches(b.slice(0, 5)));
  }, []);

  if (!stats) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <a
          href={api.exportCsvUrl()}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Due</p>
          <p className="text-3xl font-bold mt-1">{fmt(stats.revenue.totalDue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{fmt(stats.revenue.totalCollected)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Collection Rate</p>
          <p className="text-3xl font-bold mt-1">
            {stats.revenue.collectionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Invoice status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatusCard label="Pending" count={stats.invoices.PENDING} color="yellow" />
        <StatusCard label="Sent" count={stats.invoices.SENT} color="blue" />
        <StatusCard label="Paid" count={stats.invoices.PAID} color="green" />
        <StatusCard label="Failed" count={stats.invoices.FAILED} color="red" />
      </div>

      {/* Message delivery + recent batches side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Message Delivery</h3>
          <div className="space-y-3">
            <MessageStat label="Sent" count={stats.messages["SENT"] || 0} color="text-blue-600" />
            <MessageStat label="Delivered" count={stats.messages["DELIVERED"] || 0} color="text-green-600" />
            <MessageStat label="Failed" count={stats.messages["FAILED"] || 0} color="text-red-600" />
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            {stats.batches} upload batch{stats.batches !== 1 ? "es" : ""} total
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Uploads</h3>
            <Link to="/admin/batches" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {batches.length === 0 ? (
            <p className="text-sm text-gray-400">No uploads yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.map((b) => (
                <Link
                  key={b.id}
                  to={`/admin/batches/${b.id}`}
                  className="flex items-center justify-between text-sm hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{b.filename}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(b.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono text-gray-500">{b.invoiceCount} invoices</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  const bg: Record<string, string> = {
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
  };
  const text: Record<string, string> = {
    yellow: "text-yellow-800",
    blue: "text-blue-800",
    green: "text-green-800",
    red: "text-red-800",
  };

  return (
    <div className={`rounded-lg border p-4 ${bg[color]}`}>
      <p className={`text-xs font-medium ${text[color]}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${text[color]}`}>{count}</p>
    </div>
  );
}

function MessageStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{count}</span>
    </div>
  );
}
