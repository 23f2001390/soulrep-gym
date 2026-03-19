"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/shared/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CalendarCheck, Clock, Dumbbell, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MemberDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [trainer, setTrainer] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    // Fetch member profile, attendance, bookings and trainer in parallel.
    const fetchData = async () => {
      try {
        const [pRes, aRes, bRes, tRes] = await Promise.all([
          fetch("/api/member/profile", { credentials: 'include' }),
          fetch("/api/member/attendance", { credentials: 'include' }),
          fetch("/api/member/bookings?upcoming=true", { credentials: 'include' }),
          fetch("/api/member/trainer", { credentials: 'include' }),
        ]);
        if (pRes.status === 401) {
          // Session invalid or expired
          router.push("/login");
          return;
        }
        const prof = await pRes.json();
        const att = await aRes.json();
        const bkg = await bRes.json();
        let trn: any = null;
        if (tRes.status === 200) {
          trn = await tRes.json();
        }
        setProfile(prof);
        setAttendance(att);
        setBookings(bkg);
        setTrainer(trn);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [authLoading, user, router]);

  // Wait until data is loaded. We can show nothing or a simple loading state.
  if (loadingData || !profile) {
    return <div className="p-4">Loading...</div>;
  }

  const member = profile.member;

  // Compute days until plan expiry relative to now
  const now = new Date();
  const expiryDate = new Date(member.planExpiry);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const recentAttendance = attendance.slice(0, 5);

  return (
    <div>
      <TopBar title="My Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Hey, {member?.name?.split(" ")[0] || "Friend"} 💪
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress and stay consistent.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Current Plan"
            value={member.plan.charAt(0).toUpperCase() + member.plan.slice(1)}
            icon={<CreditCard size={20} />}
            subtitle={`Expires ${member.planExpiry}`}
          />
          <KPICard
            title="Days Until Expiry"
            value={daysUntilExpiry}
            icon={<Clock size={20} />}
            subtitle={daysUntilExpiry < 14 ? "Renew soon!" : "You're good"}
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
                  <span className="font-medium">{Math.max(0, 100 - Math.round((daysUntilExpiry / 365) * 100))}%</span>
                </div>
                <Progress value={Math.max(0, 100 - Math.round((daysUntilExpiry / 365) * 100))} />
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

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-2">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{b.trainerName}</p>
                        <p className="text-xs text-muted-foreground">{b.date} at {b.time}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs capitalize",
                          b.status === "confirmed" && "bg-green-500/10 text-green-600",
                          b.status === "pending" && "bg-yellow-500/10 text-yellow-600"
                        )}
                      >
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming sessions.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
