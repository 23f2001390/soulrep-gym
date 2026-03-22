"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Utensils, Scale, Info, Loader2, CheckCircle2 } from "lucide-react";
import { FitnessGoal, ActivityLevel, DietaryPreference } from "@prisma/client";

export default function NutritionCoach() {
  const [profile, setProfile] = useState<any>(null);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    fitnessGoal: "MUSCLE_GAIN" as FitnessGoal,
    activityLevel: "MODERATE" as ActivityLevel,
    dietaryPreference: "VEGETARIAN" as DietaryPreference,
    cuisinePreference: "South Indian",
    usualDiet: "",
    allergies: [] as string[],
    restrictions: [] as string[]
  });

  useEffect(() => {
    fetchNutrition();
  }, []);

  const fetchNutrition = async () => {
    try {
      const res = await fetch("/api/member/nutrition");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setFormData({
          ...formData,
          age: data.profile.age?.toString() || "",
          weight: data.profile.weight?.toString() || "",
          height: data.profile.height?.toString() || "",
          fitnessGoal: data.profile.fitnessGoal,
          activityLevel: data.profile.activityLevel,
          dietaryPreference: data.profile.dietaryPreference,
          cuisinePreference: data.profile.cuisinePreference || "South Indian",
          usualDiet: data.profile.usualDiet || "",
        });
      }
      setMealPlans(data.mealPlans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/member/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        fetchNutrition();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Target Macros Header */}
      {profile?.completed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Protein Target</p>
                  <h3 className="text-2xl font-bold">{profile.targetProtein}g</h3>
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                  <Scale size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Calories</p>
                  <h3 className="text-2xl font-bold">{profile.targetCalories} kcal</h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Utensils size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Form / Plan View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings / Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              AI Diet Settings
            </CardTitle>
            <CardDescription>Customize your nutrition plan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" placeholder="25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" placeholder="70" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fitness Goal</Label>
                <Select value={formData.fitnessGoal} onValueChange={v => setFormData({...formData, fitnessGoal: v as FitnessGoal})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUSCLE_GAIN">💪 Muscle Gain</SelectItem>
                    <SelectItem value="FAT_LOSS">🔥 Fat Loss / Shred</SelectItem>
                    <SelectItem value="MAINTENANCE">⚖ Maintenance</SelectItem>
                    <SelectItem value="ATHLETIC_PERFORMANCE">⚡ Athletic Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={formData.activityLevel} onValueChange={v => setFormData({...formData, activityLevel: v as ActivityLevel})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDENTARY">Sedentary (Office/Sitting)</SelectItem>
                    <SelectItem value="LIGHT">Lightly Active (1-2 workouts)</SelectItem>
                    <SelectItem value="MODERATE">Moderately Active (3-5 workouts)</SelectItem>
                    <SelectItem value="VERY_ACTIVE">Very Active (Daily workouts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dietary Preference</Label>
                <Select value={formData.dietaryPreference} onValueChange={v => setFormData({...formData, dietaryPreference: v as DietaryPreference})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEGETARIAN">🥬 Vegetarian</SelectItem>
                    <SelectItem value="NON_VEGETARIAN">🥩 Non-Vegetarian</SelectItem>
                    <SelectItem value="VEGAN">🌱 Vegan</SelectItem>
                    <SelectItem value="PESSATARIAN">🐟 PESSATARIAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cuisine Preference</Label>
                <Select value={formData.cuisinePreference} onValueChange={v => setFormData({...formData, cuisinePreference: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="South Indian">South Indian</SelectItem>
                    <SelectItem value="North Indian">North Indian</SelectItem>
                    <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="Continental">Continental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>What is your usual diet?</Label>
                <textarea 
                  className="w-full min-h-[100px] p-3 text-sm rounded-md border bg-background"
                  placeholder="e.g. 2 Chapatis with Dal for lunch, 1 glass of milk at night..."
                  value={formData.usualDiet}
                  onChange={e => setFormData({...formData, usualDiet: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Generating Plan...</span> : "Update Plan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Weekly Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Diet Plan</CardTitle>
            <CardDescription>Your AI-generated meals based on your weight and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!mealPlans.length ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <Utensils className="mx-auto text-muted-foreground mb-4" size={40} />
                <p className="text-muted-foreground">No plan generated yet. Save your settings to begin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...mealPlans].reverse().map((plan) => (
                   <div key={plan.id} className="p-4 border rounded-xl bg-card/50">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold">{new Date(plan.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</h4>
                        <Badge variant="outline" className="bg-primary/5">₹{plan.totalProtein}g Protein</Badge>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-1">
                        {plan.meals.map((meal: any) => (
                           <div key={meal.id} className="flex gap-3 items-start border-l-2 border-primary/20 pl-3">
                              <div>
                                <p className="font-bold text-xs uppercase text-muted-foreground">{meal.time}</p>
                                <p className="font-medium text-sm">{meal.description}</p>
                                <p className="text-[10px] bg-secondary px-2 py-0.5 rounded inline-block mt-1">{meal.protein}g Protein</p>
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
