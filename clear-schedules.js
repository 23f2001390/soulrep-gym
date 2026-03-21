const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing mock schedules from all trainers...');
  
  // We want to clear the 'schedule' JSON object to basically be empty arrays for all days
  const emptySchedule = {
    "Monday": [],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": []
  };

  const trainers = await prisma.trainer.findMany();
  for (const t of trainers) {
    await prisma.trainer.update({
      where: { id: t.id },
      data: {
        schedule: emptySchedule
      }
    });
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
