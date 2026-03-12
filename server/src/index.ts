import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import { adminAuth } from './middleware/adminAuth';
import prisma from './lib/prisma';

import webhookRouter from './routes/webhook';
import plansRouter from './routes/plans';
import paymentsRouter from './routes/payments';

import authAdminRouter from './routes/admin/auth';
import adminPlansRouter from './routes/admin/plans';
import sessionsRouter from './routes/admin/sessions';
import vouchersRouter from './routes/admin/vouchers';
import storesRouter from './routes/admin/stores';
import usersRouter from './routes/admin/users';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/webhook/mercadopago', webhookRouter);

app.use('/api/plans', plansRouter);
app.use('/api/payments', paymentsRouter);

app.use('/api/admin', authAdminRouter);

app.use('/api/admin/plans', adminAuth, adminPlansRouter);
app.use('/api/admin/sessions', adminAuth, sessionsRouter);
app.use('/api/admin/vouchers', adminAuth, vouchersRouter);
app.use('/api/admin/stores', adminAuth, storesRouter);
app.use('/api/admin/users', adminAuth, usersRouter);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

async function ensureDefaultAdmin() {
  const count = await prisma.admin.count();
  if (count === 0) {
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await prisma.admin.create({
      data: { username: 'admin', name: 'Administrador', role: 'SUPER_ADMIN', password },
    });
    console.log('Super admin criado: admin / ' + (process.env.ADMIN_PASSWORD || 'admin123'));
  }
}

app.listen(PORT, async () => {
  console.log(`VaiConecta server rodando na porta ${PORT}`);
  await ensureDefaultAdmin();
});

export default app;
