import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Planos públicos (para Landing Page)
router.get('/', async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
    select: { id: true, name: true, price: true, hours: true, maxDevices: true },
  });
  res.json(plans);
});

export default router;
