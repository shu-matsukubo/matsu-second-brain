// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Article,
  DocumentKind,
  KnowledgeDocument,
  Library,
  TopicMetadata,
} from '../shared/library';
import { resolveInternalTarget, Viewer } from './viewer';

const snapshot = 'a'.repeat(40);
const topics: TopicMetadata[] = [
  { key: 'app-development', label: 'アプリ開発', path: 'indexes/topics/app-development.md' },
  { key: 'cloudflare', label: 'Cloudflare', path: 'indexes/topics/cloudflare.md' },
];
function doc(
  id: string,
  kind: DocumentKind,
  title: string,
  body: string,
  tags: string[] = [],
  topic = 'app-development',
): KnowledgeDocument {
  return {
    id,
    path: `knowledge/${kind === 'fact' ? 'facts' : kind === 'principle' ? 'principles' : 'ideas'}/${topic}/${id}.md`,
    kind,
    title,
    body,
    tags,
    topic,
    topicLabel: topics.find((item) => item.key === topic)?.label ?? topic,
    updated: '2026-11-03',
  };
}
const documents = [
  doc(
    'api-pagination',
    'fact',
    'API pagination',
    '# API pagination\n\nBodyOnlyWord\n\n## Details\n\nDetails here.\n\n[topic](../../../indexes/topics/app-development.md)\n\n[safe default](../../principles/app-development/safe-defaults.md)',
  ),
  doc('safe-defaults', 'principle', 'Safe defaults', 'Principle body.', ['design']),
  doc('viewer-idea', 'idea', 'Viewer search idea', 'Idea body.', ['API', 'search']),
  doc('cloudflare-secret', 'fact', 'Workers secret', 'Secret body.', ['Workers'], 'cloudflare'),
];
const library: Library = {
  snapshot,
  topics,
  documents: documents.map(({ body: _body, ...metadata }) => metadata),
};
const path = documents[0].path;
function responseFor(input: RequestInfo | URL): Response {
  const url = new URL(String(input));
  if (url.pathname === '/api/library') return Response.json(library);
  if (url.pathname === '/api/article') {
    const selected = documents.find((item) => item.path === url.searchParams.get('path'));
    if (!selected) return new Response('', { status: 404 });
    expect(url.searchParams.get('snapshot')).toBe(snapshot);
    return Response.json({ path: selected.path, snapshot, body: selected.body } satisfies Article);
  }
  throw new Error(`Unexpected request: ${url}`);
}

describe('internal Markdown targets', () => {
  it('resolves only indexed knowledge and generated topic files', () => {
    expect(
      resolveInternalTarget(
        path,
        '../../../indexes/topics/app-development.md',
        library.documents,
        topics,
      ),
    ).toBe(topics[0].path);
    expect(
      resolveInternalTarget(
        path,
        '../../principles/app-development/safe-defaults.md',
        library.documents,
        topics,
      ),
    ).toBe(documents[1].path);
    expect(resolveInternalTarget(path, '../../outside.md', library.documents, topics)).toBeNull();
    for (const target of ['javascript:alert(1)', '//example.com', 'daily/private.md'])
      expect(resolveInternalTarget(path, target, library.documents, topics)).toBeNull();
  });
});

describe('Viewer', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    window.history.replaceState(null, '', '/#/');
    fetchMock = vi.fn(async (input: RequestInfo | URL) => responseFor(input));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads metadata only, shows recent cards, and applies title/tag AND plus classification filtering', async () => {
    const user = userEvent.setup();
    render(<Viewer />);
    await screen.findByRole('heading', { name: '最近更新された知識' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe('/api/library');
    expect(screen.getByRole('button', { name: /API pagination/ })).toBeTruthy();
    await fireEvent.change(screen.getByRole('textbox', { name: '検索' }), {
      target: { value: 'API search' },
    });
    expect(screen.getByRole('button', { name: /Viewer search idea/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /API pagination/ })).toBeNull();
    await user.click(screen.getByRole('combobox', { name: '分類' }));
    await user.click(screen.getByRole('option', { name: 'アイディア' }));
    expect(screen.getByRole('button', { name: /Viewer search idea/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Workers secret/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows topic buttons from matching documents and renders a topic as classification lists', async () => {
    render(<Viewer />);
    await screen.findByRole('button', { name: 'アプリ開発' });
    fireEvent.click(screen.getByRole('button', { name: 'アプリ開発' }));
    await screen.findByRole('heading', { name: '事実' });
    expect(screen.getByRole('button', { name: 'API pagination' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Safe defaults/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Viewer search idea/ })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches a body only on selection, displays central loading, follows topic links and browser history', async () => {
    let finish: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      new URL(String(input)).pathname === '/api/article' ? pending : responseFor(input),
    );
    render(<Viewer />);
    await screen.findByRole('button', { name: /API pagination/ });
    fireEvent.click(screen.getByRole('button', { name: /API pagination/ }));
    await screen.findByText('記事を読み込み中…');
    finish?.(Response.json({ path, snapshot, body: documents[0].body }));
    await screen.findByText('BodyOnlyWord');
    fireEvent.click(screen.getByRole('link', { name: 'topic' }));
    await screen.findByRole('heading', { name: '事実' });
    expect(window.location.hash).toBe('#/topic/app-development');
    window.history.back();
    await waitFor(() => expect(window.location.hash).toContain('/knowledge/api-pagination'));
    await screen.findByText('BodyOnlyWord');
  });

  it('supports direct topic and knowledge URLs and anchor navigation', async () => {
    window.history.replaceState(null, '', '/#/knowledge/api-pagination?anchor=details');
    render(<Viewer />);
    await screen.findByText('Details here.');
    expect(document.getElementById('details')).not.toBeNull();
    window.location.hash = '#/topic/cloudflare';
    await screen.findByRole('heading', { name: 'Cloudflare' });
    window.location.hash = `#/topic/app-development?anchor=${encodeURIComponent('事実')}`;
    await screen.findByRole('heading', { name: 'アプリ開発' });
    expect(document.getElementById('事実')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps unsafe content inert and hides remote images', async () => {
    const malicious = doc(
      'unsafe',
      'idea',
      'Unsafe content',
      '<script>window.pwned = true</script>\n\n[bad](javascript:alert(1))\n\n![remote](https://example.test/a.png)',
    );
    const { body: _body, ...metadata } = malicious;
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === '/api/library')
        return Response.json({ ...library, documents: [...library.documents, metadata] });
      if (url.pathname === '/api/article' && url.searchParams.get('path') === malicious.path)
        return Response.json({ path: malicious.path, snapshot, body: malicious.body });
      return responseFor(input);
    });
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /Unsafe content/ }));
    await waitFor(() => expect(screen.queryByText('記事を読み込み中…')).toBeNull());
    expect(document.querySelector('script')).toBeNull();
    expect(screen.queryByRole('link', { name: 'bad' })).toBeNull();
    expect(within(screen.getByRole('main')).queryByRole('img')).toBeNull();
  });

  it('opens a mobile drawer from the hamburger control', async () => {
    render(<Viewer />);
    await screen.findByRole('heading', { name: '最近更新された知識' });
    fireEvent.click(screen.getByRole('button', { name: 'メニューを開く' }));
    expect(await screen.findByRole('navigation', { name: 'トピック' })).toBeTruthy();
  });

  it('shows the desktop menu action and expanded state', async () => {
    const mediaQuery = {
      matches: false,
      media: '(max-width: 700px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } satisfies MediaQueryList;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );
    render(<Viewer />);
    const closeMenu = await screen.findByRole('button', { name: 'メニューを閉じる' });
    expect(closeMenu.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(closeMenu);
    const openMenu = screen.getByRole('button', { name: 'メニューを開く' });
    expect(openMenu.getAttribute('aria-expanded')).toBe('false');
  });
});
