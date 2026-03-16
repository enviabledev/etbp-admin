"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Card, { CardBody } from "@/components/ui/Card";
import { ScrollText, HelpCircle, DollarSign } from "lucide-react";

const sections = [
  { href: "/settings/audit-logs", label: "Audit Logs", description: "Track all admin actions and changes", icon: ScrollText },
  { href: "/settings/support-tickets", label: "Support Tickets", description: "Manage customer support tickets", icon: HelpCircle },
  { href: "/settings/pricing-rules", label: "Pricing Rules", description: "Configure dynamic pricing", icon: DollarSign },
];

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="System configuration and management" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardBody className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.label}</h3>
                  <p className="mt-1 text-sm text-gray-500">{s.description}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
