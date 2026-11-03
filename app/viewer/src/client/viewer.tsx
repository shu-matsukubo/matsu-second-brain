import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
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
} from '@mui/material';
import type { ReactNode } from 'react';
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Article, DocumentKind, DocumentMetadata, Library } from '../shared/library';

const kindNames: Record<DocumentKind, string> = {
  index: 'Index',
  fact: 'Fact',
  principle: 'Principle',
  idea: 'Idea',
};
const kinds: Array<DocumentKind | ''> = ['', 'index', 'fact', 'principle', 'idea'];

export function resolveInternalTarget(
  currentPath: string,
  href: string,
  documents: DocumentMetadata[],
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
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [snapshot, setSnapshot] = useState('');
  const articleCache = useRef(new Map<string, Promise<Article>>());
  const [article, setArticle] = useState<Article | null>(null);
  const [articleError, setArticleError] = useState<{ path: string; stale: boolean } | null>(null);
  const [articleAttempt, setArticleAttempt] = useState(0);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState<DocumentKind | ''>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const selected = documents.find((doc) => doc.path === selectedPath) ?? null;
  const articleReady = article?.path === selected?.path && article?.snapshot === snapshot;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(new URL('/api/library', window.location.origin), {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('library_unavailable');
        const library = (await response.json()) as Library;
        if (!Array.isArray(library.documents) || !/^[a-f0-9]{40}$/.test(library.snapshot))
          throw new Error('invalid_library');
        if (cancelled) return;
        setDocuments(library.documents);
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
  }, []);

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
    if (status !== 'ready' || !articleReady) return;
    if (selectedAnchor && selectedPath) {
      const target = document.getElementById(selectedAnchor);
      if (target) {
        target.scrollIntoView?.({ block: 'start' });
        return;
      }
    }
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, [selectedAnchor, selectedPath, status, articleReady]);

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
      const haystack = `${doc.title}\n${doc.tags.join(' ')}`.toLocaleLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [documents, kind, query, topic]);
  const articleBody =
    selected && articleReady && article
      ? article.body.replace(/^#\s+([^\n]+)(?:\r?\n)+/, (heading, title: string) =>
          title.trim() === selected.title ? '' : heading,
        )
      : '';

  const navigate = useCallback((path: string, anchor?: string) => {
    const base = encodeURIComponent(path);
    window.location.hash = anchor ? `${base}?anchor=${encodeURIComponent(anchor)}` : base;
  }, []);

  return (
    <Box className="viewer-shell">
      <Paper
        component="aside"
        square
        elevation={0}
        className="sidebar"
        aria-label="ドキュメント一覧"
      >
        <Stack className="controls" spacing={1.25}>
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
              aria-label="トピック"
              displayEmpty
              value={topic}
              renderValue={(value) => value || 'すべてのトピック'}
              onChange={(event) => setTopic(event.target.value)}
            >
              <MenuItem value="">すべてのトピック</MenuItem>
              {topics.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        </Stack>
        <Divider />
        <Box component="nav" className="document-list" aria-label="検索結果">
          {status === 'loading' && (
            <Box className="state" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} aria-label="読み込み中" />
              <Typography color="text.secondary">読み込み中…</Typography>
            </Box>
          )}
          {status === 'error' && (
            <Alert severity="error" className="state">
              読み込みに失敗しました。
            </Alert>
          )}
          {status === 'ready' && visible.length === 0 && (
            <Typography className="state" color="text.secondary">
              該当するドキュメントはありません。
            </Typography>
          )}
          <List disablePadding>
            {visible.map((doc) => (
              <ListItem key={doc.path} disablePadding>
                <ListItemButton
                  component="button"
                  type="button"
                  selected={selected?.path === doc.path}
                  aria-current={selected?.path === doc.path ? 'page' : undefined}
                  onClick={() => navigate(doc.path)}
                >
                  <ListItemText
                    primary={doc.title}
                    secondary={`${kindNames[doc.kind]}${doc.kind !== 'index' ? ` · ${doc.topic}` : ''}`}
                    slotProps={{
                      primary: { sx: { fontWeight: 600, overflowWrap: 'anywhere' } },
                      secondary: { sx: { fontSize: '0.78rem' } },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>
      <Box component="main" ref={readerRef} className="reader" aria-live="polite">
        {status === 'error' ? (
          <Typography component="p" className="reader-state" color="error.main">
            ドキュメントを読み込めませんでした。
          </Typography>
        ) : selected ? (
          <article className="article">
            <header className="article-header">
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
              {selected.tags.length > 0 && (
                <div className="tags">
                  {selected.tags.map((tag) => (
                    <Chip key={tag} size="small" label={tag} />
                  ))}
                </div>
              )}
            </header>
            {articleError?.path === selected.path ? (
              <Alert severity="error">
                {articleError.stale
                  ? '記事が更新されました。ページを再読み込みしてください。'
                  : '記事の読み込みに失敗しました。'}
                {!articleError.stale && (
                  <Button onClick={() => setArticleAttempt((value) => value + 1)}>再試行</Button>
                )}
              </Alert>
            ) : !articleReady ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} aria-label="記事を読み込み中" />
                <Typography>記事を読み込み中…</Typography>
              </Box>
            ) : (
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
          <p className="reader-state">
            {status === 'loading'
              ? '一覧を読み込み中…'
              : selectedPath
                ? 'ドキュメントが見つかりません。'
                : documents.length
                  ? '一覧から記事を選択してください。'
                  : 'ドキュメントがありません。'}
          </p>
        )}
      </Box>
    </Box>
  );
}
