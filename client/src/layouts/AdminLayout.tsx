import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/invoices", label: "Invoices" },
  { to: "/admin/upload", label: "Upload CSV" },
];

export default function AdminLayout() {
  const { isAdmin, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">PayPath</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded text-sm ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
