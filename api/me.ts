import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, route } from './_lib';

export default route(async (req: VercelRequest, res: VercelResponse) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Not signed in' });
  return res.json({ user: auth.user });
});
