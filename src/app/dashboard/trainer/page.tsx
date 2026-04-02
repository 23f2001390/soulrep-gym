"use client";

import { TopBar } from "@/components/shared/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { sessionLogs, getMembersForTrainer, trainers } from "@/lib/mock-data";
import { KPICard } from "@/components/shared/kpi-card";
import { CalendarCheck, Users, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        setError(null);
        // Fetch profile
        const profileRes = await fetch('/api/trainer/profile', { credentials: 'include' });
        if (!profileRes.ok) {
          const err = await profileRes.json();
          throw new Error(err.error || 'Failed to load profile');
        }
        const profileData = await profileRes.json();
        setProfile(profileData);
        // Fetch today's sessions (using local date)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const sessionsRes = await fetch(`/api/trainer/sessions?date=${dateStr}`, { credentials: 'include' });
        if (!sessionsRes.ok) {
          const err = await sessionsRes.json();
          throw new Error(err.error || 'Failed to load sessions');
        }
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
        // Fetch members
        const membersRes = await fetch('/api/trainer/members', { credentials: 'include' });
        if (!membersRes.ok) {
          const err = await membersRes.json();
          throw new Error(err.error || 'Failed to load members');
        }
        const membersData = await membersRes.json();
        setMembers(membersData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user?.id]);

  // Compute KPIs
  const todaySessions = sessions;
  const assignedMembers = members;
  const completedCount = todaySessions.filter(s => s.completed).length;
  const avgDuration = Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / (todaySessions.length || 1));

  if (loading) {
    return (
      <div>
        <TopBar title="Trainer Dashboard" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <TopBar title="Trainer Dashboard" />
        <div className="p-4 lg:p-6 text-center text-destructive">{error}</div>
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Trainer Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Welcome back, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your schedule for today.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Today's Sessions" value={todaySessions.length} icon={<CalendarCheck size={20} />} />
          <KPICard title="Assigned Members" value={assignedMembers.length} icon={<Users size={20} />} />
          <KPICard title="Completed Today" value={completedCount} icon={<CheckCircle2 size={20} />} />
          <KPICard title="Avg Duration" value={`${avgDuration} min`} icon={<Clock size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaySessions.length > 0 ? todaySessions.map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      session.completed ? 'bg-muted/30 border-border' : 'bg-card border-primary/20',
                      'border-2 border-foreground rounded-none'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {session.memberName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.memberName}</p>
                          <p className="text-xs text-muted-foreground">{session.duration} minutes</p>
                        </div>
                      </div>
                      <Badge variant={session.completed ? 'secondary' : 'default'} className="text-xs">
                        {session.completed ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.exercises.map((ex: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{ex}</Badge>
                      ))}
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{session.notes}</p>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No sessions scheduled for today.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {m.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.plan} plan · {m.sessionsRemaining} sessions left</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize',
                        m.planStatus === 'active' && 'bg-green-500/10 text-green-600',
                        m.planStatus === 'expiring' && 'bg-yellow-500/10 text-yellow-600',
                        m.planStatus === 'expired' && 'bg-red-500/10 text-red-600'
                      )}
                    >
                      {m.planStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
