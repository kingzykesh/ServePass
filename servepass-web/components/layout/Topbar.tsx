"use client";

import { Menu, LogOut } from "lucide-react";
import { logout, getUser } from "@/lib/auth";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = getUser() as { name?: string; role?: string } | null;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-2xl border border-gray-200 p-2 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-base font-bold text-gray-950 sm:text-xl">
            Welcome back
          </h2>
          <p className="text-xs text-gray-500 sm:text-sm">
            {user?.name ?? "Admin"} • {user?.role ?? "ADMIN"}
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}