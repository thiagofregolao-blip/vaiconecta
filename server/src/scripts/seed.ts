/**
 * Seed idempotente — criado pra rodar em todo deploy (prep-db + db push + seed + start).
 * Usa upsert em tudo, então pode ser executado N vezes sem duplicar.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 seed: garantindo dados iniciais...');

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

  // Super admin
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { role: 'SUPER_ADMIN' },
    create: { username: 'admin', password: adminPassword, role: 'SUPER_ADMIN' },
  });
  console.log('  ✓ super admin');

  // Planos Wi-Fi padrão
  await prisma.plan.createMany({
    skipDuplicates: true,
    data: [
      { name: '1 Hora', price: 3.0, hours: 1, maxDevices: 1 },
      { name: '24 Horas', price: 10.0, hours: 24, maxDevices: 2 },
      { name: '7 Dias', price: 35.0, hours: 168, maxDevices: 3 },
    ],
  });
  console.log('  ✓ planos Wi-Fi');

  // Loja inicial: LG Importados
  const lgStore = await prisma.store.upsert({
    where: { slug: 'lg-importados' },
    update: {},
    create: {
      name: 'LG Importados',
      slug: 'lg-importados',
      commissionPct: 10,
      themeColor: '#f97316',
      bannerGradient: 'from-rose-500 via-orange-500 to-amber-500',
      descricao: 'Produtos importados direto do Paraguai com os melhores preços.',
      isActive: true,
      isPremium: true,
      subscriptionStatus: 'ACTIVE',
    },
  });
  console.log('  ✓ Store LG Importados');

  // Admin da loja LG
  const storeAdminPassword = await bcrypt.hash(process.env.LG_ADMIN_PASSWORD || 'lg123', 10);
  await prisma.admin.upsert({
    where: { username: 'lg-importados' },
    update: { storeId: lgStore.id, role: 'STORE_ADMIN' },
    create: {
      username: 'lg-importados',
      name: 'LG Importados',
      password: storeAdminPassword,
      role: 'STORE_ADMIN',
      storeId: lgStore.id,
    },
  });
  console.log('  ✓ admin da loja LG');

  console.log('✓ seed concluído');
  console.log('  Super admin: admin / admin123');
  console.log('  Loja LG:     lg-importados / lg123');
}

main()
  .catch((err) => {
    console.error('✗ seed falhou:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
