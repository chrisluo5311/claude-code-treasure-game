import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, getAuthUser, route } from './_lib';

export default route(async (req: VercelRequest, res: VercelResponse) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Not signed in' });

  if (req.method === 'POST') {
    const { score, treasureFound } = req.body || {};
    if (!Number.isInteger(score)) {
      return res.status(400).json({ error: 'score must be an integer' });
    }
    await sql`
      INSERT INTO scores (user_id, score, treasure_found)
      VALUES (${auth.user.id}, ${score}, ${treasureFound ? 1 : 0})`;
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const statsRows = await sql`
      SELECT COUNT(*)::int AS "gamesPlayed",
             COALESCE(SUM(score), 0)::int AS "totalScore",
             COALESCE(MAX(score), 0)::int AS "bestScore"
      FROM scores WHERE user_id = ${auth.user.id}`;
    const recent = await sql`
      SELECT score, treasure_found AS "treasureFound", created_at AS "createdAt"
      FROM scores WHERE user_id = ${auth.user.id}
      ORDER BY id DESC LIMIT 10`;
    return res.json({ stats: statsRows[0], recent });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
