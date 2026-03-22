"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/shared/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CalendarCheck, Clock, Dumbbell, Star, Download, Utensils, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NutritionCoach from "@/components/dashboard/member/nutrition-coach";

export default function MemberDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trainer, setTrainer] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    // Fetch member profile, attendance, bookings, trainer and invoices in parallel.
    const fetchData = async () => {
      try {
        const [pRes, aRes, bRes, tRes, iRes] = await Promise.all([
          fetch("/api/member/profile", { credentials: 'include' }),
          fetch("/api/member/attendance", { credentials: 'include' }),
          fetch("/api/member/bookings?upcoming=true", { credentials: 'include' }),
          fetch("/api/member/trainer", { credentials: 'include' }),
          fetch("/api/member/invoices", { credentials: 'include' }),
        ]);
        if (pRes.status === 401) {
          // Session invalid or expired
          router.push("/login");
          return;
        }
        if (!pRes.ok) {
          const profErr = await pRes.json().catch(() => null);
          throw new Error(profErr?.error || "Unable to load member profile");
        }
        const prof = await pRes.json();
        const att = aRes.ok ? await aRes.json() : [];
        const bkg = bRes.ok ? await bRes.json() : [];
        const inv = iRes.ok ? await iRes.json() : [];
        let trn: any = null;
        if (tRes.status === 200) {
          trn = await tRes.json();
        }
        setProfile(prof);
        setAttendance(att);
        setBookings(bkg);
        setInvoices(inv);
        setTrainer(trn);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [authLoading, user, router]);

  // Wait until data is loaded. We can show nothing or a simple loading state.
  if (loadingData || !profile) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <h1 className="text-2xl font-bold">Member dashboard unavailable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              className="inline-flex items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-semibold"
              onClick={() => router.push("/login")}
            >
              Return to login
            </button>
          </div>
        </div>
      );
    }
    return <div className="p-4">Loading...</div>;
  }

  const member = profile.member;

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Member profile missing</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but the member profile is incomplete.
          </p>
          <button
            className="inline-flex items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-semibold"
            onClick={() => router.push("/login")}
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  // Compute days until plan expiry relative to now
  const now = new Date();
  const expiryDate = new Date(member.planExpiry);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate plan total days for progress
  const planTotalDays = member.plan === "MONTHLY" ? 30 : member.plan === "QUARTERLY" ? 90 : 365;
  const planProgress = Math.max(0, Math.min(100, Math.round(((planTotalDays - daysUntilExpiry) / planTotalDays) * 100)));

  const formattedExpiry = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(expiryDate);

  const recentAttendance = attendance.slice(0, 5);

  return (
    <div>
      <TopBar title="My Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Hey, {member?.name?.split(" ")[0] || "Friend"} 💪
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress and stay consistent.</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Layout size={16} /> Overview
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Utensils size={16} /> Nutrition Coach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Current Plan"
            value={member.plan.charAt(0).toUpperCase() + member.plan.slice(1).toLowerCase()}
            icon={<CreditCard size={20} />}
            subtitle={`Expires ${formattedExpiry}`}
          />
          <KPICard
            title="Days Until Expiry"
            value={Math.max(0, daysUntilExpiry)}
            icon={<Clock size={20} />}
            subtitle={daysUntilExpiry < 7 ? "Renew soon!" : "You're good"}
          />
          <KPICard
            title="Sessions Remaining"
            value={member.sessionsRemaining}
            icon={<Dumbbell size={20} />}
          />
          <KPICard
            title="Attendance"
            value={member.attendanceCount}
            icon={<CalendarCheck size={20} />}
            subtitle="Total check-ins"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Sessions Used</span>
                  <span className="font-medium">{30 - member.sessionsRemaining}/30</span>
                </div>
                <Progress value={((30 - member.sessionsRemaining) / 30) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Plan Duration</span>
                  <span className="font-medium">{planProgress}%</span>
                </div>
                <Progress value={planProgress} />
              </div>
            </CardContent>
          </Card>

          {/* Assigned Trainer */}
          {trainer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "p-4 rounded-lg border",
                  "border-2 border-foreground rounded-none"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {trainer.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{trainer.name}</p>
                      <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(trainer.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{trainer.rating}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("capitalize text-xs",
                      trainer.availability === "available" && "bg-green-500/10 text-green-600"
                    )}>
                      {trainer.availability}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length > 0 ? (
                <div className="space-y-2">
                  {recentAttendance.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{a.date}</p>
                        <p className="text-xs text-muted-foreground">{a.checkIn} — {a.checkOut || "Still in"}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{a.method.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
              )}
            </CardContent>
          </Card>

          {/* My Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{inv.plan} PLAN</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">₹{inv.amount}</p>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black px-1", 
                            inv.status === 'PAID' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          )}>
                            {inv.status}
                          </Badge>
                        </div>
                        <a 
                          href={`/api/member/invoices/${inv.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No invoices generated yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionCoach />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
