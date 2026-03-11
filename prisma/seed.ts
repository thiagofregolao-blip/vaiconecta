import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password },
  });

  await prisma.plan.createMany({
    skipDuplicates: true,
    data: [
      { name: '1 Hora', price: 3.0, hours: 1, maxDevices: 1 },
      { name: '24 Horas', price: 10.0, hours: 24, maxDevices: 2 },
      { name: '7 Dias', price: 35.0, hours: 168, maxDevices: 3 },
    ],
  });

  console.log('Seed concluído. Admin: admin / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
