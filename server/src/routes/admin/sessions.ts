import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { listarSessoesAtivas, listarAPs, testarConexao } from '../../services/mikrotik.service';

const router = Router();

// Sessões ativas no MikroTik
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const sessions = await listarSessoesAtivas();
    res.json(sessions);
  } catch (err) {
    res.status(503).json({ error: 'Não foi possível conectar ao MikroTik', sessions: [] });
  }
});

// Pagamentos ativos no banco
router.get('/payments', async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;

  const where = status ? { status: status as any } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { plan: { select: { name: true, hours: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ payments, total, page: Number(page), limit: Number(limit) });
});

// Status MikroTik
router.get('/mikrotik/status', async (_req: Request, res: Response) => {
  const online = await testarConexao();
  res.json({ online });
});

// Lista APs
router.get('/mikrotik/aps', async (_req: Request, res: Response) => {
  try {
    const aps = await listarAPs();
    res.json(aps);
  } catch {
    res.json([]);
  }
});

// Estatísticas do dashboard
router.get('/stats', async (_req: Request, res: Response) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [totalAtivos, totalHoje, totalPlanos] = await Promise.all([
    prisma.payment.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.count({ where: { createdAt: { gte: hoje } } }),
    prisma.plan.count({ where: { active: true } }),
  ]);

  const receitaResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM "Payment" pay
    JOIN "Plan" p ON pay."planId" = p.id
    WHERE pay.status IN ('ACTIVE', 'APPROVED')
    AND pay."createdAt" >= ${hoje}
  `;

  res.json({
    totalAtivos,
    totalHoje,
    receitaHoje: Number(receitaResult[0]?.total ?? 0),
    totalPlanos,
  });
});

export default router;
