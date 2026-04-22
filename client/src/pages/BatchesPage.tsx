import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, UploadBatch } from "../lib/api";

export default function BatchesPage() {
  const [batches, setBatches] = useState<UploadBatch[]>([]);

  useEffect(() => {
    api.getBatches().then(setBatches);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upload Batches</h2>

      {batches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No batches yet.{" "}
          <Link to="/admin/upload" className="text-blue-600 hover:underline">
            Upload a CSV
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Filename</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Invoices</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">#{b.id}</td>
                  <td className="px-4 py-3">{b.filename}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{b.invoiceCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/batches/${b.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Invoices
                    </Link>
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
