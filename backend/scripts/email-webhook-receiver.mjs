import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.EMAIL_WEBHOOK_PORT || 9999);
const LOG = path.resolve(process.cwd(), 'data', 'email-webhook-log.json');

const ensure = () => {
  const dir = path.dirname(LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, '[]', 'utf-8');
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      ensure();
      const entry = { at: new Date().toISOString(), body: JSON.parse(body || '{}') };
      const list = JSON.parse(fs.readFileSync(LOG, 'utf-8'));
      list.unshift(entry);
      fs.writeFileSync(LOG, JSON.stringify(list.slice(0, 100), null, 2));
      console.log(`[email] to=${entry.body.to} subject=${entry.body.subject}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, port: PORT }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`Email webhook receiver: http://localhost:${PORT}/send`);
});
