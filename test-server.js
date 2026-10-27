const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const port = 8088;

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(distDir, urlPath.replace(/^\//, ''));
  console.log(`[HTTP ${req.method}] ${req.url}`);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log(`[404] Not found: ${filePath}`);
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const total = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const partialstart = parts[0];
    const partialend = parts[1];
    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : total - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream'
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Content-Type': filePath.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Update test server listening on http://127.0.0.1:${port}`);
});
