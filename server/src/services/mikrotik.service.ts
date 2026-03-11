import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

function client() {
  return axios.create({
    baseURL: `https://${process.env.MIKROTIK_HOST}/rest`,
    auth: {
      username: process.env.MIKROTIK_USER!,
      password: process.env.MIKROTIK_PASS!,
    },
    httpsAgent: agent,
    timeout: 10000,
  });
}

function formatUptime(horas: number): string {
  return `${horas}:00:00`;
}

export async function liberarAcesso(mac: string, horas: number): Promise<void> {
  const name = mac.replace(/:/g, '-');
  await client().put('/ip/hotspot/user', {
    name,
    password: name,
    'mac-address': mac,
    'limit-uptime': formatUptime(horas),
    server: process.env.MIKROTIK_HOTSPOT_SERVER || 'hotspot1',
    comment: `VaiConecta - ${new Date().toISOString()}`,
  });
}

export async function revogarAcesso(mac: string): Promise<void> {
  const name = mac.replace(/:/g, '-');
  const res = await client().get('/ip/hotspot/user', {
    params: { name },
  });
  const users: any[] = res.data;
  for (const user of users) {
    if (user['.id']) {
      await client().delete(`/ip/hotspot/user/${user['.id']}`);
    }
  }
}

export async function listarSessoesAtivas(): Promise<any[]> {
  const res = await client().get('/ip/hotspot/active');
  return res.data;
}

export async function listarAPs(): Promise<any[]> {
  try {
    const res = await client().get('/interface/wireless');
    return res.data;
  } catch {
    return [];
  }
}

export async function testarConexao(): Promise<boolean> {
  try {
    await client().get('/system/identity');
    return true;
  } catch {
    return false;
  }
}
