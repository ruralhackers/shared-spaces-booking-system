import { client as prisma } from './client'

async function main() {
  console.log('Seeding database...')
  console.log('No seed data — create spaces via the admin panel.')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
