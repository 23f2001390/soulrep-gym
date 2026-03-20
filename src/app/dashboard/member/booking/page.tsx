"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
// import { trainers, availableTimeSlots, bookings } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, CalendarCheck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function BookingPage() {
  // Use user and authLoading from auth context; NextAuth handles cookies automatically
  const { user, loading: authLoading } = useAuth();
  const [trainersData, setTrainersData] = useState<any[]>([]);
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [booked, setBooked] = useState(false);

  // Fetch trainers and bookings
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (authLoading || !user) return;
      try {
        // Only show full loading state if we have no data yet
        if (trainersData.length === 0) {
          setLoading(true);
        }
        setError(null);
        const [trainersRes, bookingsRes] = await Promise.all([
          fetch('/api/member/trainers', { credentials: 'include' }),
          fetch('/api/member/bookings', { credentials: 'include' })
        ]);
        
        if (!isMounted) return;

        if (!trainersRes.ok) {
          const err = await trainersRes.json();
          throw new Error(err.error || 'Failed to load trainers');
        }
        if (!bookingsRes.ok) {
          const err = await bookingsRes.json();
          throw new Error(err.error || 'Failed to load bookings');
        }
        
        const trainersList = await trainersRes.json();
        const bookingsList = await bookingsRes.json();
        
        setTrainersData(trainersList);
        setBookingsData(bookingsList);
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [authLoading, user]);


  // Compute available slots when trainer/date changes
  useEffect(() => {
    function computeSlots() {
      const trainer = trainersData.find(t => t.id === selectedTrainer);
      if (!trainer) {
        setAvailableSlots([]);
        return;
      }
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dayName = days[dateObj.getUTCDay()];
      const schedule = trainer.schedule as any;
      const daySlots = schedule && schedule[dayName] ? schedule[dayName] : [];
      const times: string[] = daySlots.map((s: any) => s.start);
      times.sort();
      const formatted = times.map(t => {
        const [h, m] = t.split(':');
        const date = new Date();
        date.setHours(parseInt(h));
        date.setMinutes(parseInt(m));
        const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString(undefined, options).replace(/ /g, '');
      });
      setAvailableSlots(formatted);
    }
    if (selectedTrainer && selectedDate) {
      computeSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedTrainer, selectedDate, trainersData]);

  const trainer = trainersData.find(t => t.id === selectedTrainer);

  // Determine if a given time slot is already booked for the selected trainer/date
  const isSlotBooked = (time: string) => {
    return bookingsData.some((b: any) => {
      // Extract date portion in YYYY-MM-DD regardless of Date or string input
      let bookingDateStr: string;
      if (typeof b.date === 'string') {
        // When backend returns ISO string or date string, slice the first 10 chars
        bookingDateStr = b.date.slice(0, 10);
      } else {
        // For Date objects, convert to ISO string
        bookingDateStr = new Date(b.date).toISOString().slice(0, 10);
      }
      return b.trainerId === selectedTrainer && bookingDateStr === selectedDate && b.time === time;
    });
  };

  const handleBook = async () => {
    if (!selectedTrainer || !selectedDate || !selectedTime || authLoading || !user) return;
    setBooked(true);
    try {
      const res = await fetch('/api/member/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ trainerId: selectedTrainer, date: selectedDate, time: selectedTime })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create booking');
      }
      const newBooking = await res.json();
      setBookingsData(prev => [...prev, newBooking]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Booking failed');
    } finally {
      setTimeout(() => {
        setShowConfirm(false);
        setBooked(false);
        setSelectedTime('');
      }, 1500);
    }
  };

  return (
    <div>
      <TopBar title="Book a Session" />
      <div className="p-4 lg:p-6 space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : error ? (
          <div className="text-center text-destructive flex items-center gap-2 justify-center"><AlertCircle size={16} /> {error}</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Schedule a Training Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select Trainer */}
              <div className="space-y-2">
                <Label>Select Trainer</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trainersData.filter((t: any) => t.availability !== 'off').map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrainer(t.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        selectedTrainer === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                        "rounded-none border-2",
                        selectedTrainer === t.id && "border-foreground bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {t.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.specialization}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-muted-foreground">{t.rating ? t.rating.toFixed(1) : '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Date */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>

              {/* Select Time */}
              {selectedTrainer && (
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {availableSlots.map((time: string) => {
                      const slotBooked = isSlotBooked(time);
                      return (
                        <button
                          key={time}
                          disabled={slotBooked}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "p-3 rounded-lg border text-center text-sm transition-all",
                            slotBooked && "opacity-40 cursor-not-allowed line-through",
                            !slotBooked && selectedTime === time && "border-primary bg-primary/5 font-medium",
                            !slotBooked && selectedTime !== time && "hover:bg-muted/50",
                            "rounded-none border-2"
                          )}
                        >
                          <Clock size={14} className="mx-auto mb-1" />
                          {time}
                          {slotBooked && <p className="text-[10px] text-destructive">Booked</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <Button
                size="lg"
                className={cn("w-full", "uppercase font-black")}
                disabled={!selectedTrainer || !selectedTime || !selectedDate}
                onClick={() => setShowConfirm(true)}
              >
                <CalendarCheck size={18} className="mr-2" />
                BOOK NOW
              </Button>
            </CardContent>
          </Card>

          {/* Existing Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookingsData.length > 0 ? bookingsData.map((b: any) => {
                  // Normalize date display
                  const dateStr = typeof b.date === 'string'
                    ? b.date.slice(0, 10)
                    : new Date(b.date).toISOString().slice(0, 10);
                  return (
                    <div key={b.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{b.trainerName}</p>
                        <Badge variant="outline" className={cn("text-xs capitalize",
                          b.status.toLowerCase() === 'confirmed' && 'bg-green-500/10 text-green-600',
                          b.status.toLowerCase() === 'pending' && 'bg-yellow-500/10 text-yellow-600',
                          b.status.toLowerCase() === 'cancelled' && 'bg-red-500/10 text-red-600'
                        )}>
                          {b.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{dateStr} at {b.time}</p>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{booked ? "Booking Confirmed!" : "Confirm Your Booking"}</DialogTitle>
            </DialogHeader>
            {booked ? (
              <div className="flex flex-col items-center py-6">
                <CheckCircle2 size={48} className="text-green-500 mb-4" />
                <p className="text-sm text-muted-foreground">Your session has been booked successfully.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Trainer</p>
                    <p className="font-medium">{trainer?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Specialization</p>
                    <p className="font-medium">{trainer?.specialization}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleBook}>Confirm</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
