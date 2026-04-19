"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIGS } from "@/lib/plans";
import { useAuth } from "@/lib/auth-context";

export default function CompleteSignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.MONTHLY);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const currentRole = user.role?.toUpperCase();
    if (currentRole && currentRole !== "MEMBER") {
      router.push(`/dashboard/${currentRole.toLowerCase()}`);
      return;
    }

    fetch("/api/member/signup-payment", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load signup state");
        if (!data.needsSetup) {
          router.push("/dashboard/member");
          return;
        }
        if (data.memberPlan && Object.values(PlanType).includes(data.memberPlan as PlanType)) {
          setSelectedPlan(data.memberPlan as PlanType);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load signup state");
      })
      .finally(() => setChecking(false));
  }, [loading, user?.id, user?.role, router]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/member/signup-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: selectedPlan, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to complete signup");
      }
      router.push("/dashboard/member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete signup");
      setSubmitting(false);
    }
  };

  if (loading || checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-foreground">
        <CardHeader>
          <CardTitle className="text-base">Complete Signup</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 border-2 border-red-500 bg-red-50 text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={(value) => {
                if (value) setSelectedPlan(value as PlanType);
              }}>
                <SelectTrigger id="plan" className="w-full">
                  <SelectValue placeholder="Choose your plan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_CONFIGS).map(([planKey, config]) => (
                    <SelectItem key={planKey} value={planKey}>
                      {config.name} - ₹{config.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Mock Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "CARD")}>
                <SelectTrigger id="paymentMethod" className="w-full">
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="NETBANKING">Net Banking</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mock payment amount: ₹{PLAN_CONFIGS[selectedPlan].price.toLocaleString()}
              </p>
            </div>
            <Button type="submit" className="w-full uppercase font-black text-base" disabled={submitting}>
              {submitting ? "PROCESSING..." : "PAY & CONTINUE"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
