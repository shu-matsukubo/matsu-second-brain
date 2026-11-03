// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeDocument, LibraryPage } from '../shared/library';
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
    '- [API pagination](<../../knowledge/01-facts/開発/API pagination.md>)',
  ),
  doc(
    'knowledge/01-facts/開発/API pagination.md',
    'fact',
    'API pagination',
    'Snapshot page cursor\n\n## Details with **bold** and `code`\n\nDetails here.\n\n[jump to details](#details-with-bold-and-code)\n\n[開発 index](../../../indexes/topics/開発.md)',
    ['API', 'cursor'],
  ),
  doc('knowledge/02-principles/開発/安全.md', 'principle', '安全', '安全な既定値を使う', ['設計']),
  doc('knowledge/03-ideas/開発/案.md', 'idea', '検索案', 'Search future'),
];

function page(documents: KnowledgeDocument[], offset: number, snapshot = 'snap'): LibraryPage {
  const items = documents.slice(offset, offset + 20);
  return {
    snapshot,
    documents: items,
    nextOffset: offset + 20 < documents.length ? offset + 20 : null,
    total: documents.length,
  };
}

describe('internal markdown targets', () => {
  it('resolves relative paths with Japanese, spaces and fragments only to supplied library docs', () => {
    expect(
      resolveInternalTarget(
        'indexes/topics/開発.md',
        '../../knowledge/01-facts/開発/API%20pagination.md#details',
        fixture,
      ),
    ).toBe('knowledge/01-facts/開発/API pagination.md');
    expect(
      resolveInternalTarget(
        'knowledge/01-facts/開発/API pagination.md',
        '../../../indexes/topics/開発.md',
        fixture,
      ),
    ).toBe('indexes/topics/開発.md');
    expect(
      resolveInternalTarget('knowledge/01-facts/開発/API pagination.md', '#details', fixture),
    ).toBe('knowledge/01-facts/開発/API pagination.md');
    expect(resolveInternalTarget('indexes/index.md', '../../outside.md', fixture)).toBeNull();
    expect(resolveInternalTarget('indexes/index.md', 'javascript:alert(1)', fixture)).toBeNull();
    expect(resolveInternalTarget('indexes/index.md', '//example.com', fixture)).toBeNull();
  });
});

describe('Viewer', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;
  let scrollIntoViewDescriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    user = userEvent.setup();
    window.history.replaceState(null, '', '/');
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get('offset') ?? 0);
      return new Response(JSON.stringify(page(fixture, offset, 'snap')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
    vi.unstubAllGlobals();
  });

  it('loads all pages once, composes kind and topic filters with AND search, then opens local links without fetching again', async () => {
    const many = [
      ...fixture,
      ...Array.from({ length: 18 }, (_, i) =>
        doc(`knowledge/01-facts/開発/extra-${i}.md`, 'fact', `Extra ${i}`, 'misc'),
      ),
    ];
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return new Response(JSON.stringify(page(many, Number(url.searchParams.get('offset') ?? 0))), {
        status: 200,
      });
    });
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    const resultList = within(screen.getByRole('navigation', { name: '検索結果' })).getByRole(
      'list',
    );
    const resultItems = within(resultList).getAllByRole('listitem');
    expect(resultItems.length).toBeGreaterThan(0);
    for (const item of resultItems) {
      expect(item.querySelector(':scope > button')).not.toBeNull();
    }
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const countAfterLoad = fetchMock.mock.calls.length;
    expect(fetchMock.mock.calls.every(([, options]) => options?.cache === 'no-store')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^開発/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '開発' })).toBeTruthy());
    fireEvent.click(screen.getByRole('link', { name: /API pagination/ }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'API pagination' })).toBeTruthy(),
    );
    expect(screen.getByRole('heading', { name: /Details with/ }).id).toBe(
      'details-with-bold-and-code',
    );
    const reader = screen.getByRole('main');
    reader.scrollTop = 180;
    const scrollToAnchor = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollToAnchor,
    });
    fireEvent.click(screen.getByRole('link', { name: 'jump to details' }));
    await waitFor(() => expect(window.location.hash).toContain('anchor=details'));
    await waitFor(() => expect(scrollToAnchor).toHaveBeenCalledWith({ block: 'start' }));
    expect(document.getElementById('details-with-bold-and-code')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /安全/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '安全' })).toBeTruthy());
    expect(reader.scrollTop).toBe(0);
    await user.click(screen.getByRole('combobox', { name: 'トピック' }));
    await user.click(screen.getByRole('option', { name: '開発' }));
    await user.click(screen.getByRole('combobox', { name: '分類' }));
    await user.click(screen.getByRole('option', { name: 'Fact' }));
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'cursor API');
    expect(await screen.findByRole('button', { name: /API pagination/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /安全/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(countAfterLoad);
  });

  it('restarts one complete load after a stale snapshot and commits only the new library', async () => {
    const oldDocuments = [
      ...fixture,
      doc('knowledge/01-facts/開発/old.md', 'fact', 'Old snapshot marker'),
      ...Array.from({ length: 18 }, (_, i) =>
        doc(`knowledge/01-facts/開発/old-${i}.md`, 'fact', `Old extra ${i}`),
      ),
    ];
    const newDocuments = [
      ...fixture,
      doc('knowledge/01-facts/開発/new.md', 'fact', 'New snapshot marker'),
      ...Array.from({ length: 18 }, (_, i) =>
        doc(`knowledge/01-facts/開発/new-${i}.md`, 'fact', `New extra ${i}`),
      ),
    ];
    const requests: Array<{ offset: number; snapshot: string | null }> = [];
    let finishLastPage: ((response: Response) => void) | undefined;
    const lastPage = new Promise<Response>((resolve) => {
      finishLastPage = resolve;
    });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const snapshot = url.searchParams.get('snapshot');
      requests.push({ offset, snapshot });
      if (requests.length === 1)
        return new Response(JSON.stringify(page(oldDocuments, offset, 'old-snapshot')));
      if (requests.length === 2)
        return new Response('{"error":"snapshot_changed"}', { status: 409 });
      if (requests.length === 3)
        return new Response(JSON.stringify(page(newDocuments, offset, 'new-snapshot')));
      return lastPage;
    });

    render(<Viewer />);
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(screen.getByText('読み込み中…')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /Old snapshot marker|New snapshot marker/ }),
    ).toBeNull();
    expect(requests).toEqual([
      { offset: 0, snapshot: null },
      { offset: 20, snapshot: 'old-snapshot' },
      { offset: 0, snapshot: null },
      { offset: 20, snapshot: 'new-snapshot' },
    ]);
    expect(fetchMock.mock.calls.every(([, options]) => options?.cache === 'no-store')).toBe(true);

    finishLastPage?.(new Response(JSON.stringify(page(newDocuments, 20, 'new-snapshot'))));
    expect(await screen.findByRole('button', { name: /New snapshot marker/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Old snapshot marker/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('stops after a second stale snapshot instead of retrying indefinitely', async () => {
    const documents = [
      ...fixture,
      ...Array.from({ length: 18 }, (_, i) =>
        doc(`knowledge/01-facts/開発/retry-${i}.md`, 'fact', `Retry ${i}`),
      ),
    ];
    let pageCount = 0;
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get('offset') ?? 0);
      if (offset === 0) {
        pageCount += 1;
        return new Response(JSON.stringify(page(documents, 0, `snapshot-${pageCount}`)));
      }
      return new Response('{"error":"snapshot_changed"}', { status: 409 });
    });

    render(<Viewer />);
    expect(await screen.findByRole('alert')).toHaveTextContent('読み込みに失敗しました。');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(screen.queryByRole('button', { name: /Retry 0/ })).toBeNull();
  });

  it('searches body and tags, follows encoded internal links, and renders unsafe HTML and URLs inertly', async () => {
    const unsafeFixture = [
      ...fixture,
      doc(
        'knowledge/01-facts/開発/xss.md',
        'fact',
        'XSS safety',
        '<script>window.pwned = true</script>\n\n[bad](javascript:alert(1))\n\n![pixel](data:image/svg+xml,evil)',
      ),
    ];
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return new Response(
        JSON.stringify(page(unsafeFixture, Number(url.searchParams.get('offset') ?? 0))),
        { status: 200 },
      );
    });
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'pagination API');
    expect(await screen.findByRole('button', { name: /API pagination/ })).toBeTruthy();
    await user.clear(screen.getByRole('textbox', { name: '検索' }));
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'javascript');
    // Search includes the literal markdown body.
    expect(await screen.findByRole('button', { name: /XSS safety/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /XSS safety/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'XSS safety' })).toBeTruthy());
    expect(document.querySelector('script')).toBeNull();
    expect(screen.queryByRole('link', { name: 'bad' })).toBeNull();
    expect(within(screen.getByRole('main')).queryByRole('img')).toBeNull();
  });

  it('shows empty and network error states', async () => {
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    await user.type(screen.getByRole('textbox', { name: '検索' }), 'no match at all');
    expect(screen.getByText('該当するドキュメントはありません。')).toBeTruthy();
  });

  it('shows an error state when the library request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render(<Viewer />);
    expect(await screen.findByRole('alert')).toHaveTextContent('読み込みに失敗しました。');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard selection in MUI menus and returns focus to the trigger', async () => {
    render(<Viewer />);
    await screen.findByRole('button', { name: /Knowledge Index/ });
    const topicSelect = screen.getByRole('combobox', { name: 'トピック' });
    topicSelect.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeTruthy();
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(topicSelect).toHaveTextContent('開発'));
    await waitFor(() => expect(document.activeElement).toBe(topicSelect));
  });
});
