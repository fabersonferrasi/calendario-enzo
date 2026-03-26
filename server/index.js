import { createServer } from 'node:http';
import { dbPath } from './db.js';
import { handleRequest } from './handler.js';

const PORT = Number(process.env.PORT || 3001);

const server = createServer((req, res) => {
  handleRequest(req, res, { allowStatic: true });
});

server.listen(PORT, () => {
  console.log(`AGENDA backend running on http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});
