import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database records...');

  // Delete all records in dependent order
  await prisma.workflowAudit.deleteMany({});
  await prisma.queueItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingService.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.packageService.deleteMany({});
  await prisma.servicePackage.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.loyaltyAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('Database cleaned successfully. Zero dummy data remaining.');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
