"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Route, MapPin, Calendar, Bus, Truck, Users,
  Ticket, Tag, BarChart3, ChevronLeft, ChevronRight, LogOut, UserCircle,
} from "lucide-react";
import { useState } from "react";
import { useLogout, useUser } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/terminals", label: "Terminals", icon: MapPin },
  { href: "/schedules", label: "Schedules", icon: Calendar },
  { href: "/trips", label: "Trips", icon: Bus },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: UserCircle },
  { href: "/bookings", label: "Bookings", icon: Ticket },
  { href: "/users", label: "Users", icon: Users },
  { href: "/promos", label: "Promos", icon: Tag },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-white flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            <span className="text-primary-400">ETBP</span> Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors", collapsed ? "mx-auto" : "ml-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
