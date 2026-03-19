"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
// import { trainers, reviews } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trainer, setTrainer] = useState<any | null>(null);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        setError(null);
        const trainerRes = await fetch('/api/member/trainer', { credentials: 'include' });
        if (trainerRes.ok) {
          const t = await trainerRes.json();
          setTrainer(t);
          setSelectedTrainer(t.id);
        } else if (trainerRes.status === 404) {
          setTrainer(null);
        } else {
          const err = await trainerRes.json();
          throw new Error(err.error || 'Failed to load trainer');
        }
        const reviewsRes = await fetch('/api/member/reviews', { credentials: 'include' });
        if (!reviewsRes.ok) {
          const err = await reviewsRes.json();
          throw new Error(err.error || 'Failed to load reviews');
        }
        const reviewsList = await reviewsRes.json();
        setReviewsData(reviewsList);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user]);

  const handleSubmit = async () => {
    if (rating > 0 && selectedTrainer && !authLoading && user) {
      try {
        const res = await fetch('/api/member/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ trainerId: selectedTrainer, rating, feedback })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to submit review');
        }
        const newReview = await res.json();
        // Prepend new review to list
        setReviewsData(prev => [
          {
            ...newReview,
            memberName: trainer?.name || ''
          },
          ...prev
        ]);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setRating(0);
          setFeedback('');
        }, 2000);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Review submission failed');
      }
    }
  };

  // Render loading or error states
  if (loading) {
    return (
      <div>
        <TopBar title="Reviews" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <TopBar title="Reviews" />
        <div className="p-4 lg:p-6 text-center text-destructive">{error}</div>
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Reviews" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                DROP A REVIEW
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your review is completely anonymous.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Trainer</Label>
                {trainer ? (
                  <Select value={selectedTrainer} onValueChange={v => setSelectedTrainer(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trainer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={trainer.id}>{trainer.name} — {trainer.specialization}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No trainer assigned.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={cn(
                          "transition-colors",
                          s <= (hoverRating || rating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Below Average"}
                    {rating === 3 && "Average"}
                    {rating === 4 && "Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Feedback (Optional)</Label>
                <Textarea
                  placeholder="Share your experience..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                className={cn("w-full", "uppercase font-black")}
                disabled={!selectedTrainer || rating === 0}
                onClick={handleSubmit}
              >
                <MessageSquare size={16} className="mr-2" />
                SUBMIT
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">All reviews are anonymous</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                    {reviewsData.length > 0 ? reviewsData.map(r => (
                  <div key={r.id} className={cn(
                    "p-4 rounded-lg border",
                    "rounded-none border-2 border-foreground"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{trainer ? trainer.name : ''}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0,10)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.feedback}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 size={48} className="text-green-500 mb-4" />
              <DialogHeader>
                <DialogTitle className="text-center">
                  REVIEW SUBMITTED!
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Your anonymous review has been submitted successfully.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
