"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, Menu, X, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Kerangka layout role dengan sidebar responsive.
// - Desktop (lg+): sidebar tetap, bisa di-collapse (w-64 <-> w-20).
// - Mobile (<lg): sidebar off-canvas (tersembunyi), dibuka via hamburger di top bar.
export default function DashboardShell({
  children,
  navItems,
  brandHref = "/dashboard",
  brandIcon: BrandIcon = Activity,
  brandTitle = "PhysioV",
  roleLabel = "",
  profileNamePrefix = "",
  avatarFallback = "U",
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tutup sidebar mobile otomatis saat pindah halaman.
  useEffect(() => {
    const closeTimer = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(closeTimer);
  }, [pathname]);

  const handleLogout = async () => {
    const { logoutUser } = await import("@/lib/authService");
    await logoutUser();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#EFEBE4]">
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#152238]/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-[#E3DDD2] transition-all duration-300 z-40 flex flex-col ${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo, Toggle & Close */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#E3DDD2]">
          {!sidebarCollapsed && (
            <Link href={brandHref} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#152238] flex items-center justify-center">
                <BrandIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-black text-xl text-[#152238]">{brandTitle}</span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <div className="lg:hidden">
              {!sidebarCollapsed && (
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors"
                  aria-label="Tutup sidebar"
                >
                  <X className="w-5 h-5 text-[#152238]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex flex-shrink-0 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors"
              aria-label={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5 text-[#152238]" /> : <ChevronLeft className="w-5 h-5 text-[#152238]" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#152238] text-white shadow-md"
                        : "text-[#526071] hover:bg-[#FAF7F2] hover:text-[#152238]"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-[#E3DDD2]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-[#FAF7F2]">
              <div className="w-10 h-10 rounded-xl bg-[#E8E2D8] text-[#152238] font-black text-sm flex items-center justify-center border border-[#DDD5C7]">
                {profile?.name?.split(" ").map((n) => n[0]).join("") || avatarFallback}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-[#152238]">
                  {profileNamePrefix}
                  {profile?.name}
                </p>
                <p className="text-xs text-[#7A889B] truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#7A889B] hover:bg-[#FAF7F2] hover:text-[#152238] transition-all ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Keluar" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top bar mobile dengan hamburger */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b border-[#E3DDD2]">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex-shrink-0 -ml-2 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors"
            aria-label="Buka sidebar"
          >
            <Menu className="w-6 h-6 text-[#152238]" />
          </button>
          <Link href={brandHref} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#152238] flex items-center justify-center">
              <BrandIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-black text-lg text-[#152238]">{brandTitle}</span>
          </Link>
          <div className="w-9" />
        </div>

        {children}
      </main>
    </div>
  );
}