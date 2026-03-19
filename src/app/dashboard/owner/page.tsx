"use client";

import { TopBar } from "@/components/shared/top-bar";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { KPICard } from "@/components/shared/kpi-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, DollarSign, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [kpi, setKpi] = useState<any | null>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [trainerRatings, setTrainerRatings] = useState<any[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchOwnerData = async () => {
      try {
        const [kpiRes, revRes, ratingsRes, expRes] = await Promise.all([
          fetch("/api/owner/kpi"),
          fetch("/api/owner/revenue"),
          fetch("/api/owner/trainer-ratings"),
          fetch("/api/owner/expiring-members"),
        ]);
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpi(kpiData);
        }
        if (revRes.ok) {
          const revData = await revRes.json();
          setRevenue(revData);
        }
        if (ratingsRes.ok) {
          const ratingData = await ratingsRes.json();
          setTrainerRatings(ratingData);
        }
        if (expRes.ok) {
          const expData = await expRes.json();
          setExpiringMembers(expData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchOwnerData();
  }, [authLoading, user]);

  if (authLoading || loadingData || !kpi) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Members"
            value={kpi.totalMembers}
            icon={<Users size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Active Plans"
            value={kpi.activePlans}
            icon={<CreditCard size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Revenue"
            value={`₹${(kpi.revenue / 1000).toFixed(0)}K`}
            icon={<DollarSign size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Expiring Soon"
            value={kpi.expiringSoon}
            icon={<AlertTriangle size={20} />}
            subtitle="Next 7 days"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenue} />

          {/* Trainer Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trainer Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trainerRatings} layout="vertical">
                  <XAxis type="number" domain={[0, 5]} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="rating" radius={0}>
                    {trainerRatings.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Expiry Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringMembers.length > 0 ? (
              <div className="space-y-3">
                {expiringMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.plan} plan</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">{m.planStatus}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(m.expiry).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming expirations.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
