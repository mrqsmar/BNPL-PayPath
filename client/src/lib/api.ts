const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
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
    return request<unknown[]>("/admin/invoices");
  },

  getBatches() {
    return request<unknown[]>("/admin/batches");
  },
};
