import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { adminAuth } from './middleware/adminAuth';

import webhookRouter from './routes/webhook';
import plansRouter from './routes/plans';
import paymentsRouter from './routes/payments';

import authAdminRouter from './routes/admin/auth';
import adminPlansRouter from './routes/admin/plans';
import sessionsRouter from './routes/admin/sessions';
import vouchersRouter from './routes/admin/vouchers';

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

// Health check para Railway
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Webhook Mercado Pago (público)
app.use('/webhook/mercadopago', webhookRouter);

// Rotas públicas
app.use('/api/plans', plansRouter);
app.use('/api/payments', paymentsRouter);

// Auth admin
app.use('/api/admin', authAdminRouter);

// Rotas admin protegidas
app.use('/api/admin/plans', adminAuth, adminPlansRouter);
app.use('/api/admin/sessions', adminAuth, sessionsRouter);
app.use('/api/admin/vouchers', adminAuth, vouchersRouter);

// Serve frontend React (produção)
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 VaiConecta server rodando na porta ${PORT}`);
});

export default app;
