import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface LojistaPayload {
  adminId: string;
  username: string;
  role: 'STORE_ADMIN' | 'SUPER_ADMIN';
  storeId: string | null;
}

export function lojistaAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não informado' });
    return;
  }
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as LojistaPayload;

    // Super admin pode agir como qualquer lojista via ?as=<storeId>
    if (payload.role === 'SUPER_ADMIN') {
      const asStore = (req.query.as as string) || req.headers['x-as-store'] as string;
      if (asStore) {
        (req as any).lojista = { ...payload, storeId: asStore, actingAs: true };
        next();
        return;
      }
    }

    if (payload.role !== 'STORE_ADMIN' && payload.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso restrito a lojistas' });
      return;
    }

    if (!payload.storeId) {
      res.status(403).json({ error: 'Admin sem loja vinculada' });
      return;
    }

    (req as any).lojista = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function getStoreId(req: Request): string {
  const lojista = (req as any).lojista as LojistaPayload;
  if (!lojista?.storeId) throw new Error('storeId ausente no token');
  return lojista.storeId;
}
