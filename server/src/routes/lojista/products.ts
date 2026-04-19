import { Router, Request, Response } from 'express';
import { Currency } from '@prisma/client';
import prisma from '../../lib/prisma';
import { getStoreId } from '../../middleware/lojistaAuth';
import { computeAllPrices } from '../../services/exchange.service';

const router = Router();

interface ProductInput {
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;
  moedaOriginal: Currency;
  precoOriginal: number;
  imagemUrl: string;
  produtoUrl?: string;
  ativo?: boolean;
  destaque?: boolean;
  ordem?: number;
  estoque?: number;
}

function validate(p: Partial<ProductInput>): string | null {
  if (!p.nome?.trim()) return 'nome é obrigatório';
  if (!p.imagemUrl?.trim()) return 'imagemUrl é obrigatório';
  if (!p.moedaOriginal || !['BRL', 'USD', 'PYG'].includes(p.moedaOriginal)) {
    return 'moedaOriginal inválida (BRL, USD ou PYG)';
  }
  if (typeof p.precoOriginal !== 'number' || p.precoOriginal <= 0) {
    return 'precoOriginal deve ser maior que zero';
  }
  return null;
}

// GET /api/lojista/products — lista produtos da loja
router.get('/', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const { search, categoria, ativo } = req.query;

  const products = await prisma.catalogProduct.findMany({
    where: {
      storeId,
      ...(search && { nome: { contains: String(search), mode: 'insensitive' } }),
      ...(categoria && { categoria: String(categoria) }),
      ...(ativo !== undefined && { ativo: ativo === 'true' }),
    },
    orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
  });

  res.json(products);
});

// POST /api/lojista/products — criar produto
router.post('/', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const body = req.body as ProductInput;

  const err = validate(body);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const prices = await computeAllPrices(body.precoOriginal, body.moedaOriginal);

  const product = await prisma.catalogProduct.create({
    data: {
      storeId,
      nome: body.nome.trim(),
      descricao: body.descricao,
      categoria: body.categoria,
      marca: body.marca,
      moedaOriginal: body.moedaOriginal,
      precoOriginal: body.precoOriginal,
      precoBrl: prices.precoBrl,
      precoUsd: prices.precoUsd,
      precoGs: prices.precoGs,
      imagemUrl: body.imagemUrl,
      produtoUrl: body.produtoUrl || null,
      ativo: body.ativo ?? true,
      destaque: body.destaque ?? false,
      ordem: body.ordem ?? 0,
      estoque: body.estoque,
      sourceType: 'manual',
    },
  });

  res.status(201).json(product);
});

// PUT /api/lojista/products/:id — atualizar produto
router.put('/:id', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const body = req.body as Partial<ProductInput>;

  const existing = await prisma.catalogProduct.findFirst({
    where: { id: req.params.id, storeId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Produto não encontrado' });
    return;
  }

  const moeda = body.moedaOriginal ?? existing.moedaOriginal;
  const preco = body.precoOriginal ?? existing.precoOriginal;
  const priceChanged =
    body.moedaOriginal !== undefined || body.precoOriginal !== undefined;

  const prices = priceChanged ? await computeAllPrices(preco, moeda) : null;

  const updated = await prisma.catalogProduct.update({
    where: { id: existing.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome.trim() }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.marca !== undefined && { marca: body.marca }),
      ...(body.imagemUrl !== undefined && { imagemUrl: body.imagemUrl }),
      ...(body.produtoUrl !== undefined && { produtoUrl: body.produtoUrl }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(body.destaque !== undefined && { destaque: body.destaque }),
      ...(body.ordem !== undefined && { ordem: body.ordem }),
      ...(body.estoque !== undefined && { estoque: body.estoque }),
      ...(priceChanged && {
        moedaOriginal: moeda,
        precoOriginal: preco,
        precoBrl: prices!.precoBrl,
        precoUsd: prices!.precoUsd,
        precoGs: prices!.precoGs,
      }),
    },
  });

  res.json(updated);
});

// DELETE /api/lojista/products/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const existing = await prisma.catalogProduct.findFirst({
    where: { id: req.params.id, storeId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Produto não encontrado' });
    return;
  }
  await prisma.catalogProduct.delete({ where: { id: existing.id } });
  res.json({ success: true });
});

// POST /api/lojista/products/bulk-delete — apaga vários
router.post('/bulk-delete', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids obrigatório' });
    return;
  }
  const { count } = await prisma.catalogProduct.deleteMany({
    where: { id: { in: ids }, storeId },
  });
  res.json({ deleted: count });
});

// POST /api/lojista/products/import — importação por Excel (array parseado no client)
router.post('/import', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const { products, replace } = req.body as {
    products: ProductInput[];
    replace?: boolean;
  };

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ error: 'products array obrigatório' });
    return;
  }

  if (replace) {
    await prisma.catalogProduct.deleteMany({ where: { storeId } });
  }

  let imported = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const err = validate(p);
    if (err) {
      errors.push({ index: i, error: err });
      continue;
    }
    try {
      const prices = await computeAllPrices(p.precoOriginal, p.moedaOriginal);
      await prisma.catalogProduct.create({
        data: {
          storeId,
          nome: p.nome.trim(),
          descricao: p.descricao,
          categoria: p.categoria,
          marca: p.marca,
          moedaOriginal: p.moedaOriginal,
          precoOriginal: p.precoOriginal,
          precoBrl: prices.precoBrl,
          precoUsd: prices.precoUsd,
          precoGs: prices.precoGs,
          imagemUrl: p.imagemUrl,
          produtoUrl: p.produtoUrl || null,
          ativo: p.ativo ?? true,
          sourceType: 'excel',
        },
      });
      imported++;
    } catch (e: any) {
      errors.push({ index: i, error: e.message || 'erro ao salvar' });
    }
  }

  res.json({ imported, errors });
});

export default router;
