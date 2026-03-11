import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { consultarPagamento } from '../services/mercadopago.service';
import { liberarAcesso } from '../services/mikrotik.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  // Responde imediatamente para o MP não reenviar
  res.status(200).send('OK');

  const { action, data } = req.body;

  if (action !== 'payment.updated' && action !== 'payment.created') return;
  if (!data?.id) return;

  try {
    const mpData = await consultarPagamento(String(data.id));

    if (mpData.status !== 'approved') return;

    const paymentId = mpData.external_reference;
    if (!paymentId) return;

    const pagamento = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });

    if (!pagamento || pagamento.status === 'APPROVED' || pagamento.status === 'ACTIVE') return;

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        mpPaymentId: String(mpData.id),
      },
    });

    await liberarAcesso(pagamento.macAddress, pagamento.plan.hours);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + pagamento.plan.hours * 60 * 60 * 1000);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'ACTIVE',
        startedAt: now,
        expiresAt,
      },
    });

    console.log(`[Webhook] Acesso liberado: ${pagamento.macAddress} por ${pagamento.plan.hours}h`);
  } catch (err) {
    console.error('[Webhook] Erro ao processar pagamento:', err);
  }
});

export default router;
