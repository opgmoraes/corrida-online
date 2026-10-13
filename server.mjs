import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Engine } from './engine.mjs';
import { validateConfig, defaults } from './config.mjs';
import { TikTokAdapter } from './tiktok.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
fs.mkdirSync(dataDir, { recursive: true });
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('PORT inválida');
let secret = process.env.APP_SECRET;
if (!secret && !production) {
  const file = path.join(dataDir, 'admin-key.txt');
  if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  secret = fs.readFileSync(file, 'utf8').trim();
}
if (!secret || secret.length < 32) throw Error('Configure APP_SECRET com pelo menos 32 caracteres');
const cloudURL = process.env.PUBLIC_URL || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '');
if (production && !cloudURL) throw Error('PUBLIC_URL ou RENDER_EXTERNAL_HOSTNAME obrigatório na hospedagem');
const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
if (cloudURL) origins.add(new URL(cloudURL).origin);
const hosts = new Set([...origins].map(o => new URL(o).host));
const derive = (id, scope) => crypto.createHmac('sha256', secret).update(`corrida-v04:${id}:${scope}`).digest('hex');
const equal = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const rooms = new Map();
for (let i = 1; i <= 4; i++) {
  const id = `sala${i}`, file = path.join(dataDir, `${id}.json`);
  let config = validateConfig(defaults), saved = false;
  if (fs.existsSync(file)) { config = validateConfig(JSON.parse(fs.readFileSync(file, 'utf8'))); saved = true; }
  rooms.set(id, { id, file, config, saved, engine: new Engine(config), clients: new Map(), busy: false });
  rooms.get(id).adapter = new TikTokAdapter(rooms.get(id).engine);
}
function state(room, scope) { const s = room.engine.snapshot(); if (scope === 'read') s.config = { ...s.config, username: '' }; return { ...s, saved: room.saved, room: room.id }; }
function links(room, origin) { return { panel: `${origin}/s/${room.id}/${derive(room.id, 'control')}/`, overlay: `${origin}/o/${room.id}/${derive(room.id, 'read')}/` }; }
function json(res, status, obj) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); }
async function body(req) { let size = 0, raw = ''; for await (const chunk of req) { size += chunk.length; if (size > 65536) throw Error('Requisição muito grande'); raw += chunk; } return JSON.parse(raw || '{}'); }
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
function sendFile(res, name) {
  const file = path.resolve(root, 'public', name), publicRoot = path.join(root, 'public');
  if (!file.startsWith(publicRoot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'Não encontrado' });
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'");
  try {
    if (!hosts.has(req.headers.host)) return json(res, 403, { error: 'Host inválido' });
    const origin = cloudURL ? new URL(cloudURL).origin : `http://${req.headers.host}`;
    const route = new URL(req.url, origin).pathname;
    if (req.method === 'GET' && route === '/health') return json(res, 200, { ok: true, version: '0.4.0' });
    if (req.method === 'GET' && route === '/api/admin') {
      if (!equal(req.headers['x-admin-key'], secret)) return json(res, 401, { error: 'Chave de administrador inválida' });
      return json(res, 200, { rooms: [...rooms.values()].map(r => ({ id: r.id, username: r.config.username, ...links(r, origin) })) });
    }
    const match = route.match(/^\/(s|o)\/(sala[1-4])\/([a-f0-9]{64})\/(.*)$/);
    if (match) {
      const [, kind, id, key, tail] = match, room = rooms.get(id), scope = kind === 's' ? 'control' : 'read';
      if (!equal(key, derive(id, scope))) return json(res, 401, { error: 'Link privado inválido' });
      if (tail === '' && req.method === 'GET') return sendFile(res, scope === 'control' ? 'panel.html' : 'overlay.html');
      if (tail === 'api/state' && req.method === 'GET') return json(res, 200, state(room, scope));
      if (tail === 'api/stream' && req.method === 'GET') {
        if (room.clients.size >= 12) return json(res, 429, { error: 'Muitas telas abertas nesta sala' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write(`data: ${JSON.stringify(state(room, scope))}\n\n`); room.clients.set(res, scope); req.on('close', () => room.clients.delete(res)); return;
      }
      if (scope !== 'control') return json(res, 403, { error: 'O link da transmissão permite apenas visualizar' });
      if (tail === 'api/bootstrap' && req.method === 'GET') return json(res, 200, { token: derive(id, 'csrf'), config: room.config, state: state(room, scope), links: links(room, origin) });
      if (req.method !== 'POST') return json(res, 404, { error: 'Não encontrado' });
      if (!origins.has(req.headers.origin) || !equal(req.headers['x-studio-token'], derive(id, 'csrf'))) return json(res, 403, { error: 'Abra o painel privado para controlar o jogo' });
      if (room.busy) return json(res, 409, { error: 'Aguarde a ação anterior terminar' }); room.busy = true;
      try {
        const payload = await body(req);
        if (tail === 'api/config') {
          const next = validateConfig(payload);
          if (next.username && [...rooms.values()].some(r => r !== room && r.config.username.toLowerCase() === next.username.toLowerCase())) return json(res, 409, { error: 'Essa conta TikTok já está configurada em outra sala' });
          fs.writeFileSync(room.file + '.tmp', JSON.stringify(next, null, 2)); fs.renameSync(room.file + '.tmp', room.file);
          const changed = room.config.username !== next.username; room.config = next; room.saved = true; room.engine.configure(next);
          if (changed || room.engine.demo) await room.adapter.watch(next.username);
          return json(res, 200, { ok: true, pending: room.engine.pending !== null });
        }
        if (tail === 'api/watch') { await room.adapter.watch(room.config.username); return json(res, 200, { ok: true }); }
        if (tail === 'api/demo') { await room.adapter.stop(); room.engine.setDemo(!!payload.enabled); return json(res, 200, { ok: true }); }
        if (tail === 'api/test') { if (!room.engine.demo) return json(res, 409, { error: 'Ative o teste primeiro' }); return json(res, 200, { ok: room.engine.accept({ ...payload, id: crypto.randomUUID(), user: 'teste-local' }) }); }
        return json(res, 404, { error: 'Não encontrado' });
      } finally { room.busy = false; }
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Método inválido' });
    if (route === '/') return sendFile(res, 'admin.html');
    if (route === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('User-agent: *\nDisallow: /\n'); }
    const publicFiles = new Set(['panel.css', 'panel.js', 'overlay.css', 'overlay.js', 'client.js', 'admin.js', 'lula.svg', 'bolsonaro.svg']);
    if (publicFiles.has(route.slice(1))) return sendFile(res, route.slice(1));
    return json(res, 404, { error: 'Abra seu link privado' });
  } catch (error) { if (!res.headersSent) json(res, 400, { error: error.message }); else res.end(); }
});
let last = performance.now();
const tick = setInterval(() => {
  const now = performance.now(), dt = (now - last) / 1000; last = now;
  for (const room of rooms.values()) { room.engine.tick(dt); for (const [res, scope] of room.clients) { if (res.writableLength > 1000000) { room.clients.delete(res); res.destroy(); } else res.write(`data: ${JSON.stringify(state(room, scope))}\n\n`); } }
}, 200);
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Porta ocupada. Feche outra instância.' : error.message); process.exit(1); });
server.listen(port, production ? '0.0.0.0' : '127.0.0.1', () => { console.log(`Corrida Online 0.4 pronta na porta ${port}. 4 salas privadas.`); if (!production) console.log(`Painel http://127.0.0.1:${port} • chave administrativa em data/admin-key.txt`); for (const room of rooms.values()) room.adapter.watch(room.config.username); });
async function shutdown() { clearInterval(tick); for (const room of rooms.values()) { for (const res of room.clients.keys()) res.end(); await room.adapter.stop(); } server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
