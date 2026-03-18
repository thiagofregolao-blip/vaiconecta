import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const N8N_WEBHOOK = 'https://agrofarmdigital.app.n8n.cloud/webhook/vai-de-busca';

// GET /api/search/catalog?q=iphone&limit=10  — chamado pelo n8n
router.get('/catalog', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

  if (!q) return res.json({ products: [] });

  const words = q.split(/\s+/).filter(w => w.length > 1);
  const products = await prisma.catalogProduct.findMany({
    where: {
      OR: words.map(w => ({
        nome: { contains: w, mode: 'insensitive' as const },
      })),
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  // Mapeia para snake_case que o SearchModal espera
  res.json({
    products: products.map(p => ({
      nome: p.nome,
      imagem_url: p.imagemUrl,
      produto_url: p.produtoUrl,
      preco_numerico: p.precoBrl ?? p.precoUsd ?? 0,
      loja: p.loja,
    })),
  });
});

// POST /api/search — chamado pelo frontend, repassa ao n8n
router.post('/', async (req: Request, res: Response) => {
  const { query, history } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query obrigatório' });
  }

  try {
    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), history: Array.isArray(history) ? history : [] }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('n8n error:', response.status, text);
      return res.status(502).json({ error: 'Erro ao buscar produtos' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('search error:', err);
    res.status(502).json({ error: 'Timeout ou erro de conexão' });
  }
});

export default router;
