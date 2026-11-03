import { defineHandler } from 'void';
import { env } from 'void/env';
import { getLibraryPage } from '../../server/library';
import { getMockPage } from '../../server/mock-library';

const MAX_OFFSET = 10_000;
const SHA_PATTERN = /^[a-f0-9]{40}$/;

export const GET = defineHandler(async (c) => {
  const query = c.req.query();
  const rawOffset = query.offset ?? '0';
  if (!/^\d+$/.test(rawOffset)) return c.json({ error: 'invalid_request' }, 400);
  const offset = Number(rawOffset);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > MAX_OFFSET || offset % 20 !== 0) {
    return c.json({ error: 'invalid_request' }, 400);
  }
  const snapshot = query.snapshot;
  if (snapshot !== undefined && !SHA_PATTERN.test(snapshot))
    return c.json({ error: 'invalid_request' }, 400);
  if (env.VIEWER_DATA_SOURCE !== 'github') return c.json(getMockPage(offset, snapshot));
  const token = env.MATSU_SECOND_BRAIN_READ_TOKEN;
  if (!token) return c.json({ error: 'library_unavailable' }, 503);
  try {
    const page = await getLibraryPage(offset, snapshot ?? null, token);
    return c.json(page, 200, {
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'snapshot_changed')
      return c.json({ error: 'snapshot_changed' }, 409);
    return c.json({ error: 'library_unavailable' }, 502);
  }
});
