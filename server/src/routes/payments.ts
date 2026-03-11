import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { criarPagamentoPix } from '../services/mercadopago.service';
import { liberarAcesso } from '../services/mikrotik.service';

const router = Router();

// Criar pagamento Pix
router.post('/', async (req: Request, res: Response) => {
  const { planId, macAddress, email, deviceIp } = req.body;

  if (!planId || !macAddress || !email) {
    res.status(400).json({ error: 'planId, macAddress e email são obrigatórios' });
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId, active: true } });
  if (!plan) {
    res.status(404).json({ error: 'Plano não encontrado' });
    return;
  }

  const pagamento = await prisma.payment.create({
    data: { planId, macAddress, email, deviceIp, status: 'PENDING' },
  });

  try {
    const pix = await criarPagamentoPix({
      planName: plan.name,
      price: plan.price,
      email,
      paymentId: pagamento.id,
    });

    const updated = await prisma.payment.update({
      where: { id: pagamento.id },
      data: {
        mpPaymentId: pix.mpPaymentId,
        pixQrCode: pix.pixQrCode,
        pixQrCodeBase64: pix.pixQrCodeBase64,
      },
    });

    res.json({
      paymentId: updated.id,
      pixQrCode: updated.pixQrCode,
      pixQrCodeBase64: updated.pixQrCodeBase64,
      price: plan.price,
      planName: plan.name,
    });
  } catch (err) {
    await prisma.payment.update({ where: { id: pagamento.id }, data: { status: 'CANCELLED' } });
    console.error('[Payments] Erro ao criar Pix:', err);
    res.status(500).json({ error: 'Erro ao gerar pagamento Pix' });
  }
});

// Status do pagamento (polling)
router.get('/:id/status', async (req: Request, res: Response) => {
  const pagamento = await prisma.payment.findUnique({
    where: { id: req.params.id },
    select: { status: true, expiresAt: true, startedAt: true },
  });

  if (!pagamento) {
    res.status(404).json({ error: 'Pagamento não encontrado' });
    return;
  }

  res.json(pagamento);
});

// Resgatar voucher
router.post('/voucher', async (req: Request, res: Response) => {
  const { code, macAddress, deviceIp } = req.body;

  if (!code || !macAddress) {
    res.status(400).json({ error: 'code e macAddress são obrigatórios' });
    return;
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { plan: true },
  });

  if (!voucher || voucher.usedBy) {
    res.status(400).json({ error: 'Voucher inválido ou já utilizado' });
    return;
  }

  await liberarAcesso(macAddress, voucher.plan.hours);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + voucher.plan.hours * 60 * 60 * 1000);

  await prisma.voucher.update({
    where: { id: voucher.id },
    data: { usedBy: macAddress, usedAt: now },
  });

  const pagamento = await prisma.payment.create({
    data: {
      planId: voucher.planId,
      macAddress,
      deviceIp,
      email: 'voucher@vaiconecta.com.br',
      status: 'ACTIVE',
      startedAt: now,
      expiresAt,
    },
  });

  res.json({ success: true, expiresAt, paymentId: pagamento.id });
});

export default router;
