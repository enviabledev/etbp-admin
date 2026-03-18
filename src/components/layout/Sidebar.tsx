"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Route, MapPin, Calendar, Bus, Truck, Users,
  Ticket, Tag, BarChart3, ChevronLeft, ChevronRight, LogOut, UserCircle,
  Settings, Menu, X, Shield, UserCheck, Bell, Star, Wrench,
} from "lucide-react";
import { useState } from "react";
import { useLogout, useUser } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavItem = { href: string; label: string; icon: any };
type NavSection = { label?: string; items: NavItem[]; roles?: UserRole[] };

const navSections: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { href: "/terminals", label: "Terminals", icon: MapPin },
      { href: "/routes", label: "Routes", icon: Route },
      { href: "/schedules", label: "Schedules", icon: Calendar },
      { href: "/trips", label: "Trips", icon: Bus },
    ],
  },
  {
    label: "Fleet",
    roles: ["fleet_manager", "admin", "super_admin"],
    items: [
      { href: "/fleet", label: "Vehicles", icon: Truck },
      { href: "/drivers", label: "Drivers", icon: UserCircle },
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    label: "Business",
    roles: ["admin", "super_admin"],
    items: [
      { href: "/bookings", label: "Bookings", icon: Ticket },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/reviews", label: "Reviews", icon: Star },
      { href: "/promos", label: "Promos", icon: Tag },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    roles: ["admin", "super_admin"],
    items: [
      { href: "/agents", label: "Agents", icon: UserCheck },
      { href: "/admin-users", label: "Admin Users", icon: Shield },
    ],
  },
  {
    label: "Communications",
    roles: ["admin", "super_admin"],
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    roles: ["super_admin"],
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const userRole = user?.role as UserRole | undefined;

  const visibleSections = navSections.filter((s) => {
    if (!s.roles) return true;
    if (!userRole) return false;
    return s.roles.includes(userRole);
  });

  const nav = (
    <>
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        {!collapsed && <span className="text-lg font-bold tracking-tight"><span className="text-primary-400">ETBP</span> Admin</span>}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden lg:block", collapsed ? "mx-auto" : "ml-auto")}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 lg:hidden ml-auto"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleSections.map((section, si) => (
          <div key={si} className="mb-1">
            {section.label && !collapsed && <p className="px-5 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{section.label}</p>}
            {collapsed && section.label && <div className="mx-3 my-1 border-t border-white/10" />}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined}
                      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive ? "bg-primary-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white")}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button onClick={() => logoutMutation.mutate()} title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut className="h-5 w-5 shrink-0" />{!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-sidebar text-white lg:hidden shadow-lg">
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed left-0 top-0 h-screen bg-sidebar text-white flex-col transition-all duration-300 z-40 hidden lg:flex", collapsed ? "lg:w-16" : "lg:w-64")}>
        {nav}
      </aside>
      <aside className={cn("fixed left-0 top-0 h-screen bg-sidebar text-white flex flex-col z-50 w-64 transition-transform duration-300 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        {nav}
      </aside>
    </>
  );
}
