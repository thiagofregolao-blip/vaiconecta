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
import bannersRouter from './routes/admin/banners';

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
app.use('/api/admin/banners', adminAuth, bannersRouter);

// Banners ativos para a landing page (público)
app.get('/api/banners', async (_req, res) => {
  const banners = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
  res.json(banners);
});

// Serve arquivos de upload
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password, role: 'SUPER_ADMIN' },
    create: { username, name: username, role: 'SUPER_ADMIN', password },
  });
  console.log(`Super admin pronto: ${username}`);
}

app.listen(PORT, async () => {
  console.log(`VaiConecta server rodando na porta ${PORT}`);
  await ensureDefaultAdmin();
});

export default app;
