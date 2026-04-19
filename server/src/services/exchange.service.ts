import axios from 'axios';
import prisma from '../lib/prisma';
import { Currency } from '@prisma/client';

const CACHE_HOURS = 1;
const AWESOME_BASE = 'https://economia.awesomeapi.com.br/last';

type Pair = `${Currency}-${Currency}`;

// Pares canônicos que buscamos na API. Inversos são calculados (1/taxa).
const CANONICAL_PAIRS: Pair[] = ['USD-BRL', 'USD-PYG', 'PYG-BRL'];

function pairKey(de: Currency, para: Currency): Pair {
  return `${de}-${para}` as Pair;
}

async function fetchAwesomeRate(pair: Pair): Promise<number> {
  const code = pair.replace('-', '');
  const { data } = await axios.get(`${AWESOME_BASE}/${pair}`, { timeout: 8000 });
  const bid = data?.[code]?.bid;
  const n = Number(bid);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid rate for ${pair}`);
  return n;
}

async function readCache(de: Currency, para: Currency) {
  return prisma.exchangeRate.findUnique({ where: { de_para: { de, para } } });
}

async function upsertRate(de: Currency, para: Currency, taxa: number) {
  return prisma.exchangeRate.upsert({
    where: { de_para: { de, para } },
    create: { de, para, taxa },
    update: { taxa },
  });
}

function isFresh(updatedAt: Date): boolean {
  const ageMs = Date.now() - updatedAt.getTime();
  return ageMs < CACHE_HOURS * 60 * 60 * 1000;
}

/**
 * Garante que os 3 pares canônicos estão frescos no cache.
 * Retorna taxas USD->BRL, USD->PYG, PYG->BRL.
 */
export async function refreshRates(force = false): Promise<void> {
  for (const pair of CANONICAL_PAIRS) {
    const [de, para] = pair.split('-') as [Currency, Currency];
    const cached = await readCache(de, para);
    if (!force && cached && isFresh(cached.updatedAt)) continue;

    try {
      const taxa = await fetchAwesomeRate(pair);
      await upsertRate(de, para, taxa);
      await upsertRate(para, de, 1 / taxa);
    } catch (err) {
      // Se falhar, mantém o cache antigo. Só lança se nunca houve cache.
      if (!cached) throw err;
    }
  }
}

export async function getRate(de: Currency, para: Currency): Promise<number> {
  if (de === para) return 1;
  await refreshRates(false);
  const rec = await readCache(de, para);
  if (!rec) throw new Error(`Rate ${de}->${para} unavailable`);
  return rec.taxa;
}

/**
 * Converte um valor entre duas moedas, arredondando pra 2 casas.
 */
export async function convert(value: number, de: Currency, para: Currency): Promise<number> {
  if (de === para) return round2(value);
  const taxa = await getRate(de, para);
  return round2(value * taxa);
}

/**
 * Dado um preço numa moeda, calcula os outros dois (BRL/USD/PYG).
 * Retorna sempre os 3 campos — um deles é o valor original.
 */
export async function computeAllPrices(
  valor: number,
  moeda: Currency
): Promise<{ precoBrl: number; precoUsd: number; precoGs: number }> {
  const [precoBrl, precoUsd, precoGs] = await Promise.all([
    convert(valor, moeda, 'BRL'),
    convert(valor, moeda, 'USD'),
    convert(valor, moeda, 'PYG'),
  ]);
  return { precoBrl, precoUsd, precoGs };
}

export async function getCurrentRates() {
  await refreshRates(false);
  const rates = await prisma.exchangeRate.findMany();
  return rates.reduce<Record<string, { taxa: number; updatedAt: Date }>>((acc, r) => {
    acc[pairKey(r.de, r.para)] = { taxa: r.taxa, updatedAt: r.updatedAt };
    return acc;
  }, {});
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
