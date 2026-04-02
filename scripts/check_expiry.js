const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const in7days = new Date(now)
  in7days.setDate(now.getDate() + 7)
  
  console.log('Now:', now.toISOString())
  console.log('In 7 Days:', in7days.toISOString())
  
  const allMembers = await prisma.member.findMany({
      include: { user: { select: { name: true } } }
  })
  
  console.log('\nAll Members Expiry Dates:')
  allMembers.forEach(m => {
      console.log(`- ${m.user.name}: ${m.planExpiry.toISOString()} (Status: ${m.planStatus})`)
  })

  const expiring = await prisma.member.findMany({
    where: { planExpiry: { gte: now, lte: in7days } }
  })
  
  console.log('\nExpiring within 7 days count:', expiring.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
