"use client";

import { useUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.push("/login");
    }
  }, [isLoading, isError, user, router]);

  useEffect(() => {
    if (user && !["admin", "super_admin"].includes(user.role)) {
      router.push("/login");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
