// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeDocument, Library } from '../shared/library';
import { resolveInternalTarget, Viewer } from './viewer';

function doc(
  path: string,
  kind: KnowledgeDocument['kind'],
  title: string,
  body = '',
  tags: string[] = [],
  topic = '開発',
): KnowledgeDocument {
  return { path, kind, title, body, tags, topic };
}
const snapshot = 'a'.repeat(40);
const fixture = [
  doc(
    'indexes/index.md',
    'index',
    'Knowledge Index',
    '## Topics\n\n- [開発](topics/開発.md)',
    [],
    '',
  ),
  doc(
    'indexes/topics/開発.md',
    'index',
    '開発',
    '- [API pagination](<../../knowledge/01-facts/開発/API pagination.md#details-with-bold-and-code>)',
  ),
  doc(
    'knowledge/01-facts/開発/API pagination.md',
    'fact',
    'API pagination',
    '# API pagination\n\nBodyOnlyWord\n\n## Details with **bold** and `code`\n\nDetails here.\n\n[jump to details](#details-with-bold-and-code)\n\n[開発 index](../../../indexes/topics/開発.md)',
    ['API', 'cursor'],
  ),
  doc('knowledge/02-principles/開発/安全.md', 'principle', '安全', '安全な既定値を使う', ['設計']),
  doc('knowledge/03-ideas/開発/案.md', 'idea', '検索案', 'Search future', ['検索'], '別トピック'),
];
const apiPath = fixture[2].path;

function library(documents = fixture): Library {
  return { snapshot, documents: documents.map(({ body: _body, ...metadata }) => metadata) };
}
function responseFor(input: RequestInfo | URL, documents = fixture): Response {
  const url = new URL(String(input));
  if (url.pathname === '/api/library') return Response.json(library(documents));
  if (url.pathname === '/api/article') {
    const selected = documents.find((item) => item.path === url.searchParams.get('path'));
    if (!selected) return new Response('', { status: 404 });
    expect(url.searchParams.get('snapshot')).toBe(snapshot);
    return Response.json({ snapshot, path: selected.path, body: selected.body });
  }
  throw new Error(`Unexpected request: ${url}`);
}

describe('internal Markdown targets', () => {
  it('resolves Japanese, spaces and fragments only to indexed documents', () => {
    expect(
      resolveInternalTarget(
        'indexes/topics/開発.md',
        '../../knowledge/01-facts/開発/API%20pagination.md#details',
        fixture,
      ),
    ).toBe(apiPath);
    expect(resolveInternalTarget(apiPath, '../../../indexes/topics/開発.md', fixture)).toBe(
      'indexes/topics/開発.md',
    );
    expect(resolveInternalTarget(apiPath, '#details', fixture)).toBe(apiPath);
    for (const target of [
      '../../outside.md',
      'javascript:alert(1)',
      '//example.com',
      'daily/private.md',
    ])
      expect(resolveInternalTarget('indexes/index.md', target, fixture)).toBeNull();
  });
});

describe('Viewer', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;
  let scrollDescriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    user = userEvent.setup();
    window.history.replaceState(null, '', '/');
    scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    fetchMock = vi.fn(async (input: RequestInfo | URL) => responseFor(input));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    if (scrollDescriptor)
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollDescriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    vi.unstubAllGlobals();
  });

  it('loads only metadata initially, searches titles and tags with AND, and composes existing filters', async () => {
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe('/api/library');
    expect(screen.getByText('一覧から記事を選択してください。')).toBeTruthy();
    const results = screen.getByRole('navigation', { name: '検索結果' });
    for (const item of within(results).getAllByRole('listitem'))
      expect(item.querySelector(':scope > button')).not.toBeNull();

    await user.type(screen.getByRole('textbox', { name: '検索' }), 'cursor API');
    expect(within(results).getByRole('button', { name: /API pagination/ })).toBeTruthy();
    expect(within(results).getAllByRole('button')).toHaveLength(1);
    await user.clear(screen.getByRole('textbox', { name: '検索' }));
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'BodyOnlyWord');
    expect(screen.getByText('該当するドキュメントはありません。')).toBeTruthy();
    await user.clear(screen.getByRole('textbox', { name: '検索' }));
    await user.click(screen.getByRole('combobox', { name: 'トピック' }));
    await user.click(screen.getByRole('option', { name: '開発' }));
    await user.click(screen.getByRole('combobox', { name: '分類' }));
    await user.click(screen.getByRole('option', { name: 'Fact' }));
    expect(within(results).getAllByRole('button')).toHaveLength(1);
    expect(within(results).queryByRole('button', { name: /安全|検索案/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches selected bodies, follows internal links and anchors, then reuses cached articles', async () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    });
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /^開発/ }));
    fireEvent.click(await screen.findByRole('link', { name: 'API pagination' }));
    await screen.findByRole('heading', { name: /Details with/ });
    expect(screen.getAllByRole('heading', { name: 'API pagination' })).toHaveLength(1);
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'start' }));
    expect(document.getElementById('details-with-bold-and-code')).not.toBeNull();
    const count = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('link', { name: 'jump to details' }));
    await waitFor(() => expect(window.location.hash).toContain('anchor=details'));
    expect(fetchMock).toHaveBeenCalledTimes(count);
    fireEvent.click(screen.getByRole('link', { name: '開発 index' }));
    await screen.findByRole('link', { name: 'API pagination' });
    expect(fetchMock).toHaveBeenCalledTimes(count);
    fireEvent.click(screen.getByRole('button', { name: /API pagination/ }));
    await screen.findByText('BodyOnlyWord');
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'BodyOnlyWord');
    expect(screen.getByText('該当するドキュメントはありません。')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(count);
    expect(fetchMock.mock.calls.every(([, options]) => options?.cache === 'no-store')).toBe(true);
  });

  it('keeps list loading and article loading separate, ignores stale results, and shares pending article requests', async () => {
    let finish: ((response: Response) => void) | undefined;
    const delayed = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return url.searchParams.get('path') === apiPath ? delayed : responseFor(input);
    });
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /API pagination/ }));
    await screen.findByText('記事を読み込み中…');
    expect(screen.getByRole('button', { name: /安全/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /安全/ }));
    await screen.findByText('安全な既定値を使う');
    fireEvent.click(screen.getByRole('button', { name: /API pagination/ }));
    await screen.findByText('記事を読み込み中…');
    finish?.(Response.json({ snapshot, path: apiPath, body: 'Delayed body' }));
    await screen.findByText('Delayed body');
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => new URL(String(input)).searchParams.get('path') === apiPath,
      ),
    ).toHaveLength(1);
  });

  it('opens a hash-selected article and waits for its body before scrolling to the anchor', async () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    });
    window.history.replaceState(
      null,
      '',
      `/#${encodeURIComponent(apiPath)}?anchor=details-with-bold-and-code`,
    );
    render(<Viewer />);
    await screen.findByRole('heading', { name: /Details with/ });
    await waitFor(() => expect(scroll).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('displays an article error without losing the list and retries failed requests', async () => {
    let fail = true;
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (new URL(String(input)).pathname === '/api/article' && fail)
        return Response.json({ error: 'article_unavailable' }, { status: 502 });
      return responseFor(input);
    });
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /API pagination/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('記事の読み込みに失敗しました。');
    expect(screen.getByRole('button', { name: /安全/ })).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: '再試行' }));
    await screen.findByText('BodyOnlyWord');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shows a reload prompt for a stale snapshot without automatic retries', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      new URL(String(input)).pathname === '/api/article'
        ? new Response('', { status: 409 })
        : responseFor(input),
    );
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /API pagination/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ページを再読み込みしてください。');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('renders unsafe HTML, URLs and images inertly after lazy loading', async () => {
    const unsafe = [
      ...fixture,
      doc(
        'knowledge/01-facts/開発/xss.md',
        'fact',
        'XSS safety',
        '<script>window.pwned = true</script>\n\n[bad](javascript:alert(1))\n\n![pixel](data:image/svg+xml,evil)',
      ),
    ];
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => responseFor(input, unsafe));
    render(<Viewer />);
    fireEvent.click(await screen.findByRole('button', { name: /XSS safety/ }));
    await waitFor(() => expect(screen.queryByText('記事を読み込み中…')).toBeNull());
    expect(document.querySelector('script')).toBeNull();
    expect(screen.queryByRole('link', { name: 'bad' })).toBeNull();
    expect(within(screen.getByRole('main')).queryByRole('img')).toBeNull();
  });

  it.each(['network', 'upstream'])(
    'shows a library error for %s failures without requesting bodies',
    async (failure) => {
      if (failure === 'network') fetchMock.mockRejectedValueOnce(new Error('offline'));
      else fetchMock.mockResolvedValueOnce(new Response('', { status: 502 }));
      render(<Viewer />);
      expect(await screen.findByRole('alert')).toHaveTextContent('読み込みに失敗しました。');
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('supports keyboard selection and returns focus to the MUI filter', async () => {
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    const select = screen.getByRole('combobox', { name: 'トピック' });
    select.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeTruthy();
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(select).toHaveTextContent('開発'));
    await waitFor(() => expect(document.activeElement).toBe(select));
  });
});
