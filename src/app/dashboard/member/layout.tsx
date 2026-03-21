"use client";

import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if there is no authenticated user or the role does not match.
  useEffect(() => {
    if (!loading) {
      if (!user || user.role?.toUpperCase() !== "MEMBER") {
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  // While loading or if no user is loaded, render nothing or a placeholder.
  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="member" />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
