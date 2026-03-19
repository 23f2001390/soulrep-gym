"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, ArrowUpDown, UserCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MembersPage() {
  // Use user and auth loading state instead of a custom token
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; memberId: string } | null>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState<string>("");
  const [newTrainerId, setNewTrainerId] = useState<string>("");
  const [extendDays, setExtendDays] = useState<string>("30");

  async function fetchMembers() {
    try {
      const res = await fetch('/api/owner/members', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      setMembersData(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    fetchMembers().then(() => setLoading(false));

    // Fetch trainers for reassignment
    fetch('/api/owner/trainers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTrainers(data))
      .catch(console.error);
  }, [authLoading, user]);

  const handleUpdate = async (data: any) => {
    try {
      const res = await fetch('/api/owner/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: actionDialog?.memberId, ...data }),
      });
      if (res.ok) {
        await fetchMembers();
        setActionDialog(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtend = async () => {
    const member = membersData.find(m => m.id === actionDialog?.memberId);
    if (!member) return;
    const currentExpiry = new Date(member.planExpiry);
    currentExpiry.setDate(currentExpiry.getDate() + parseInt(extendDays));
    await handleUpdate({ planExpiry: currentExpiry.toISOString() });
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Members" />
        <div className="p-4 lg:p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filtered = membersData.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || m.plan === planFilter;
    const matchesStatus = statusFilter === "all" || m.planStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "active": return "bg-green-500/10 text-green-600 border-green-200";
      case "EXPIRING":
      case "expiring": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "EXPIRED":
      case "expired": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  const member = selectedMember ? membersData.find(m => m.id === selectedMember) : null;
  const memberTrainer = member?.trainer || null;

  return (
    <div>
      <TopBar title="Members" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={planFilter} onValueChange={v => setPlanFilter(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Table */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(m => (
                      <TableRow
                        key={m.id}
                        className={cn("cursor-pointer transition-colors", selectedMember === m.id && "bg-muted/50")}
                        onClick={() => setSelectedMember(m.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {m.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">{m.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("capitalize text-xs", statusColor(m.planStatus))}>
                            {m.planStatus.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{m.planExpiry}</TableCell>
                        <TableCell className="text-sm">{m.attendanceCount}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedMember(m.id); }}>
                            <Eye size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Member Detail Panel */}
          <Card className="lg:col-span-1">
            {member ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="font-medium">{member.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Age / Gender</p>
                      <p className="font-medium">{member.age} / {member.gender}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Plan</p>
                      <Badge variant="outline" className="capitalize">{member.plan}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Expiry</p>
                      <p className="font-medium">{member.planExpiry}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Sessions Left</p>
                      <p className="font-medium">{member.sessionsRemaining}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Attendance</p>
                      <p className="font-medium">{member.attendanceCount} days</p>
                    </div>
                  </div>

                  {member.healthNotes && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Health Notes</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{member.healthNotes}</p>
                    </div>
                  )}

                  {memberTrainer && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Assigned Trainer</p>
                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <UserCircle size={16} className="text-primary" />
                        <span className="text-sm font-medium">{memberTrainer.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{memberTrainer.specialization}</Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Dialog open={actionDialog?.type === "upgrade"} onOpenChange={o => !o && setActionDialog(null)}>
                      <DialogTrigger>
                        <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "upgrade", memberId: member.id })}>
                          Upgrade/Downgrade Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Plan — {member.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Current Plan</Label>
                            <p className="text-sm capitalize mt-1">{member.plan}</p>
                          </div>
                          <div>
                            <Label>New Plan</Label>
                            <Select onValueChange={setNewPlan} value={newPlan || member.plan}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MONTHLY">Monthly — ₹1,800</SelectItem>
                                <SelectItem value="QUARTERLY">Quarterly — ₹4,500</SelectItem>
                                <SelectItem value="YEARLY">Yearly — ₹12,000</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={() => handleUpdate({ plan: newPlan })}>Update Plan</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={actionDialog?.type === "extend"} onOpenChange={o => !o && setActionDialog(null)}>
                      <DialogTrigger>
                        <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "extend", memberId: member.id })}>
                          Extend Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Extend Plan — {member.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Current Expiry</Label>
                            <p className="text-sm mt-1">{member.planExpiry}</p>
                          </div>
                          <div>
                            <Label>Extend By</Label>
                            <Select onValueChange={setExtendDays} value={extendDays}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="14">14 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="90">90 Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Reason</Label>
                            <Textarea placeholder="Optional note..." className="mt-1" />
                          </div>
                          <Button className="w-full" onClick={handleExtend}>Extend</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={actionDialog?.type === "reassign"} onOpenChange={o => !o && setActionDialog(null)}>
                      <DialogTrigger>
                        <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "reassign", memberId: member.id })}>
                          Reassign Trainer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reassign Trainer — {member.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Current Trainer</Label>
                            <p className="text-sm mt-1">{memberTrainer?.name || "None"}</p>
                          </div>
                          <div>
                            <Label>New Trainer</Label>
                            <Select onValueChange={setNewTrainerId} value={newTrainerId || member.trainerId}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {trainers.map(t => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name} — {t.specialization}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={() => handleUpdate({ trainerId: newTrainerId })}>Reassign</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserCircle size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Select a member to view details</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
