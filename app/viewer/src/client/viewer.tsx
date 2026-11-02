import type { ReactNode } from 'react';
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DocumentKind, KnowledgeDocument, LibraryPage } from '../shared/library';

const kindNames: Record<DocumentKind, string> = {
  index: 'Index',
  fact: 'Fact',
  principle: 'Principle',
  idea: 'Idea',
};
const kinds: Array<DocumentKind | ''> = ['', 'index', 'fact', 'principle', 'idea'];

class SnapshotChangedError extends Error {}

export function resolveInternalTarget(
  currentPath: string,
  href: string,
  documents: KnowledgeDocument[],
): string | null {
  if (!href || href.startsWith('//') || href.startsWith('\\\\')) return null;
  const hashOnly = href.startsWith('#');
  let decoded: string;
  try {
    decoded = decodeURIComponent(href);
  } catch {
    return null;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(decoded) && !hashOnly) return null;
  if (/^\s*(?:javascript|data|file|vbscript):/i.test(decoded)) return null;
  const [pathPart] = decoded.split(/[?#]/, 1);
  if (!hashOnly && !pathPart) return null;
  const base = hashOnly
    ? currentPath
    : pathPart.startsWith('/')
      ? pathPart.slice(1)
      : `${currentPath.slice(0, currentPath.lastIndexOf('/') + 1)}${pathPart}`;
  const parts: string[] = [];
  for (const part of base.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(part);
  }
  const normalized = parts.join('/');
  if (
    !(normalized.startsWith('indexes/') || normalized.startsWith('knowledge/')) ||
    !normalized.endsWith('.md')
  )
    return null;
  return documents.some((document) => document.path === normalized) ? normalized : null;
}

function safeExternalHref(href: string): string | null {
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function documentHash(path: string): string {
  return `#${encodeURIComponent(path)}`;
}
function hashSelection(): { path: string | null; anchor: string | null } {
  try {
    const [encodedPath, query = ''] = window.location.hash.slice(1).split('?', 2);
    return {
      path: decodeURIComponent(encodedPath) || null,
      anchor: new URLSearchParams(query).get('anchor'),
    };
  } catch {
    return { path: null, anchor: null };
  }
}

function headingSlug(value: string): string {
  return value
    .toLocaleLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return '';
}

export function Viewer() {
  const readerRef = useRef<HTMLElement>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState<DocumentKind | ''>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let restartCount = 0;
        while (true) {
          let offset = 0;
          let snapshot: string | undefined;
          const all: KnowledgeDocument[] = [];
          try {
            do {
              const url = new URL('/api/library', window.location.origin);
              url.searchParams.set('offset', String(offset));
              if (snapshot) url.searchParams.set('snapshot', snapshot);
              const response = await fetch(url, { cache: 'no-store' });
              if (response.status === 409) throw new SnapshotChangedError();
              if (!response.ok) throw new Error('library_unavailable');
              const page = (await response.json()) as LibraryPage;
              if (!snapshot) snapshot = page.snapshot;
              if (page.snapshot !== snapshot || !Array.isArray(page.documents))
                throw new Error('invalid_library');
              all.push(...page.documents);
              offset = page.nextOffset ?? -1;
            } while (offset >= 0);
            if (cancelled) return;
            setDocuments(all);
            setStatus('ready');
            return;
          } catch (error) {
            if (error instanceof SnapshotChangedError && restartCount === 0) {
              restartCount += 1;
              continue;
            }
            throw error;
          }
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const selection = hashSelection();
      setSelectedPath(selection.path);
      setSelectedAnchor(selection.anchor);
    };
    window.addEventListener('hashchange', sync);
    sync();
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    if (selectedAnchor && selectedPath) {
      const target = document.getElementById(selectedAnchor);
      if (target) {
        target.scrollIntoView?.({ block: 'start' });
        return;
      }
    }
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, [selectedAnchor, selectedPath, status]);

  const topics = useMemo(
    () =>
      [...new Set(documents.filter((doc) => doc.kind !== 'index').map((doc) => doc.topic))].sort(
        (a, b) => a.localeCompare(b, 'ja'),
      ),
    [documents],
  );
  const visible = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return documents.filter((doc) => {
      if (kind && doc.kind !== kind) return false;
      if (topic && doc.topic !== topic) return false;
      const haystack = `${doc.title}\n${doc.tags.join(' ')}\n${doc.body}`.toLocaleLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [documents, kind, query, topic]);
  const selected =
    documents.find((doc) => doc.path === selectedPath) ??
    documents.find((doc) => doc.path === 'indexes/index.md') ??
    null;
  const articleBody = selected
    ? selected.body.replace(/^#\s+([^\n]+)(?:\r?\n)+/, (heading, title: string) =>
        title.trim() === selected.title ? '' : heading,
      )
    : '';

  const navigate = useCallback((path: string, anchor?: string) => {
    const base = encodeURIComponent(path);
    window.location.hash = anchor ? `${base}?anchor=${encodeURIComponent(anchor)}` : base;
  }, []);

  return (
    <div className="viewer-shell">
      <aside className="sidebar" aria-label="ドキュメント一覧">
        <div className="controls">
          <input
            aria-label="検索"
            placeholder="検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="トピック"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option value="">すべてのトピック</option>
            {topics.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="分類"
            value={kind}
            onChange={(event) => setKind(event.target.value as DocumentKind | '')}
          >
            {kinds.map((value) => (
              <option key={value || 'all'} value={value}>
                {value ? kindNames[value] : 'すべての分類'}
              </option>
            ))}
          </select>
        </div>
        <nav className="document-list" aria-label="検索結果">
          {status === 'loading' && <p className="state">読み込み中…</p>}
          {status === 'error' && (
            <p className="state" role="alert">
              読み込みに失敗しました。
            </p>
          )}
          {status === 'ready' && visible.length === 0 && (
            <p className="state">該当するドキュメントはありません。</p>
          )}
          {visible.map((doc) => (
            <button
              type="button"
              key={doc.path}
              className={`document-row${selected?.path === doc.path ? ' selected' : ''}`}
              aria-current={selected?.path === doc.path ? 'page' : undefined}
              onClick={() => navigate(doc.path)}
            >
              <span className="row-title">{doc.title}</span>
              <span className="row-meta">
                {kindNames[doc.kind]}
                {doc.kind !== 'index' ? ` · ${doc.topic}` : ''}
              </span>
            </button>
          ))}
        </nav>
      </aside>
      <main ref={readerRef} className="reader" aria-live="polite">
        {status === 'error' ? (
          <p className="reader-state">ドキュメントを読み込めませんでした。</p>
        ) : selected ? (
          <article className="article">
            <header className="article-header">
              <span className="kind-label">{kindNames[selected.kind]}</span>
              <h1>{selected.title}</h1>
              {selected.tags.length > 0 && (
                <div className="tags">
                  {selected.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </header>
            <div className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                  a: ({ href = '', children, node: _node, ...props }) => {
                    const internal = resolveInternalTarget(selected.path, href, documents);
                    if (internal) {
                      const fragment = href.includes('#')
                        ? href.slice(href.indexOf('#') + 1).split(/[?&]/, 1)[0]
                        : '';
                      let anchor = '';
                      try {
                        anchor = decodeURIComponent(fragment);
                      } catch {
                        /* Invalid fragments are ignored. */
                      }
                      return (
                        <a
                          href={`${documentHash(internal)}${anchor ? `?anchor=${encodeURIComponent(anchor)}` : ''}`}
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(internal, anchor || undefined);
                          }}
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    }
                    const external = safeExternalHref(href);
                    return external ? (
                      <a href={external} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    ) : (
                      <span>{children}</span>
                    );
                  },
                  h1: ({ children, node: _node, ...props }) => (
                    <h1 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, node: _node, ...props }) => (
                    <h2 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, node: _node, ...props }) => (
                    <h3 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h3>
                  ),
                  h4: ({ children, node: _node, ...props }) => (
                    <h4 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h4>
                  ),
                  h5: ({ children, node: _node, ...props }) => (
                    <h5 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h5>
                  ),
                  h6: ({ children, node: _node, ...props }) => (
                    <h6 id={headingSlug(textContent(children))} {...props}>
                      {children}
                    </h6>
                  ),
                  img: ({ alt }) => <span className="image-alt">{alt ?? ''}</span>,
                }}
              >
                {articleBody}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          <p className="reader-state">ドキュメントがありません。</p>
        )}
      </main>
    </div>
  );
}
