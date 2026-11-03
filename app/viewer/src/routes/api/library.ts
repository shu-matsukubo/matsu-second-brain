import { defineHandler } from 'void';
import { env } from 'void/env';
import { getLibrary } from '../../server/library';
import { getMockLibrary } from '../../server/mock-library';

export const GET = defineHandler(async (c) => {
  if (env.VIEWER_DATA_SOURCE !== 'github') return c.json(getMockLibrary());
  const token = env.MATSU_SECOND_BRAIN_READ_TOKEN;
  if (!token) return c.json({ error: 'library_unavailable' }, 503);
  try {
    return c.json(await getLibrary(token), 200, { 'Cache-Control': 'no-store' });
  } catch {
    return c.json({ error: 'library_unavailable' }, 502);
  }
});
