import express from 'express';
import dns from 'dns/promises';

export const router = express.Router();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true; // formato raro → bloquear
  const [a, b] = p;
  if (a === 0 || a === 127 || a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;          // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  return false;
}

function isPrivateIP(ip) {
  const s = (ip || '').toLowerCase();
  if (s.includes(':')) { // IPv6
    if (s === '::1' || s === '::') return true;
    if (s.startsWith('fc') || s.startsWith('fd')) return true; // ULA fc00::/7
    if (s.startsWith('fe80')) return true;                     // link-local
    const mapped = s.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (mapped) return isPrivateIPv4(mapped[1]);
    return false;
  }
  return isPrivateIPv4(s);
}

// Resuelve el host por DNS y bloquea si CUALQUIER dirección es privada.
// Esto cubre IPs codificadas (decimal/octal/hex) y el DNS-rebinding (todas resuelven a una IP que revisamos).
async function hostResolvesToPrivate(host) {
  const h = (host || '').replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost') return true;
  try {
    const addrs = await dns.lookup(h, { all: true });
    if (!addrs.length) return true;
    return addrs.some(a => isPrivateIP(a.address));
  } catch {
    return true; // si no resuelve, bloquear por seguridad
  }
}

// Descarga siguiendo redirecciones a mano, re-validando el host en CADA salto.
async function safeFetch(rawUrl, maxHops = 3) {
  let url = rawUrl;
  for (let hop = 0; hop < maxHops; hop++) {
    let target;
    try { target = new URL(url); } catch { throw new Error('url inválida'); }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') throw new Error('protocolo no permitido');
    if (await hostResolvesToPrivate(target.hostname)) throw new Error('host no permitido');

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let res;
    try {
      res = await fetch(url, { signal: ctrl.signal, redirect: 'manual', headers: { 'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*' } });
    } finally { clearTimeout(timer); }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error('redirección sin destino');
      url = new URL(loc, url).toString(); // resolver relativo y volver a validar
      continue;
    }
    return res;
  }
  throw new Error('demasiadas redirecciones');
}

// GET /img?url=<url absoluta http(s) de una imagen>
// Descarga la imagen en el servidor y la reenvía desde NUESTRO propio origen (evita
// bloqueadores/hotlink/CORP). Con guard anti-SSRF por DNS y redirecciones re-validadas.
router.get('/', async (req, res) => {
  const raw = req.query.url;
  if (!raw || typeof raw !== 'string') return res.status(400).send('url requerida');
  try { new URL(raw); } catch { return res.status(400).send('url inválida'); }

  // 1º vía CDN de redimensionado (webp ligero); si falla, la original directa.
  const viaWeserv = `https://images.weserv.nl/?url=${encodeURIComponent(raw.replace(/^https?:\/\//, ''))}&w=640&output=webp&q=82`;

  for (const u of [viaWeserv, raw]) {
    try {
      const up = await safeFetch(u);
      const ct = up.headers.get('content-type') || '';
      if (!up.ok || !ct.startsWith('image/')) continue;
      const ab = await up.arrayBuffer();
      if (ab.byteLength > 10 * 1024 * 1024) return res.status(413).send('imagen muy grande');
      res.set('Content-Type', ct);
      res.set('Cache-Control', 'public, max-age=604800, immutable');
      res.set('Access-Control-Allow-Origin', '*');
      return res.send(Buffer.from(ab));
    } catch {
      // probar el siguiente candidato
    }
  }
  return res.status(502).send('no se pudo obtener la imagen');
});
