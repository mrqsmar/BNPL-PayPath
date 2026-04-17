import { useState, useRef, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, UploadResult, RowError } from "../lib/api";

interface ParsedRow {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount_due: string;
  invoice_number: string;
  description_of_service: string;
  business_name: string;
  business_email: string;
}

const SAMPLE_CSV = `customer_name,customer_email,customer_phone,amount_due,invoice_number,description_of_service,business_name,business_email
Jane Smith,jane@example.com,555-0101,1250.00,INV-001,Root Canal Treatment,Smile Dental,office@smiledental.com
Bob Johnson,bob@example.com,,890.50,INV-002,Brake Replacement,AutoFix Pro,billing@autofixpro.com`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "paypath-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLocally(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] || ""));
    return row as unknown as ParsedRow;
  });
}

type Step = "select" | "preview" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<Step>("select");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setErrorMsg("Please upload a .csv file");
      setStep("error");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsvLocally(text);
      if (rows.length === 0) {
        setErrorMsg("CSV file appears empty or has no data rows");
        setStep("error");
        return;
      }
      setPreview(rows);
      setStep("preview");
    };
    reader.readAsText(f);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  async function handleUpload() {
    if (!file) return;
    setStep("uploading");
    setRowErrors([]);
    setErrorMsg("");
    try {
      const data = await api.uploadCsv(file);
      setResult(data);
      setStep("success");
    } catch (err: unknown) {
      const e = err as { body?: { error?: string; rowErrors?: RowError[] }; message?: string };
      setErrorMsg(e.body?.error || e.message || "Upload failed");
      setRowErrors(e.body?.rowErrors || []);
      setStep("error");
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setStep("select");
    setResult(null);
    setErrorMsg("");
    setRowErrors([]);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upload CSV</h2>

      {step === "select" && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
          >
            <div className="text-gray-400 text-4xl mb-3">&#8593;</div>
            <p className="text-gray-600 font-medium">
              Drag & drop a CSV file here, or click to browse
            </p>
            <p className="text-gray-400 text-sm mt-1">Max 5MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <button onClick={downloadSample} className="text-sm text-blue-600 hover:text-blue-800 underline">
            Download sample CSV template
          </button>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-gray-500">{preview.length} invoice(s) found</p>
              </div>
              <div className="flex gap-2">
                <button onClick={reset} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 font-medium"
                >
                  Import {preview.length} Invoice(s)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Phone</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Invoice #</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Service</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">{row.customer_name}</td>
                      <td className="px-3 py-2">{row.customer_email}</td>
                      <td className="px-3 py-2 text-gray-400">{row.customer_phone || "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">${row.amount_due}</td>
                      <td className="px-3 py-2 font-mono">{row.invoice_number}</td>
                      <td className="px-3 py-2 max-w-48 truncate">{row.description_of_service}</td>
                      <td className="px-3 py-2">{row.business_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === "uploading" && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Uploading and processing...</p>
        </div>
      )}

      {step === "success" && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-800 font-medium text-lg">
              Successfully imported {result.invoiceCount} invoice(s)
            </p>
            <p className="text-green-600 text-sm mt-1">
              Batch #{result.batchId} — {result.filename}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/batches/${result.batchId}`)}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 font-medium"
            >
              View Batch
            </button>
            <button onClick={reset} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Upload Another
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">{errorMsg}</p>

            {rowErrors.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-red-700 text-sm font-medium">Row errors:</p>
                {rowErrors.map((re) => (
                  <div key={re.row} className="text-sm text-red-600 bg-red-100 rounded px-3 py-2">
                    <span className="font-medium">Row {re.row}:</span>{" "}
                    {re.errors.join("; ")}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={reset} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
