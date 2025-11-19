

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, ListTodo,
  X,
  LayoutDashboard,
  Calendar,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function SideBar() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubmenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const handleLogout = (): void => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    router.push("/auth/login");
  };

  const handleBackToBooking = (): void => {
    router.push("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: ListTodo, label: "Booking Setup", href: "/admin/booking-setup" },
    {
      icon: Calendar,
      label: "Appointments",
      submenu: [
        { label: "All Appointments", href: "#" },
        { label: "Pending", href: "#" },
        { label: "Confirmed", href: "#" },
        { label: "Cancelled", href: "#" },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <span className="font-bold text-lg">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden hover:bg-gray-700 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = !!item.submenu?.length;
            const isExpanded = expandedMenu === item.label;

            return (
              <div key={item.label}>
                {!hasSubmenu && item.href ? (
                  <Link
                    href={item.href}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition group"
                  >
                    <Icon size={20} className="group-hover:text-blue-400 transition" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-700 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="group-hover:text-blue-400 transition" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}

                {hasSubmenu && isExpanded && (
                  <div className="pl-4 mt-2 space-y-1">
                    {item.submenu!.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={handleBackToBooking}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition text-sm"
          >
            Back to Booking
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

              {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 hover:bg-gray-200 rounded-lg transition bg-white shadow-md"
      >
        <Menu size={24} className="text-gray-800" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      </aside>
    </>
  );
}

