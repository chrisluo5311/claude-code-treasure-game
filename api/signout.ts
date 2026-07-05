import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, getAuthUser, route } from './_lib';

export default route(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Not signed in' });
  await sql`DELETE FROM sessions WHERE token = ${auth.token}`;
  return res.json({ ok: true });
});
