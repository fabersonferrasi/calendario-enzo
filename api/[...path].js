import { handleRequest } from '../server/handler.js';

export default async function handler(req, res) {
  await handleRequest(req, res, { allowStatic: false });
}
