const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Request failed: ${res.status}`), { body });
  }

  return res.json();
}

export interface Invoice {
  id: number;
  token: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  businessName: string;
  businessEmail: string;
  amountDue: string;
  descriptionOfService: string;
  status: "PENDING" | "SENT" | "PAID" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface UploadBatch {
  id: number;
  filename: string;
  uploadedAt: string;
  invoiceCount: number;
  _count?: { invoices: number };
  invoices?: Invoice[];
}

export interface RowError {
  row: number;
  errors: string[];
}

export interface UploadResult {
  batchId: number;
  filename: string;
  invoiceCount: number;
  invoices: Pick<Invoice, "id" | "token" | "customerName" | "invoiceNumber" | "amountDue" | "status">[];
}

export interface UploadError {
  error: string;
  rowErrors?: RowError[];
}

export interface MessageLog {
  id: number;
  invoiceId: number;
  channel: "EMAIL" | "SMS";
  status: "SENT" | "FAILED" | "DELIVERED";
  sentAt: string;
  providerMessageId: string | null;
}

export interface SendBatchResult {
  sent: number;
  failed: number;
  errors: { invoiceId: number; invoiceNumber: string; error: string }[];
  message?: string;
}

export interface ResendResult {
  success: boolean;
  email: { success: boolean; error?: string };
  sms: { success: boolean; error?: string };
  status: string;
}

export interface MessagePreview {
  subject: string;
  html: string;
  sms: string | null;
}

export const api = {
  login(username: string, password: string) {
    return request<{ success: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request<{ success: boolean }>("/auth/logout", { method: "POST" });
  },

  me() {
    return request<{ isAdmin: boolean }>("/auth/me");
  },

  getInvoices() {
    return request<Invoice[]>("/admin/invoices");
  },

  getBatches() {
    return request<UploadBatch[]>("/admin/batches");
  },

  getBatch(id: number) {
    return request<UploadBatch & { invoices: Invoice[] }>(`/admin/batches/${id}`);
  },

  sendBatchMessages(batchId: number) {
    return request<SendBatchResult>(`/admin/batches/${batchId}/send`, {
      method: "POST",
    });
  },

  resendInvoice(invoiceId: number) {
    return request<ResendResult>(`/admin/invoices/${invoiceId}/resend`, {
      method: "POST",
    });
  },

  getInvoiceMessages(invoiceId: number) {
    return request<MessageLog[]>(`/admin/invoices/${invoiceId}/messages`);
  },

  getMessagePreview(invoiceId: number) {
    return request<MessagePreview>(`/admin/invoices/${invoiceId}/preview`);
  },

  async uploadCsv(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const body: UploadError = await res.json().catch(() => ({ error: "Upload failed" }));
      throw Object.assign(new Error(body.error), { body });
    }

    return res.json();
  },
};
