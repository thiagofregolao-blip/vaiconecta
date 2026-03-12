import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Lista todas as lojas (super admin)
router.get('/', async (_req: Request, res: Response) => {
  const stores = await prisma.store.findMany({
    include: {
      admins: { select: { id: true, username: true, name: true, email: true } },
      accessPoints: true,
      _count: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(stores);
});

// Criar loja
router.post('/', async (req: Request, res: Response) => {
  const { name, commissionPct } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name é obrigatório' });
    return;
  }
  const store = await prisma.store.create({
    data: { name, commissionPct: Number(commissionPct) || 10 },
  });
  res.status(201).json(store);
});

// Atualizar loja
router.put('/:id', async (req: Request, res: Response) => {
  const { name, commissionPct } = req.body;
  const store = await prisma.store.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(commissionPct !== undefined && { commissionPct: Number(commissionPct) }),
    },
  });
  res.json(store);
});

// Deletar loja
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.store.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Adicionar AP à loja
router.post('/:id/aps', async (req: Request, res: Response) => {
  const { name, apMac } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name é obrigatório' });
    return;
  }
  const ap = await prisma.accessPoint.create({
    data: { name, apMac: apMac || null, storeId: req.params.id },
  });
  res.status(201).json(ap);
});

// Remover AP
router.delete('/:id/aps/:apId', async (req: Request, res: Response) => {
  await prisma.accessPoint.delete({ where: { id: req.params.apId } });
  res.json({ success: true });
});

// Dashboard da loja (para store admin)
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const storeId = req.params.id;

  // Store admin só pode ver sua própria loja
  if (admin.role === 'STORE_ADMIN' && admin.storeId !== storeId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { accessPoints: true },
  });

  if (!store) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }

  const apMacs = store.accessPoints.map((ap) => ap.apMac).filter(Boolean) as string[];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const mesInicio = new Date();
  mesInicio.setDate(1);
  mesInicio.setHours(0, 0, 0, 0);

  // Pagamentos via APs dessa loja
  const whereAp = apMacs.length > 0 ? { apMac: { in: apMacs } } : { id: 'none' };

  const [totalHoje, totalMes, pagamentosRecentes] = await Promise.all([
    prisma.payment.count({ where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] }, createdAt: { gte: hoje } } }),
    prisma.payment.count({ where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] }, createdAt: { gte: mesInicio } } }),
    prisma.payment.findMany({
      where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] } },
      include: { plan: { select: { name: true, price: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  // Receita total via SQL
  const receitaResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM "Payment" pay
    JOIN "Plan" p ON pay."planId" = p.id
    WHERE pay.status IN ('ACTIVE', 'APPROVED')
    AND pay."apMac" = ANY(${apMacs})
  `;

  const receitaTotal = Number(receitaResult[0]?.total ?? 0);
  const comissao = receitaTotal * (store.commissionPct / 100);

  const receitaMesResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM "Payment" pay
    JOIN "Plan" p ON pay."planId" = p.id
    WHERE pay.status IN ('ACTIVE', 'APPROVED')
    AND pay."apMac" = ANY(${apMacs})
    AND pay."createdAt" >= ${mesInicio}
  `;

  const receitaMes = Number(receitaMesResult[0]?.total ?? 0);

  res.json({
    store: { id: store.id, name: store.name, commissionPct: store.commissionPct },
    accessPoints: store.accessPoints,
    stats: {
      totalHoje,
      totalMes,
      receitaTotal,
      receitaMes,
      comissaoTotal: comissao,
      comissaoMes: receitaMes * (store.commissionPct / 100),
    },
    pagamentosRecentes,
  });
});

export default router;
