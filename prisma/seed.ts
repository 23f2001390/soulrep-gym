import { PrismaClient, Role, PlanType, PlanStatus, Gender, Availability, Method, InvoiceStatus, BookingStatus, FitnessGoal, ActivityLevel, DietaryPreference, MealType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')
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

  console.log('Creating essential accounts...')
  
  // Create Owner
  const ownerPassword = await bcrypt.hash('owner123', 10)
  await prisma.user.create({
    data: {
      email: 'owner@soulrep.com',
      password: ownerPassword,
      role: Role.OWNER,
      name: 'SoulRep Owner',
    }
  })

  // Create Trainers
  const trainerData = [
    { id: 't1', name: 'Chris Evans', email: 'chris@soulrep.com', phone: '+91 98765 43210', specialization: 'Strength & Conditioning', rating: 5.0, reviewCount: 0, memberCount: 0, availability: Availability.AVAILABLE },
    { id: 't2', name: 'Diana Prince', email: 'diana@soulrep.com', phone: '+91 98765 43211', specialization: 'Yoga & Flexibility', rating: 5.0, reviewCount: 0, memberCount: 0, availability: Availability.AVAILABLE },
    { id: 't3', name: 'Marcus Aurelius', email: 'marcus@soulrep.com', phone: '+91 98765 43212', specialization: 'HIIT & Cardio', rating: 5.0, reviewCount: 0, memberCount: 0, availability: Availability.AVAILABLE },
    { id: 't4', name: 'Natasha Romanoff', email: 'natasha@soulrep.com', phone: '+91 98765 43213', specialization: 'CrossFit', rating: 5.0, reviewCount: 0, memberCount: 0, availability: Availability.AVAILABLE },
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
            schedule: {}, // Empty schedule for production start
          }
        }
      }
    })
  }

  console.log('Database cleared of mock users. Owner and 4 Trainers created successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
