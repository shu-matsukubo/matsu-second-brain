import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { ReactNode } from 'react';
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  Article,
  DocumentKind,
  DocumentMetadata,
  Library,
  TopicMetadata,
} from '../shared/library';

const kindNames: Record<DocumentKind, string> = {
  fact: '事実',
  principle: '思想',
  idea: 'アイディア',
};
const kinds: Array<DocumentKind | ''> = ['', 'fact', 'principle', 'idea'];
type Route =
  | { view: 'home' }
  | { view: 'topic'; topic: string; anchor?: string | null }
  | { view: 'knowledge'; id: string; anchor: string | null };

export function resolveInternalTarget(
  currentPath: string,
  href: string,
  documents: DocumentMetadata[],
  topics: TopicMetadata[] = [],
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
  if (!normalized.endsWith('.md')) return null;
  return documents.some((doc) => doc.path === normalized) ||
    topics.some((topic) => topic.path === normalized)
    ? normalized
    : null;
}

function safeExternalHref(href: string): string | null {
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function hashSelection(): Route {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#/')) return { view: 'home' };
    const [route, query = ''] = hash.slice(2).split('?', 2);
    const [section, encoded = ''] = route.split('/', 2);
    const key = decodeURIComponent(encoded);
    if (section === 'topic' && key)
      return { view: 'topic', topic: key, anchor: new URLSearchParams(query).get('anchor') };
    if (section === 'knowledge' && key)
      return { view: 'knowledge', id: key, anchor: new URLSearchParams(query).get('anchor') };
  } catch {
    /* malformed URLs resolve to home */
  }
  return { view: 'home' };
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
  const articleCache = useRef(new Map<string, Promise<Article>>());
  const snapshotRef = useRef('');
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [topics, setTopics] = useState<TopicMetadata[]>([]);
  const [snapshot, setSnapshot] = useState('');
  const [route, setRoute] = useState<Route>(() => hashSelection());
  const [article, setArticle] = useState<Article | null>(null);
  const [articleError, setArticleError] = useState<{ path: string; stale: boolean } | null>(null);
  const [articleAttempt, setArticleAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<DocumentKind | ''>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refresh, setRefresh] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 700px)', { defaultMatches: true });
  const selected =
    route.view === 'knowledge' ? (documents.find((doc) => doc.id === route.id) ?? null) : null;
  const articleReady = article?.path === selected?.path && article?.snapshot === snapshot;

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh intentionally reruns the library request; snapshotRef avoids a second fetch after state updates.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus('loading');
      try {
        const response = await fetch(new URL('/api/library', window.location.origin), {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('library_unavailable');
        const library = (await response.json()) as Library;
        if (
          !Array.isArray(library.documents) ||
          !Array.isArray(library.topics) ||
          !/^[a-f0-9]{40}$/.test(library.snapshot)
        )
          throw new Error('invalid_library');
        if (cancelled) return;
        if (snapshotRef.current && snapshotRef.current !== library.snapshot) {
          articleCache.current.clear();
          setArticle(null);
        }
        snapshotRef.current = library.snapshot;
        setDocuments(library.documents);
        setTopics(library.topics);
        setSnapshot(library.snapshot);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const articlePath = selected?.path;
  // biome-ignore lint/correctness/useExhaustiveDependencies: articleAttempt explicitly retries a failed request.
  useEffect(() => {
    if (!articlePath || !snapshot) return;
    let cancelled = false;
    setArticleError(null);
    const key = `${snapshot}:${articlePath}`;
    let pending = articleCache.current.get(key);
    if (!pending) {
      const url = new URL('/api/article', window.location.origin);
      url.searchParams.set('path', articlePath);
      url.searchParams.set('snapshot', snapshot);
      pending = fetch(url, { cache: 'no-store' })
        .then(async (response) => {
          if (response.status === 409) throw new Error('snapshot_changed');
          if (!response.ok) throw new Error('article_unavailable');
          const result = (await response.json()) as Article;
          if (
            result.path !== articlePath ||
            result.snapshot !== snapshot ||
            typeof result.body !== 'string'
          )
            throw new Error('invalid_article');
          return result;
        })
        .catch((error: unknown) => {
          articleCache.current.delete(key);
          throw error;
        });
      articleCache.current.set(key, pending);
    }
    void pending.then(
      (result) => {
        if (!cancelled) setArticle(result);
      },
      (error: unknown) => {
        if (!cancelled)
          setArticleError({
            path: articlePath,
            stale: error instanceof Error && error.message === 'snapshot_changed',
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [articlePath, snapshot, articleAttempt]);

  useEffect(() => {
    const sync = () => setRoute(hashSelection());
    window.addEventListener('hashchange', sync);
    sync();
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);
  useEffect(() => {
    if (status !== 'ready' || !articleReady) return;
    if (route.view === 'knowledge' && route.anchor) {
      document.getElementById(route.anchor)?.scrollIntoView?.({ block: 'start' });
      return;
    }
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, [route, status, articleReady]);
  useEffect(() => {
    if (status !== 'ready' || route.view !== 'topic' || !route.anchor) return;
    document.getElementById(route.anchor)?.scrollIntoView?.({ block: 'start' });
  }, [route, status]);

  const matching = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return documents.filter((doc) => {
      if (kind && doc.kind !== kind) return false;
      const searchable = `${doc.title}\n${doc.tags.join(' ')}`.toLocaleLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }, [documents, kind, query]);
  const matchingTopics = useMemo(() => {
    const keys = new Set(matching.map((doc) => doc.topic));
    return topics
      .filter((topic) => keys.has(topic.key))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  }, [matching, topics]);
  const currentTopic =
    route.view === 'topic' ? topics.find((topic) => topic.key === route.topic) : null;
  const topicDocuments =
    route.view === 'topic' ? matching.filter((doc) => doc.topic === route.topic) : [];
  const recent = [...matching]
    .sort(
      (a, b) =>
        b.updated.localeCompare(a.updated) ||
        a.title.localeCompare(b.title, 'ja') ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 10);
  const articleBody =
    selected && articleReady && article
      ? article.body.replace(/^#\s+([^\n]+)(?:\r?\n)+/, (heading, title: string) =>
          title.trim() === selected.title ? '' : heading,
        )
      : '';

  const navigate = useCallback((next: Route) => {
    const hash =
      next.view === 'home'
        ? '#/'
        : next.view === 'topic'
          ? `#/topic/${encodeURIComponent(next.topic)}${next.anchor ? `?anchor=${encodeURIComponent(next.anchor)}` : ''}`
          : `#/knowledge/${encodeURIComponent(next.id)}${next.anchor ? `?anchor=${encodeURIComponent(next.anchor)}` : ''}`;
    if (window.location.hash === hash) setRoute(next);
    else window.location.hash = hash;
    setDrawerOpen(false);
  }, []);
  const openInternal = (path: string, anchor?: string) => {
    const topic = topics.find((item) => item.path === path);
    if (topic) navigate({ view: 'topic', topic: topic.key, anchor: anchor ?? null });
    else {
      const doc = documents.find((item) => item.path === path);
      if (doc) navigate({ view: 'knowledge', id: doc.id, anchor: anchor ?? null });
    }
  };

  const sidebar = (
    <Paper component="aside" square elevation={0} className="sidebar" aria-label="ナビゲーション">
      <Stack className="controls" spacing={1}>
        <Box className="brand-row">
          <Button
            className="brand"
            onClick={() => navigate({ view: 'home' })}
            aria-label="ホームへ"
          >
            <span className="brand-mark">脳</span>
            <span>第2の脳</span>
          </Button>
        </Box>
        <TextField
          size="small"
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': '検索' } }}
          placeholder="タイトル・タグを検索"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <FormControl size="small" fullWidth>
          <Select
            aria-label="分類"
            displayEmpty
            value={kind}
            renderValue={(value) => (value ? kindNames[value] : 'すべての分類')}
            onChange={(event) => setKind(event.target.value as DocumentKind | '')}
          >
            {kinds.map((value) => (
              <MenuItem key={value || 'all'} value={value}>
                {value ? kindNames[value] : 'すべての分類'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button size="small" onClick={() => setRefresh((value) => value + 1)}>
          更新を確認
        </Button>
      </Stack>
      <Divider />
      <Box component="nav" className="topic-list" aria-label="トピック">
        <Typography className="nav-heading" variant="overline">
          トピック
        </Typography>
        {matchingTopics.map((topic) => (
          <Button
            key={topic.key}
            className="topic-button"
            variant={route.view === 'topic' && route.topic === topic.key ? 'contained' : 'text'}
            aria-current={route.view === 'topic' && route.topic === topic.key ? 'page' : undefined}
            onClick={() => navigate({ view: 'topic', topic: topic.key })}
          >
            {topic.label}
          </Button>
        ))}
        {status === 'ready' && matchingTopics.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            該当するトピックはありません。
          </Typography>
        )}
      </Box>
    </Paper>
  );
  return (
    <Box className={`viewer-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {sidebar}
      <Drawer className="mobile-drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box className="drawer-content">{sidebar}</Box>
      </Drawer>
      <Box component="main" ref={readerRef} className="reader" aria-live="polite">
        <header className="app-header">
          <IconButton
            className="menu-trigger"
            aria-label={!isMobile && sidebarOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={isMobile ? drawerOpen : sidebarOpen}
            onClick={() => {
              if (isMobile) setDrawerOpen(true);
              else setSidebarOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">☰</span>
          </IconButton>
          <Button
            className="header-title"
            onClick={() => {
              if (readerRef.current) readerRef.current.scrollTop = 0;
              window.scrollTo({ top: 0 });
            }}
            aria-label="第2の脳（ページの先頭へ戻る）"
          >
            <img src="/brain.svg" alt="" />
            第2の脳
          </Button>
        </header>
        {status === 'loading' && (
          <Box className="center-state">
            <CircularProgress />
            <Typography>一覧を読み込み中…</Typography>
          </Box>
        )}
        {status === 'error' && (
          <Box className="center-state">
            <Alert severity="error">一覧を読み込めませんでした。</Alert>
            <Button onClick={() => setRefresh((value) => value + 1)}>再読み込み</Button>
          </Box>
        )}
        {status === 'ready' && route.view === 'home' && (
          <section className="home-page">
            <Typography component="h1" variant="h1">
              最近更新された知識
            </Typography>
            <Typography color="text.secondary">
              表示中の条件に合う知識から新しい10件を表示します。
            </Typography>
            {recent.length ? (
              <div className="recent-grid">
                {recent.map((doc) => (
                  <Paper className="recent-card" key={doc.id} variant="outlined">
                    <Button
                      onClick={() => navigate({ view: 'knowledge', id: doc.id, anchor: null })}
                      className="recent-link"
                    >
                      <Typography component="span" variant="overline">
                        {doc.topicLabel} · {kindNames[doc.kind]}
                      </Typography>
                      <Typography component="span" variant="h6">
                        {doc.title}
                      </Typography>
                      <Typography component="span" variant="caption">
                        {doc.updated}
                      </Typography>
                    </Button>
                  </Paper>
                ))}
              </div>
            ) : (
              <Typography color="text.secondary">該当する知識はありません。</Typography>
            )}
          </section>
        )}
        {status === 'ready' && route.view === 'topic' && (
          <section className="topic-page">
            {currentTopic ? (
              <>
                <Typography component="h1" variant="h1">
                  {currentTopic.label}
                </Typography>
                {kinds.slice(1).map((value) => (
                  <section
                    className="topic-section"
                    id={headingSlug(kindNames[value as DocumentKind])}
                    key={value}
                  >
                    <Typography component="h2" variant="h5">
                      {kindNames[value as DocumentKind]}
                    </Typography>
                    <List>
                      {topicDocuments
                        .filter((doc) => doc.kind === value)
                        .sort(
                          (a, b) =>
                            a.title.localeCompare(b.title, 'ja') || a.id.localeCompare(b.id),
                        )
                        .map((doc) => (
                          <ListItem disablePadding key={doc.id}>
                            <ListItemButton
                              onClick={() =>
                                navigate({ view: 'knowledge', id: doc.id, anchor: null })
                              }
                            >
                              <ListItemText primary={doc.title} secondary={doc.tags.join(' · ')} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                    </List>
                    {topicDocuments.every((doc) => doc.kind !== value) && (
                      <Typography color="text.secondary">該当する知識はありません。</Typography>
                    )}
                  </section>
                ))}
              </>
            ) : (
              <Typography>トピックが見つかりません。</Typography>
            )}
          </section>
        )}
        {status === 'ready' &&
          route.view === 'knowledge' &&
          (selected ? (
            <article className="article">
              <header className="article-header">
                <Button
                  className="topic-crumb"
                  onClick={() => navigate({ view: 'topic', topic: selected.topic })}
                >
                  {selected.topicLabel}
                </Button>
                <Typography
                  component="span"
                  variant="overline"
                  color="primary.main"
                  sx={{ fontWeight: 700 }}
                >
                  {kindNames[selected.kind]}
                </Typography>
                <Typography component="h1" variant="h1">
                  {selected.title}
                </Typography>
                <div className="tags">
                  {selected.tags.map((tag) => (
                    <Chip key={tag} size="small" label={tag} />
                  ))}
                </div>
              </header>
              {articleError?.path === selected.path ? (
                <Alert severity="error">
                  {articleError.stale
                    ? '記事が更新されました。更新を確認してください。'
                    : '記事の読み込みに失敗しました。'}
                  {!articleError.stale && (
                    <Button onClick={() => setArticleAttempt((value) => value + 1)}>再試行</Button>
                  )}
                </Alert>
              ) : !articleReady ? (
                <Box className="article-loading">
                  <CircularProgress size={22} aria-label="記事を読み込み中" />
                  <Typography>記事を読み込み中…</Typography>
                </Box>
              ) : (
                <div className="markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      a: ({ href = '', children, node: _node, ...props }) => {
                        const internal = resolveInternalTarget(
                          selected.path,
                          href,
                          documents,
                          topics,
                        );
                        if (internal) {
                          let anchor = '';
                          try {
                            const fragment = href.includes('#')
                              ? href.slice(href.indexOf('#') + 1).split(/[?&]/, 1)[0]
                              : '';
                            anchor = decodeURIComponent(fragment);
                          } catch {
                            /* Invalid fragments are ignored. */
                          }
                          const topicTarget = topics.find((item) => item.path === internal);
                          const targetDoc = documents.find((item) => item.path === internal);
                          const targetHash = topicTarget
                            ? `#/topic/${encodeURIComponent(topicTarget.key)}${anchor ? `?anchor=${encodeURIComponent(anchor)}` : ''}`
                            : `#/knowledge/${encodeURIComponent(targetDoc?.id ?? '')}${anchor ? `?anchor=${encodeURIComponent(anchor)}` : ''}`;
                          return (
                            <a
                              href={targetHash}
                              onClick={(event) => {
                                event.preventDefault();
                                openInternal(internal, anchor || undefined);
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
                        <Typography
                          component="h1"
                          variant="h1"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      h2: ({ children, node: _node, ...props }) => (
                        <Typography
                          component="h2"
                          variant="h2"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      h3: ({ children, node: _node, ...props }) => (
                        <Typography
                          component="h3"
                          variant="h3"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      h4: ({ children, node: _node, ...props }) => (
                        <Typography
                          component="h4"
                          variant="h4"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      h5: ({ children, node: _node, ...props }) => (
                        <Typography
                          component="h5"
                          variant="h5"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      h6: ({ children, node: _node, ...props }) => (
                        <Typography
                          component="h6"
                          variant="h6"
                          id={headingSlug(textContent(children))}
                          {...props}
                        >
                          {children}
                        </Typography>
                      ),
                      img: ({ alt }) => <span className="image-alt">{alt ?? ''}</span>,
                    }}
                  >
                    {articleBody}
                  </ReactMarkdown>
                </div>
              )}
            </article>
          ) : (
            <Box className="center-state">
              <Typography>知識が見つかりません。</Typography>
              <Button onClick={() => navigate({ view: 'home' })}>ホームへ</Button>
            </Box>
          ))}
      </Box>
    </Box>
  );
}
