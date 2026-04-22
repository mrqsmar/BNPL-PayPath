import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import UploadPage from "./pages/UploadPage";
import BatchesPage from "./pages/BatchesPage";
import BatchDetailPage from "./pages/BatchDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public payment pages — no nav/layout wrapper */}
        <Route path="/pay/:token" element={<CheckoutPage />} />
        <Route path="/pay/:token/success" element={<PaymentSuccessPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/admin/login" element={<LoginPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="batches/:id" element={<BatchDetailPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
