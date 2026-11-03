import { defineHandler } from 'void';
import { env } from 'void/env';
import { getArticle, SHA_PATTERN } from '../../server/library';
import { getMockArticle } from '../../server/mock-library';
import { isAllowedMarkdownPath } from '../../shared/markdown';

export const GET = defineHandler(async (c) => {
  const { path, snapshot } = c.req.query();
  if (!path || !isAllowedMarkdownPath(path) || !snapshot || !SHA_PATTERN.test(snapshot))
    return c.json({ error: 'invalid_request' }, 400);
  try {
    if (env.VIEWER_DATA_SOURCE !== 'github') return c.json(getMockArticle(path, snapshot));
    const token = env.MATSU_SECOND_BRAIN_READ_TOKEN;
    if (!token) return c.json({ error: 'article_unavailable' }, 503);
    return c.json(await getArticle(path, snapshot, token), 200, {
      'Cache-Control': 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'snapshot_changed')
      return c.json({ error: 'snapshot_changed' }, 409);
    if (error instanceof Error && error.message === 'document_not_found')
      return c.json({ error: 'document_not_found' }, 404);
    return c.json({ error: 'article_unavailable' }, 502);
  }
});
