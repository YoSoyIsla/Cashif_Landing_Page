const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildAll, syncFile, ROOT_DIR, DIST_DIR } = require('./build.js');

const PORT = process.env.PORT || 3000;
const isDist = process.argv.includes('--dist') || process.env.SERVE_DIST === 'true';
const PUBLIC_DIR = isDist ? DIST_DIR : ROOT_DIR;

// Always ensure dist/ is fresh
buildAll(true);

// Live-reload SSE subscribers
const reloadClients = new Set();

function notifyReload() {
  for (const client of reloadClients) {
    try {
      client.write('data: reload\n\n');
    } catch (_) {
      reloadClients.delete(client);
    }
  }
}

// Watch files for instant build sync & live reload.
// macOS file watchers also fire when nothing changed: on startup they replay recent history, and iCloud/Finder
// touch metadata (.DS_Store, xattrs). Reloading on every event made the page refresh in a loop, so a file only
// counts as changed when its bytes differ from the copy already in dist/.
const pendingChanges = new Set();
let debounceTimeout = null;

function hasRealChange(relPath) {
  if (path.basename(relPath).startsWith('.')) return false;
  const src = path.join(ROOT_DIR, relPath);
  const dest = path.join(DIST_DIR, relPath);
  let srcStat;
  try {
    srcStat = fs.statSync(src);
  } catch (_) {
    return false; // deleted or renamed away: nothing new to show
  }
  if (!srcStat.isFile()) return false;
  try {
    const destStat = fs.statSync(dest);
    if (destStat.size === srcStat.size && fs.readFileSync(src).equals(fs.readFileSync(dest))) return false;
  } catch (_) {}
  return true;
}

function handleFileChange(relPath) {
  pendingChanges.add(relPath);
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const changed = [...pendingChanges].filter(hasRealChange);
    pendingChanges.clear();
    if (!changed.length) return;
    changed.forEach(syncFile);
    console.log(`⚡ [Instant Build & Reload] Synced ${changed.join(', ')} to dist/ and reloaded browser`);
    notifyReload();
  }, 80);
}

['index.html', 'style.css', 'main.js'].forEach(file => {
  const p = path.join(ROOT_DIR, file);
  if (fs.existsSync(p)) {
    fs.watch(p, (eventType) => {
      if (eventType === 'change') {
        handleFileChange(file);
      }
    });
  }
});

const assetsDir = path.join(ROOT_DIR, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.watch(assetsDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      handleFileChange(path.join('assets', filename));
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.splinecode': 'application/octet-stream'
};

const LIVERELOAD_SCRIPT = `
<!-- Instant Dev Live-Reload -->
<script>
  (function() {
    // One connection; EventSource reconnects by itself after a server restart
    const source = new EventSource('/__livereload');
    source.onmessage = function(e) {
      if (e.data === 'reload') {
        console.log('⚡ Reloading page with latest build changes...');
        location.reload();
      }
    };
  })();
</script>
`;

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Error resilience for incoming requests and responses
  req.on('error', () => {});
  res.on('error', () => {});

  // SSE endpoint for instant live reload
  if (reqPath === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    try {
      res.write('data: connected\n\n');
      reloadClients.add(res);
    } catch (_) {}

    req.on('close', () => {
      reloadClients.delete(res);
    });
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (ext === '.mp4' && range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      file.on('error', () => {});

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      file.pipe(res);
      return;
    }

    // For HTML, inject livereload script so changes appear instantly in browser
    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Error');
          return;
        }

        const injected = content.includes('</body>')
          ? content.replace('</body>', `${LIVERELOAD_SCRIPT}\n</body>`)
          : content + LIVERELOAD_SCRIPT;

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': Buffer.byteLength(injected),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(injected);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {});
    stream.pipe(res);
  });
});

// Guard against unhandled process crashes from aborted sockets
process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ECANCELED') {
    return; // Normal browser socket cancellation
  }
  console.error('⚠️ Server handled error:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  console.log(`📂 Serving: ${isDist ? 'dist/ (production build)' : 'root directory'}`);
  console.log(`⚡ Instant Build & Live-Reload is ACTIVE`);
});
