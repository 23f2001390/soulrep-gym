import { PrismaClient, Role, Availability } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing data (step-by-step)...')
  
  // Deleting in order to respect constraints without a single giant transaction
  await prisma.meal.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.nutritionProfile.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.sessionLog.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.member.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating production staff accounts...')
  
  // Create Owner
  const ownerPassword = await bcrypt.hash('owner123', 10)
  await prisma.user.create({
    data: {
      email: 'owner@soulrep.com',
      password: ownerPassword,
      role: Role.OWNER,
      name: 'Gym Owner',
    }
  })

  // Create Trainers (Trainer 1, Trainer 2, etc.)
  const trainerData = [
    { id: 't1', name: 'Trainer 1', email: 'trainer1@soulrep.com', phone: '+91 00000 00001', specialization: 'Strength & Conditioning' },
    { id: 't2', name: 'Trainer 2', email: 'trainer2@soulrep.com', phone: '+91 00000 00002', specialization: 'Yoga & Flexibility' },
    { id: 't3', name: 'Trainer 3', email: 'trainer3@soulrep.com', phone: '+91 00000 00003', specialization: 'HIIT & Cardio' },
    { id: 't4', name: 'Trainer 4', email: 'trainer4@soulrep.com', phone: '+91 00000 00004', specialization: 'CrossFit' },
  ]

  const trainerPassword = await bcrypt.hash('trainer123', 10)
  for (const t of trainerData) {
    await prisma.user.create({
      data: {
        id: t.id,
        email: t.email,
        password: trainerPassword,
        role: Role.TRAINER,
        name: t.name,
        phone: t.phone,
        Trainer: {
          create: {
            specialization: t.specialization,
            rating: 5.0,
            reviewCount: 0,
            memberCount: 0,
            availability: Availability.AVAILABLE,
            schedule: {
              'Monday': [{ start: '09:00', end: '18:00', type: 'available' }],
              'Tuesday': [{ start: '09:00', end: '18:00', type: 'available' }],
              'Wednesday': [{ start: '09:00', end: '18:00', type: 'available' }],
              'Thursday': [{ start: '09:00', end: '18:00', type: 'available' }],
              'Friday': [{ start: '09:00', end: '18:00', type: 'available' }],
              'Saturday': [{ start: '09:00', end: '13:00', type: 'available' }]
            }, 
          }
        }
      }
    })
  }

  console.log('Production database ready. Owner and 4 Trainers created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
