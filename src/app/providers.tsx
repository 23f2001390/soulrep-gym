"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
