import type {
  Member, Trainer, AttendanceRecord, Invoice, WorkoutPlan,
  SessionLog, Review, Booking, NutritionProfile, MealPlan,
  KPIData, RevenueData, TimeSlot, WeeklySchedule
} from "./types";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function makeSchedule(trainerId: string): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  days.forEach(day => {
    const slots: TimeSlot[] = [
      { start: "06:00", end: "07:00", type: "session", memberId: "m1", memberName: "Alex Carter" },
      { start: "07:00", end: "08:00", type: "session", memberId: "m2", memberName: "Jordan Lee" },
      { start: "08:00", end: "08:30", type: "break" },
      { start: "08:30", end: "09:30", type: "available" },
      { start: "09:30", end: "10:30", type: "session", memberId: "m3", memberName: "Sam Rivera" },
      { start: "10:30", end: "11:30", type: "available" },
      { start: "16:00", end: "17:00", type: "session", memberId: "m4", memberName: "Taylor Kim" },
      { start: "17:00", end: "18:00", type: "session", memberId: "m5", memberName: "Morgan Chen" },
      { start: "18:00", end: "19:00", type: "available" },
    ];
    schedule[day] = day === "Saturday" ? slots.slice(0, 4) : slots;
  });
  return schedule;
}

export const trainers: Trainer[] = [
  { id: "t1", name: "Chris Walker", email: "chris@soulrep.com", phone: "+1-555-0101", avatar: "", specialization: "Strength & Conditioning", rating: 4.8, reviewCount: 47, memberCount: 12, availability: "available", schedule: makeSchedule("t1") },
  { id: "t2", name: "Priya Sharma", email: "priya@soulrep.com", phone: "+1-555-0102", avatar: "", specialization: "Yoga & Flexibility", rating: 4.9, reviewCount: 63, memberCount: 15, availability: "available", schedule: makeSchedule("t2") },
  { id: "t3", name: "Marcus Johnson", email: "marcus@soulrep.com", phone: "+1-555-0103", avatar: "", specialization: "HIIT & Cardio", rating: 4.6, reviewCount: 31, memberCount: 10, availability: "busy", schedule: makeSchedule("t3") },
  { id: "t4", name: "Elena Rodriguez", email: "elena@soulrep.com", phone: "+1-555-0104", avatar: "", specialization: "CrossFit", rating: 4.7, reviewCount: 28, memberCount: 8, availability: "available", schedule: makeSchedule("t4") },
  { id: "t5", name: "David Park", email: "david@soulrep.com", phone: "+1-555-0105", avatar: "", specialization: "Powerlifting", rating: 4.5, reviewCount: 22, memberCount: 6, availability: "off", schedule: makeSchedule("t5") },
];

export const members: Member[] = [
  { id: "m1", name: "Alex Carter", email: "alex@email.com", phone: "+1-555-1001", avatar: "", joinDate: "2025-06-15", plan: "yearly", planExpiry: "2026-06-15", planStatus: "active", trainerId: "t1", healthNotes: "Mild lower back stiffness. Prefers morning sessions.", attendanceCount: 142, sessionsRemaining: 24, age: 28, gender: "male" },
  { id: "m2", name: "Jordan Lee", email: "jordan@email.com", phone: "+1-555-1002", avatar: "", joinDate: "2025-09-01", plan: "quarterly", planExpiry: "2026-03-01", planStatus: "expiring", trainerId: "t1", healthNotes: "No issues noted.", attendanceCount: 67, sessionsRemaining: 8, age: 32, gender: "female" },
  { id: "m3", name: "Sam Rivera", email: "sam@email.com", phone: "+1-555-1003", avatar: "", joinDate: "2025-11-20", plan: "monthly", planExpiry: "2026-04-20", planStatus: "active", trainerId: "t2", healthNotes: "Recovering from shoulder injury. Light upper body only.", attendanceCount: 34, sessionsRemaining: 12, age: 25, gender: "male" },
  { id: "m4", name: "Taylor Kim", email: "taylor@email.com", phone: "+1-555-1004", avatar: "", joinDate: "2025-03-10", plan: "yearly", planExpiry: "2026-03-10", planStatus: "expiring", trainerId: "t3", healthNotes: "Asthma—needs warm-up time.", attendanceCount: 198, sessionsRemaining: 30, age: 29, gender: "female" },
  { id: "m5", name: "Morgan Chen", email: "morgan@email.com", phone: "+1-555-1005", avatar: "", joinDate: "2026-01-05", plan: "monthly", planExpiry: "2026-04-05", planStatus: "active", trainerId: "t2", healthNotes: "", attendanceCount: 22, sessionsRemaining: 6, age: 35, gender: "male" },
  { id: "m6", name: "Casey Brooks", email: "casey@email.com", phone: "+1-555-1006", avatar: "", joinDate: "2025-07-22", plan: "quarterly", planExpiry: "2026-01-22", planStatus: "expired", trainerId: "t4", healthNotes: "Knee brace recommended during squats.", attendanceCount: 89, sessionsRemaining: 0, age: 27, gender: "female" },
  { id: "m7", name: "Riley Nguyen", email: "riley@email.com", phone: "+1-555-1007", avatar: "", joinDate: "2025-12-01", plan: "monthly", planExpiry: "2026-05-01", planStatus: "active", trainerId: "t3", healthNotes: "", attendanceCount: 45, sessionsRemaining: 10, age: 23, gender: "other" },
  { id: "m8", name: "Quinn Foster", email: "quinn@email.com", phone: "+1-555-1008", avatar: "", joinDate: "2025-10-15", plan: "yearly", planExpiry: "2026-10-15", planStatus: "active", trainerId: "t1", healthNotes: "Diabetic—carries glucose tabs.", attendanceCount: 112, sessionsRemaining: 40, age: 41, gender: "male" },
  { id: "m9", name: "Avery Scott", email: "avery@email.com", phone: "+1-555-1009", avatar: "", joinDate: "2026-02-01", plan: "monthly", planExpiry: "2026-05-01", planStatus: "active", trainerId: "t4", healthNotes: "First time gym member.", attendanceCount: 15, sessionsRemaining: 8, age: 19, gender: "female" },
  { id: "m10", name: "Drew Patel", email: "drew@email.com", phone: "+1-555-1010", avatar: "", joinDate: "2025-08-18", plan: "quarterly", planExpiry: "2026-05-18", planStatus: "active", trainerId: "t2", healthNotes: "Vegetarian. Interested in nutrition coaching.", attendanceCount: 76, sessionsRemaining: 15, age: 30, gender: "male" },
];

export const attendance: AttendanceRecord[] = [
  { id: "a1", memberId: "m1", memberName: "Alex Carter", date: "2026-03-18", checkIn: "06:15", checkOut: "07:45", method: "qr" },
  { id: "a2", memberId: "m2", memberName: "Jordan Lee", date: "2026-03-18", checkIn: "07:00", checkOut: "08:30", method: "qr" },
  { id: "a3", memberId: "m3", memberName: "Sam Rivera", date: "2026-03-18", checkIn: "08:45", checkOut: "10:00", method: "manual" },
  { id: "a4", memberId: "m4", memberName: "Taylor Kim", date: "2026-03-18", checkIn: "16:10", method: "qr" },
  { id: "a5", memberId: "m5", memberName: "Morgan Chen", date: "2026-03-18", checkIn: "17:05", checkOut: "18:30", method: "qr" },
  { id: "a6", memberId: "m7", memberName: "Riley Nguyen", date: "2026-03-18", checkIn: "09:00", checkOut: "10:15", method: "qr" },
  { id: "a7", memberId: "m8", memberName: "Quinn Foster", date: "2026-03-18", checkIn: "06:00", checkOut: "07:30", method: "manual" },
  { id: "a8", memberId: "m1", memberName: "Alex Carter", date: "2026-03-17", checkIn: "06:20", checkOut: "07:50", method: "qr" },
  { id: "a9", memberId: "m3", memberName: "Sam Rivera", date: "2026-03-17", checkIn: "09:00", checkOut: "10:10", method: "qr" },
  { id: "a10", memberId: "m4", memberName: "Taylor Kim", date: "2026-03-17", checkIn: "16:00", checkOut: "17:15", method: "qr" },
  { id: "a11", memberId: "m9", memberName: "Avery Scott", date: "2026-03-17", checkIn: "10:00", checkOut: "11:00", method: "manual" },
  { id: "a12", memberId: "m10", memberName: "Drew Patel", date: "2026-03-17", checkIn: "07:30", checkOut: "09:00", method: "qr" },
  { id: "a13", memberId: "m2", memberName: "Jordan Lee", date: "2026-03-16", checkIn: "07:15", checkOut: "08:30", method: "qr" },
  { id: "a14", memberId: "m5", memberName: "Morgan Chen", date: "2026-03-16", checkIn: "17:00", checkOut: "18:20", method: "qr" },
  { id: "a15", memberId: "m6", memberName: "Casey Brooks", date: "2026-03-16", checkIn: "08:00", checkOut: "09:15", method: "manual" },
];

export const invoices: Invoice[] = [
  { id: "inv1", memberId: "m1", memberName: "Alex Carter", plan: "yearly", amount: 12000, date: "2025-06-15", status: "paid" },
  { id: "inv2", memberId: "m2", memberName: "Jordan Lee", plan: "quarterly", amount: 4500, date: "2025-09-01", status: "paid" },
  { id: "inv3", memberId: "m3", memberName: "Sam Rivera", plan: "monthly", amount: 1800, date: "2026-02-20", status: "paid" },
  { id: "inv4", memberId: "m4", memberName: "Taylor Kim", plan: "yearly", amount: 12000, date: "2025-03-10", status: "paid" },
  { id: "inv5", memberId: "m5", memberName: "Morgan Chen", plan: "monthly", amount: 1800, date: "2026-03-05", status: "pending" },
  { id: "inv6", memberId: "m6", memberName: "Casey Brooks", plan: "quarterly", amount: 4500, date: "2025-07-22", status: "overdue" },
  { id: "inv7", memberId: "m7", memberName: "Riley Nguyen", plan: "monthly", amount: 1800, date: "2026-03-01", status: "paid" },
  { id: "inv8", memberId: "m8", memberName: "Quinn Foster", plan: "yearly", amount: 12000, date: "2025-10-15", status: "paid" },
  { id: "inv9", memberId: "m9", memberName: "Avery Scott", plan: "monthly", amount: 1800, date: "2026-02-01", status: "paid" },
  { id: "inv10", memberId: "m10", memberName: "Drew Patel", plan: "quarterly", amount: 4500, date: "2025-11-18", status: "paid" },
];

export const workoutPlans: WorkoutPlan[] = [
  { id: "wp1", memberId: "m1", trainerId: "t1", day: "Monday", exercises: [
    { name: "Barbell Squat", sets: 4, reps: "8-10", rest: "90s" },
    { name: "Romanian Deadlift", sets: 3, reps: "10-12", rest: "90s" },
    { name: "Leg Press", sets: 3, reps: "12-15", rest: "60s" },
    { name: "Walking Lunges", sets: 3, reps: "12 each", rest: "60s" },
    { name: "Calf Raises", sets: 4, reps: "15-20", rest: "45s" },
  ], notes: "Focus on depth for squats. Light RDLs—watch lower back." },
  { id: "wp2", memberId: "m1", trainerId: "t1", day: "Wednesday", exercises: [
    { name: "Bench Press", sets: 4, reps: "8-10", rest: "90s" },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "60s" },
    { name: "Cable Fly", sets: 3, reps: "12-15", rest: "60s" },
    { name: "Overhead Tricep Extension", sets: 3, reps: "12-15", rest: "45s" },
    { name: "Lateral Raises", sets: 4, reps: "15", rest: "45s" },
  ], notes: "Increase bench weight by 2.5kg if 10 reps is clean." },
  { id: "wp3", memberId: "m1", trainerId: "t1", day: "Friday", exercises: [
    { name: "Pull-ups", sets: 4, reps: "6-8", rest: "90s" },
    { name: "Barbell Row", sets: 4, reps: "8-10", rest: "90s" },
    { name: "Seated Cable Row", sets: 3, reps: "12", rest: "60s" },
    { name: "Face Pulls", sets: 3, reps: "15-20", rest: "45s" },
    { name: "Barbell Curl", sets: 3, reps: "12", rest: "45s" },
  ], notes: "Assisted pull-ups ok. No ego lifting on rows." },
  { id: "wp4", memberId: "m2", trainerId: "t1", day: "Monday", exercises: [
    { name: "Goblet Squat", sets: 3, reps: "12", rest: "60s" },
    { name: "Hip Thrust", sets: 3, reps: "12", rest: "60s" },
    { name: "Step-ups", sets: 3, reps: "10 each", rest: "60s" },
    { name: "Plank", sets: 3, reps: "45s hold", rest: "30s" },
  ], notes: "Building foundational strength." },
  { id: "wp5", memberId: "m3", trainerId: "t2", day: "Tuesday", exercises: [
    { name: "Sun Salutation Flow", sets: 3, reps: "5 rounds", rest: "30s" },
    { name: "Warrior Sequence", sets: 2, reps: "Hold 30s each", rest: "15s" },
    { name: "Bridge Pose", sets: 3, reps: "Hold 30s", rest: "15s" },
    { name: "Pigeon Pose", sets: 2, reps: "Hold 45s each side", rest: "15s" },
  ], notes: "Shoulder recovery focus. No overhead movement." },
];

export const sessionLogs: SessionLog[] = [
  { id: "sl1", memberId: "m1", memberName: "Alex Carter", trainerId: "t1", date: "2026-03-18", duration: 60, exercises: ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Lunges"], notes: "Good session. Squat depth improving.", completed: true },
  { id: "sl2", memberId: "m2", memberName: "Jordan Lee", trainerId: "t1", date: "2026-03-18", duration: 45, exercises: ["Goblet Squat", "Hip Thrust", "Step-ups", "Plank"], notes: "First time doing hip thrusts. Form needs work.", completed: true },
  { id: "sl3", memberId: "m3", memberName: "Sam Rivera", trainerId: "t2", date: "2026-03-18", duration: 50, exercises: ["Sun Salutation", "Warrior Sequence", "Bridge Pose"], notes: "Shoulder mobility improving. Ready for light overhead next week.", completed: true },
  { id: "sl4", memberId: "m4", memberName: "Taylor Kim", trainerId: "t3", date: "2026-03-18", duration: 55, exercises: ["Burpees", "Box Jumps", "Battle Ropes", "Mountain Climbers"], notes: "Pushed hard. Needed extra warm-up for breathing.", completed: false },
  { id: "sl5", memberId: "m5", memberName: "Morgan Chen", trainerId: "t2", date: "2026-03-18", duration: 60, exercises: ["Vinyasa Flow", "Core Work", "Meditation"], notes: "Excellent focus today.", completed: true },
];

export const reviews: Review[] = [
  { id: "r1", trainerId: "t1", trainerName: "Chris Walker", rating: 5, feedback: "Chris is incredibly knowledgeable. My squat form has improved dramatically.", date: "2026-03-10" },
  { id: "r2", trainerId: "t1", trainerName: "Chris Walker", rating: 4, feedback: "Great trainer, sometimes sessions run a bit over time though.", date: "2026-03-05" },
  { id: "r3", trainerId: "t2", trainerName: "Priya Sharma", rating: 5, feedback: "Priya's yoga sessions are transformative. Best instructor I've had.", date: "2026-03-12" },
  { id: "r4", trainerId: "t2", trainerName: "Priya Sharma", rating: 5, feedback: "Incredibly patient and adapts every session to how I'm feeling.", date: "2026-03-08" },
  { id: "r5", trainerId: "t3", trainerName: "Marcus Johnson", rating: 4, feedback: "Marcus pushes you hard but knows your limits. Respect.", date: "2026-03-01" },
  { id: "r6", trainerId: "t3", trainerName: "Marcus Johnson", rating: 3, feedback: "Sometimes the HIIT pace is too intense for beginners.", date: "2026-02-28" },
  { id: "r7", trainerId: "t4", trainerName: "Elena Rodriguez", rating: 5, feedback: "Elena's CrossFit programming is the best. Never bored.", date: "2026-03-15" },
  { id: "r8", trainerId: "t5", trainerName: "David Park", rating: 4, feedback: "Solid powerlifting coach. Really knows his stuff.", date: "2026-02-20" },
];

export const bookings: Booking[] = [
  { id: "b1", memberId: "m1", trainerId: "t1", trainerName: "Chris Walker", date: "2026-03-19", time: "06:00", status: "confirmed" },
  { id: "b2", memberId: "m2", trainerId: "t1", trainerName: "Chris Walker", date: "2026-03-19", time: "07:00", status: "confirmed" },
  { id: "b3", memberId: "m3", trainerId: "t2", trainerName: "Priya Sharma", date: "2026-03-19", time: "08:30", status: "pending" },
  { id: "b4", memberId: "m4", trainerId: "t3", trainerName: "Marcus Johnson", date: "2026-03-20", time: "16:00", status: "confirmed" },
  { id: "b5", memberId: "m5", trainerId: "t2", trainerName: "Priya Sharma", date: "2026-03-20", time: "17:00", status: "confirmed" },
];

export const nutritionProfile: NutritionProfile = {
  age: 28,
  weight: 78,
  height: 178,
  fitnessGoal: "MUSCLE_GAIN",
  activityLevel: "ACTIVE",
  dietaryPreference: "NON_VEG",
  allergies: ["peanuts"],
  restrictions: ["no_pork"],
  completed: true,
};

export const mealPlan: MealPlan = {
  id: "mp1",
  date: "2026-03-18",
  totalCalories: 2650,
  totalProtein: 185,
  totalCarbs: 280,
  totalFat: 85,
  meals: [
    { type: "breakfast", name: "Protein Oat Bowl", description: "Rolled oats with whey protein, banana, almonds, and honey. Served with a glass of whole milk.", calories: 620, protein: 42, carbs: 72, fat: 18, completed: true },
    { type: "snack", name: "Greek Yogurt & Berries", description: "Full-fat Greek yogurt topped with mixed berries and a drizzle of maple syrup.", calories: 280, protein: 20, carbs: 32, fat: 8, completed: true },
    { type: "lunch", name: "Grilled Chicken Rice Bowl", description: "Herb-grilled chicken breast with brown rice, roasted vegetables, avocado, and tahini dressing.", calories: 750, protein: 52, carbs: 68, fat: 28, completed: false },
    { type: "snack", name: "Trail Mix & Protein Shake", description: "Handful of mixed nuts (no peanuts) and seeds with a chocolate whey protein shake.", calories: 380, protein: 35, carbs: 22, fat: 18, completed: false },
    { type: "dinner", name: "Salmon & Sweet Potato", description: "Baked salmon fillet with roasted sweet potato, steamed broccoli, and lemon butter sauce.", calories: 620, protein: 36, carbs: 86, fat: 13, completed: false },
  ],
};

export const kpiData: KPIData = {
  totalMembers: 248,
  activePlans: 212,
  revenue: 385000,
  expiringSoon: 18,
};

export const revenueData: RevenueData[] = [
  { month: "Oct", revenue: 42000, members: 210 },
  { month: "Nov", revenue: 45000, members: 218 },
  { month: "Dec", revenue: 38000, members: 205 },
  { month: "Jan", revenue: 52000, members: 230 },
  { month: "Feb", revenue: 48000, members: 238 },
  { month: "Mar", revenue: 55000, members: 248 },
];

export const trainerRatings = trainers.map(t => ({
  name: t.name.split(" ")[0],
  rating: t.rating,
  reviews: t.reviewCount,
}));

export const monthlyAttendance = [
  { week: "Week 1", present: 185, absent: 63 },
  { week: "Week 2", present: 192, absent: 56 },
  { week: "Week 3", present: 178, absent: 70 },
  { week: "Week 4", present: 201, absent: 47 },
];

export const planDistribution = [
  { name: "Monthly", value: 95, fill: "var(--chart-1)" },
  { name: "Quarterly", value: 78, fill: "var(--chart-2)" },
  { name: "Yearly", value: 75, fill: "var(--chart-3)" },
];

export function getMemberById(id: string): Member | undefined {
  return members.find(m => m.id === id);
}

export function getTrainerById(id: string): Trainer | undefined {
  return trainers.find(t => t.id === id);
}

export function getTrainerForMember(memberId: string): Trainer | undefined {
  const member = getMemberById(memberId);
  if (!member) return undefined;
  return getTrainerById(member.trainerId);
}

export function getWorkoutsForMember(memberId: string): WorkoutPlan[] {
  return workoutPlans.filter(w => w.memberId === memberId);
}

export function getSessionsForTrainer(trainerId: string): SessionLog[] {
  return sessionLogs.filter(s => s.trainerId === trainerId);
}

export function getReviewsForTrainer(trainerId: string): Review[] {
  return reviews.filter(r => r.trainerId === trainerId);
}

export function getMembersForTrainer(trainerId: string): Member[] {
  return members.filter(m => m.trainerId === trainerId);
}

export function getAttendanceForMember(memberId: string): AttendanceRecord[] {
  return attendance.filter(a => a.memberId === memberId);
}

export function getBookingsForMember(memberId: string): Booking[] {
  return bookings.filter(b => b.memberId === memberId);
}

export const availableTimeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "16:00", "17:00", "18:00", "19:00"
];
