const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting mock attendance records...');
  await prisma.attendanceRecord.deleteMany({
    where: {
      member: {
        user: {
          email: { endsWith: '@email.com' }
        }
      }
    }
  });

  console.log('Deleting mock bookings...');
  await prisma.booking.deleteMany({
    where: {
      member: {
        user: {
          email: { endsWith: '@email.com' }
        }
      }
    }
  });

  console.log('Deleting mock reviews...');
  await prisma.review.deleteMany({
    where: {
      member: {
        user: {
          email: { endsWith: '@email.com' }
        }
      }
    }
  });

  console.log('Deleting mock members...');
  await prisma.member.deleteMany({
    where: {
      user: {
        email: { endsWith: '@email.com' }
      }
    }
  });

  console.log('Deleting mock users...');
  await prisma.user.deleteMany({
    where: {
      email: { endsWith: '@email.com' }
    }
  });

  console.log('Mock data cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
