import { Hono } from "hono";
import { html } from "hono/html";
import { googleAuth } from "@hono/oauth-providers/google";
import { sign, verify } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";

// 環境変数の型定義
type Bindings = {
  GITHUB_TOKEN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  MY_EMAIL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const OWNER = "shu-matsukubo";
const REPO = "matsu-second-brain";

// 認証チェック用の共通ミドルウェア
const authMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, "auth_token");
  if (!token) {
    return c.redirect("/auth-required");
  }
  try {
    // クッキーのトークンが正しいか、改ざんされていないか検証
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    if (payload.email !== c.env.MY_EMAIL) {
      return c.text("アクセス権限がありません", 403);
    }
    await next();
  } catch (e) {
    return c.redirect("/auth-required");
  }
};

// ログインを促す画面（未ログイン時に自動で飛ばされる）
app.get("/auth-required", (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sign In Required</title>
        <style>
          body {
            font-family: sans-serif;
            text-align: center;
            padding-top: 100px;
            background: #fafafa;
            color: #333;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h2>shu専用 Inbox</h2>
        <p>利用するにはサインインが必要です。</p>
        <a class="btn" href="/login">Googleアカウントでログイン</a>
      </body>
    </html>
  `);
});

// Google認証処理（アクセスすると自動でGoogleの画面へ）
// ※Honoの仕様により、c.env内のGOOGLE_CLIENT_ID / SECRET が自動で使われます
app.get(
  "/login",
  (c, next) => {
    return googleAuth({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email"],
    })(c, next);
  },
  async (c) => {
    const googleUser = c.get("user-google");

    // ログインしたメアドが、自分のメアドと一致するか厳格にチェック！
    if (!googleUser || googleUser.email !== c.env.MY_EMAIL) {
      return c.text(
        "あなたはこのアプリへのアクセスを許可されていません。",
        403,
      );
    }

    // 認証OKなら、1年間有効なJWTトークンを作成
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
    const token = await sign(
      { email: googleUser.email, exp },
      c.env.JWT_SECRET,
    );

    // トークンをブラウザのクッキーに安全に保存（これで1年間はログイン不要）
    setCookie(c, "auth_token", token, {
      path: "/",
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "Lax",
    });

    return c.redirect("/");
  },
);

// メモ入力画面（認証ミドルウェアで保護）
app.get("/", authMiddleware, (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <title>Quick Brain Inbox</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 15px;
            max-width: 500px;
            margin: 0 auto;
            background: #fafafa;
          }
          textarea {
            width: 100%;
            height: 250px;
            padding: 12px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-sizing: border-box;
            resize: none;
          }
          button {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            font-weight: bold;
            background: #24292e;
            color: white;
            border: none;
            border-radius: 6px;
            margin-top: 12px;
            cursor: pointer;
            -webkit-appearance: none;
          }
          button:active {
            background: #555;
          }
        </style>
      </head>
      <body>
        <form action="/submit" method="POST">
          <textarea
            name="memo"
            placeholder="今考えていることをメモ..."
            autofocus
          ></textarea>
          <button type="submit">送信して脳から出す</button>
        </form>
      </body>
    </html>
  `);
});

// GitHubへ新規ファイルとして即プッシュ（認証ミドルウェアで保護）
app.post("/submit", authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const memo = body.memo as string;

  if (!memo || memo.trim() === "") {
    return c.redirect("/");
  }

  // Cloudflare Workers（UTC）上で日本時間（JST）を計算
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");

  // パスの生成: daily/yyyy/mm/dd-hhmmss.md
  const path = `daily/${yyyy}/${mm}/${dd}-${hh}${min}${ss}.md`;
  const timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

  // AIが後から一括処理（grepなど）しやすい固定フロントマターを付与
  const fileContent = `---
status: new
登録日時: ${timestamp}
---

${memo.trim()}
`;

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const encodedContent = btoa(unescape(encodeURIComponent(fileContent))); // 日本語対応のBase64化

  // 既存ファイルの存在チェックはせず、直接新規作成(PUT)を投げる
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Cloudflare-Worker",
    },
    body: JSON.stringify({
      message: `📥 New memo: ${dd}-${hh}${min}${ss}`,
      content: encodedContent,
    }),
  });

  if (res.status === 201) {
    // 成功したら、すぐ次のメモが打てるように真っ白な入力画面に戻す
    return c.redirect("/");
  } else {
    const errText = await res.text();
    return c.text(`GitHubへのプッシュに失敗しました: ${errText}`, 500);
  }
});

export default app;
