import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, verifyPassword, createSession, route } from './_lib';

export default route(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  const rows =
    typeof username === 'string'
      ? await sql`SELECT * FROM users WHERE lower(username) = lower(${username})`
      : [];
  const user = rows[0];
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = await createSession(user.id);
  return res.json({ token, user: { id: user.id, username: user.username } });
});
