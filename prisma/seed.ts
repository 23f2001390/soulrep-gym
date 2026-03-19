import { PrismaClient, Role, PlanType, PlanStatus, Gender, Availability, Method, InvoiceStatus, BookingStatus, FitnessGoal, ActivityLevel, DietaryPreference, MealType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function makeSchedule(): any {
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const slots = [
    { start: '06:00', end: '07:00', type: 'session', memberId: 'm1', memberName: 'Alex Carter' },
    { start: '07:00', end: '08:00', type: 'session', memberId: 'm2', memberName: 'Jordan Lee' },
    { start: '08:00', end: '08:30', type: 'break' },
    { start: '08:30', end: '09:30', type: 'available' },
    { start: '09:30', end: '10:30', type: 'session', memberId: 'm3', memberName: 'Sam Rivera' },
    { start: '10:30', end: '11:30', type: 'available' },
    { start: '16:00', end: '17:00', type: 'session', memberId: 'm4', memberName: 'Taylor Kim' },
    { start: '17:00', end: '18:00', type: 'session', memberId: 'm5', memberName: 'Morgan Chen' },
    { start: '18:00', end: '19:00', type: 'available' },
  ]
  const schedule: any = {}
  for (const day of days) {
    schedule[day] = day === 'Saturday' ? slots.slice(0, 4) : slots
  }
  return schedule
}

async function main() {
  await prisma.$transaction([
    prisma.meal.deleteMany(),
    prisma.mealPlan.deleteMany(),
    prisma.nutritionProfile.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.review.deleteMany(),
    prisma.sessionLog.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.workoutPlan.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.member.deleteMany(),
    prisma.trainer.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const ownerPassword = await bcrypt.hash('owner123', 10)
  await prisma.user.create({
    data: {
      email: 'owner@soulrep.com',
      password: ownerPassword,
      role: Role.OWNER,
      name: 'Gym Owner',
    }
  })

  const trainerData = [
    { id: 't1', name: 'Chris Walker', email: 'chris@soulrep.com', phone: '+1-555-0101', specialization: 'Strength & Conditioning', rating: 4.8, reviewCount: 47, memberCount: 12, availability: Availability.AVAILABLE },
    { id: 't2', name: 'Priya Sharma', email: 'priya@soulrep.com', phone: '+1-555-0102', specialization: 'Yoga & Flexibility', rating: 4.9, reviewCount: 63, memberCount: 15, availability: Availability.AVAILABLE },
    { id: 't3', name: 'Marcus Johnson', email: 'marcus@soulrep.com', phone: '+1-555-0103', specialization: 'HIIT & Cardio', rating: 4.6, reviewCount: 31, memberCount: 10, availability: Availability.BUSY },
    { id: 't4', name: 'Elena Rodriguez', email: 'elena@soulrep.com', phone: '+1-555-0104', specialization: 'CrossFit', rating: 4.7, reviewCount: 28, memberCount: 8, availability: Availability.AVAILABLE },
    { id: 't5', name: 'David Park', email: 'david@soulrep.com', phone: '+1-555-0105', specialization: 'Powerlifting', rating: 4.5, reviewCount: 22, memberCount: 6, availability: Availability.OFF },
    { id: 't6', name: 'James Wilson', email: 'james@soulrep.com', phone: '+1-555-0106', specialization: 'Bodybuilding', rating: 4.9, reviewCount: 55, memberCount: 20, availability: Availability.AVAILABLE },
    { id: 't7', name: 'Sarah Miller', email: 'sarah@soulrep.com', phone: '+1-555-0107', specialization: 'Weight Loss', rating: 4.7, reviewCount: 42, memberCount: 14, availability: Availability.AVAILABLE },
    { id: 't8', name: 'Robert Brown', email: 'robert@soulrep.com', phone: '+1-555-0108', specialization: 'Boxing & MMA', rating: 4.6, reviewCount: 38, memberCount: 11, availability: Availability.AVAILABLE },
    { id: 't9', name: 'Emma Davis', email: 'emma@soulrep.com', phone: '+1-555-0109', specialization: 'Pilates', rating: 4.8, reviewCount: 29, memberCount: 9, availability: Availability.AVAILABLE },
    { id: 't10', name: 'Michael Clark', email: 'michael@soulrep.com', phone: '+1-555-0110', specialization: 'Mobility & Rehab', rating: 4.9, reviewCount: 61, memberCount: 18, availability: Availability.AVAILABLE },
  ]

  for (const t of trainerData) {
    const pw = await bcrypt.hash('trainer123', 10)
    await prisma.user.create({
      data: {
        id: t.id,
        email: t.email,
        password: pw,
        role: Role.TRAINER,
        name: t.name,
        phone: t.phone,
        Trainer: {
          create: {
            specialization: t.specialization,
            rating: t.rating,
            reviewCount: t.reviewCount,
            memberCount: t.memberCount,
            availability: t.availability,
            schedule: makeSchedule(),
          }
        }
      }
    })
  }

  const memberData = [
    { id: 'm1', name: 'Alex Carter', email: 'alex@email.com', phone: '+1-555-1001', joinDate: '2025-06-15', plan: PlanType.YEARLY, planExpiry: '2026-06-15', planStatus: PlanStatus.ACTIVE, trainerId: 't1', healthNotes: 'Mild lower back stiffness. Prefers morning sessions.', attendanceCount: 142, sessionsRemaining: 24, age: 28, gender: Gender.MALE },
    { id: 'm2', name: 'Jordan Lee', email: 'jordan@email.com', phone: '+1-555-1002', joinDate: '2025-09-01', plan: PlanType.QUARTERLY, planExpiry: '2026-03-01', planStatus: PlanStatus.EXPIRING, trainerId: 't1', healthNotes: 'No issues noted.', attendanceCount: 67, sessionsRemaining: 8, age: 32, gender: Gender.FEMALE },
    { id: 'm3', name: 'Sam Rivera', email: 'sam@email.com', phone: '+1-555-1003', joinDate: '2025-11-20', plan: PlanType.MONTHLY, planExpiry: '2026-04-20', planStatus: PlanStatus.ACTIVE, trainerId: 't2', healthNotes: 'Recovering from shoulder injury. Light upper body only.', attendanceCount: 34, sessionsRemaining: 12, age: 25, gender: Gender.MALE },
    { id: 'm4', name: 'Taylor Kim', email: 'taylor@email.com', phone: '+1-555-1004', joinDate: '2025-03-10', plan: PlanType.YEARLY, planExpiry: '2026-03-10', planStatus: PlanStatus.EXPIRING, trainerId: 't3', healthNotes: 'Asthma—needs warm-up time.', attendanceCount: 198, sessionsRemaining: 30, age: 29, gender: Gender.FEMALE },
    { id: 'm5', name: 'Morgan Chen', email: 'morgan@email.com', phone: '+1-555-1005', joinDate: '2026-01-05', plan: PlanType.MONTHLY, planExpiry: '2026-04-05', planStatus: PlanStatus.ACTIVE, trainerId: 't2', healthNotes: '', attendanceCount: 22, sessionsRemaining: 6, age: 35, gender: Gender.MALE },
    { id: 'm6', name: 'Casey Brooks', email: 'casey@email.com', phone: '+1-555-1006', joinDate: '2025-07-22', plan: PlanType.QUARTERLY, planExpiry: '2026-01-22', planStatus: PlanStatus.EXPIRED, trainerId: 't4', healthNotes: 'Knee brace recommended during squats.', attendanceCount: 89, sessionsRemaining: 0, age: 27, gender: Gender.FEMALE },
    { id: 'm7', name: 'Riley Nguyen', email: 'riley@email.com', phone: '+1-555-1007', joinDate: '2025-12-01', plan: PlanType.MONTHLY, planExpiry: '2026-05-01', planStatus: PlanStatus.ACTIVE, trainerId: 't3', healthNotes: '', attendanceCount: 45, sessionsRemaining: 10, age: 23, gender: Gender.OTHER },
    { id: 'm8', name: 'Quinn Foster', email: 'quinn@email.com', phone: '+1-555-1008', joinDate: '2025-10-15', plan: PlanType.YEARLY, planExpiry: '2026-10-15', planStatus: PlanStatus.ACTIVE, trainerId: 't1', healthNotes: 'Diabetic—carries glucose tabs.', attendanceCount: 112, sessionsRemaining: 40, age: 41, gender: Gender.MALE },
    { id: 'm9', name: 'Avery Scott', email: 'avery@email.com', phone: '+1-555-1009', joinDate: '2026-02-01', plan: PlanType.MONTHLY, planExpiry: '2026-05-01', planStatus: PlanStatus.ACTIVE, trainerId: 't4', healthNotes: 'First time gym member.', attendanceCount: 15, sessionsRemaining: 8, age: 19, gender: Gender.FEMALE },
    { id: 'm10', name: 'Drew Patel', email: 'drew@email.com', phone: '+1-555-1010', joinDate: '2025-08-18', plan: PlanType.QUARTERLY, planExpiry: '2026-05-18', planStatus: PlanStatus.ACTIVE, trainerId: 't2', healthNotes: 'Vegetarian. Interested in nutrition coaching.', attendanceCount: 76, sessionsRemaining: 15, age: 30, gender: Gender.MALE },
  ]

  for (const m of memberData) {
    const pw = await bcrypt.hash('member123', 10)
    await prisma.user.create({
      data: {
        id: m.id,
        email: m.email,
        password: pw,
        role: Role.MEMBER,
        name: m.name,
        phone: m.phone,
        Member: {
          create: {
            joinDate: new Date(m.joinDate),
            plan: m.plan,
            planExpiry: new Date(m.planExpiry),
            planStatus: m.planStatus,
            trainerId: m.trainerId,
            healthNotes: m.healthNotes,
            attendanceCount: m.attendanceCount,
            sessionsRemaining: m.sessionsRemaining,
            age: m.age,
            gender: m.gender,
          }
        }
      }
    })
  }

  const attendanceData = [
    { id: 'a1', memberId: 'm1', date: '2026-03-18', checkIn: '06:15', checkOut: '07:45', method: Method.QR },
    { id: 'a2', memberId: 'm2', date: '2026-03-18', checkIn: '07:00', checkOut: '08:30', method: Method.QR },
    { id: 'a3', memberId: 'm3', date: '2026-03-18', checkIn: '08:45', checkOut: '10:00', method: Method.MANUAL },
    { id: 'a4', memberId: 'm4', date: '2026-03-18', checkIn: '16:10', checkOut: undefined, method: Method.QR },
    { id: 'a5', memberId: 'm5', date: '2026-03-18', checkIn: '17:05', checkOut: '18:30', method: Method.QR },
    { id: 'a6', memberId: 'm7', date: '2026-03-18', checkIn: '09:00', checkOut: '10:15', method: Method.QR },
    { id: 'a7', memberId: 'm8', date: '2026-03-18', checkIn: '06:00', checkOut: '07:30', method: Method.MANUAL },
    { id: 'a8', memberId: 'm1', date: '2026-03-17', checkIn: '06:20', checkOut: '07:50', method: Method.QR },
    { id: 'a9', memberId: 'm3', date: '2026-03-17', checkIn: '09:00', checkOut: '10:10', method: Method.QR },
    { id: 'a10', memberId: 'm4', date: '2026-03-17', checkIn: '16:00', checkOut: '17:15', method: Method.QR },
    { id: 'a11', memberId: 'm9', date: '2026-03-17', checkIn: '10:00', checkOut: '11:00', method: Method.MANUAL },
    { id: 'a12', memberId: 'm10', date: '2026-03-17', checkIn: '07:30', checkOut: '09:00', method: Method.QR },
    { id: 'a13', memberId: 'm2', date: '2026-03-16', checkIn: '07:15', checkOut: '08:30', method: Method.QR },
    { id: 'a14', memberId: 'm5', date: '2026-03-16', checkIn: '17:00', checkOut: '18:20', method: Method.QR },
    { id: 'a15', memberId: 'm6', date: '2026-03-16', checkIn: '08:00', checkOut: '09:15', method: Method.MANUAL },
  ]
  for (const a of attendanceData) {
    await prisma.attendanceRecord.create({
      data: {
        id: a.id,
        memberId: a.memberId,
        date: new Date(a.date),
        checkIn: a.checkIn,
        checkOut: a.checkOut ?? null,
        method: a.method
      }
    })
  }

  const invoiceData = [
    { id: 'inv1', memberId: 'm1', plan: PlanType.YEARLY, amount: 12000, date: '2025-06-15', status: InvoiceStatus.PAID },
    { id: 'inv2', memberId: 'm2', plan: PlanType.QUARTERLY, amount: 4500, date: '2025-09-01', status: InvoiceStatus.PAID },
    { id: 'inv3', memberId: 'm3', plan: PlanType.MONTHLY, amount: 1800, date: '2026-02-20', status: InvoiceStatus.PAID },
    { id: 'inv4', memberId: 'm4', plan: PlanType.YEARLY, amount: 12000, date: '2025-03-10', status: InvoiceStatus.PAID },
    { id: 'inv5', memberId: 'm5', plan: PlanType.MONTHLY, amount: 1800, date: '2026-03-05', status: InvoiceStatus.PENDING },
    { id: 'inv6', memberId: 'm6', plan: PlanType.QUARTERLY, amount: 4500, date: '2025-07-22', status: InvoiceStatus.OVERDUE },
    { id: 'inv7', memberId: 'm7', plan: PlanType.MONTHLY, amount: 1800, date: '2026-03-01', status: InvoiceStatus.PAID },
    { id: 'inv8', memberId: 'm8', plan: PlanType.YEARLY, amount: 12000, date: '2025-10-15', status: InvoiceStatus.PAID },
    { id: 'inv9', memberId: 'm9', plan: PlanType.MONTHLY, amount: 1800, date: '2026-02-01', status: InvoiceStatus.PAID },
    { id: 'inv10', memberId: 'm10', plan: PlanType.QUARTERLY, amount: 4500, date: '2025-11-18', status: InvoiceStatus.PAID },
  ]
  for (const inv of invoiceData) {
    await prisma.invoice.create({
      data: {
        id: inv.id,
        memberId: inv.memberId,
        plan: inv.plan,
        amount: inv.amount,
        date: new Date(inv.date),
        status: inv.status
      }
    })
  }

  const workoutPlanData = [
    { id: 'wp1', memberId: 'm1', trainerId: 't1', day: 'Monday', notes: 'Focus on depth for squats. Light RDLs—watch lower back.', exercises: [{ name: 'Barbell Squat', sets: 4, reps: '8-10', rest: '90s' }, { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '90s' }, { name: 'Leg Press', sets: 3, reps: '12-15', rest: '60s' }, { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '60s' }, { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '45s' }] },
    { id: 'wp2', memberId: 'm1', trainerId: 't1', day: 'Wednesday', notes: 'Increase bench weight by 2.5kg if 10 reps is clean.', exercises: [{ name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s' }, { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '60s' }, { name: 'Cable Fly', sets: 3, reps: '12-15', rest: '60s' }, { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15', rest: '45s' }, { name: 'Lateral Raises', sets: 4, reps: '15', rest: '45s' }] },
    { id: 'wp3', memberId: 'm1', trainerId: 't1', day: 'Friday', notes: 'Assisted pull-ups ok. No ego lifting on rows.', exercises: [{ name: 'Pull-ups', sets: 4, reps: '6-8', rest: '90s' }, { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '90s' }, { name: 'Seated Cable Row', sets: 3, reps: '12', rest: '60s' }, { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '45s' }, { name: 'Barbell Curl', sets: 3, reps: '12', rest: '45s' }] },
  ]
  for (const wp of workoutPlanData) {
    await prisma.workoutPlan.create({
      data: { id: wp.id, memberId: wp.memberId, trainerId: wp.trainerId, day: wp.day, notes: wp.notes, exercises: { create: wp.exercises } }
    })
  }

  const sessionLogData = [
    { id: 'sl1', memberId: 'm1', trainerId: 't1', date: '2026-03-18', duration: 60, exercises: ['Barbell Squat','Romanian Deadlift'], notes: 'Good session. Squat depth improving.', completed: true },
    { id: 'sl2', memberId: 'm2', trainerId: 't1', date: '2026-03-18', duration: 45, exercises: ['Goblet Squat','Hip Thrust'], notes: 'First time doing hip thrusts.', completed: true },
  ]
  for (const s of sessionLogData) {
    await prisma.sessionLog.create({
      data: { id: s.id, memberId: s.memberId, trainerId: s.trainerId, date: new Date(s.date), duration: s.duration, exercises: s.exercises, notes: s.notes, completed: s.completed }
    })
  }

  const reviewData = [
    { id: 'r1', trainerId: 't1', rating: 5, feedback: 'Chris is incredibly knowledgeable.', date: '2026-03-10', memberId: 'm1' },
    { id: 'r2', trainerId: 't1', rating: 4, feedback: 'Great trainer.', date: '2026-03-05', memberId: 'm2' },
  ]
  for (const r of reviewData) {
    await prisma.review.create({
      data: { id: r.id, trainerId: r.trainerId, memberId: r.memberId, rating: r.rating, feedback: r.feedback, date: new Date(r.date) }
    })
  }

  const bookingData = [
    { id: 'b1', memberId: 'm1', trainerId: 't1', date: '2026-03-19', time: '06:00', status: BookingStatus.CONFIRMED },
    { id: 'b2', memberId: 'm2', trainerId: 't1', date: '2026-03-19', time: '07:00', status: BookingStatus.CONFIRMED },
  ]
  for (const b of bookingData) {
    await prisma.booking.create({
      data: { id: b.id, memberId: b.memberId, trainerId: b.trainerId, date: new Date(b.date), time: b.time, status: b.status }
    })
  }

  await prisma.nutritionProfile.create({
    data: { memberId: 'm1', age: 28, weight: 78, height: 178, fitnessGoal: FitnessGoal.MUSCLE_GAIN, activityLevel: ActivityLevel.ACTIVE, dietaryPreference: DietaryPreference.NON_VEG, allergies: ['peanuts'], restrictions: ['no_pork'], completed: true }
  })

  await prisma.mealPlan.create({
    data: { id: 'mp1', memberId: 'm1', date: new Date('2026-03-18'), totalCalories: 2650, totalProtein: 185, totalCarbs: 280, totalFat: 85, meals: { create: [{ type: MealType.BREAKFAST, name: 'Protein Oat Bowl', description: 'Rolled oats with whey protein.', calories: 620, protein: 42, carbs: 72, fat: 18, completed: true }] } }
  })

  console.log('Database seeded successfully with 10 real trainers')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })