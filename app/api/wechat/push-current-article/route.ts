import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ARTICLE_TITLE = "当 AI 接进业务流程，大健康 IP 才真正开始提效";
const ARTICLE_DIGEST =
  "当 AI 不再只是帮我写稿，而是进入选题、文章、排版和后台承接，我开始看见一个更清晰的方向：AI + 大健康 IP 操盘手。";
const ARTICLE_AUTHOR = "陈七七77";

async function getAccessToken() {
  const appId = process.env.WECHAT_APP_ID || process.env.WX_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET || process.env.WX_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("缺少公众号 AppID 或 AppSecret，请检查 .env.local。");
  }

  const url = new URL("https://api.weixin.qq.com/cgi-bin/token");
  url.searchParams.set("grant_type", "client_credential");
  url.searchParams.set("appid", appId);
  url.searchParams.set("secret", appSecret);

  const response = await fetch(url);
  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`获取 access_token 失败：${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

async function createDraft(
  accessToken: string,
  content: string,
  overrideThumbMediaId?: string,
) {
  const thumbMediaId =
    overrideThumbMediaId ||
    process.env.WECHAT_COVER_MEDIA_ID ||
    process.env.WECHAT_THUMB_MEDIA_ID ||
    process.env.WX_COVER_MEDIA_ID ||
    process.env.WX_THUMB_MEDIA_ID;

  if (!thumbMediaId) {
    throw new Error(
      "缺少公众号封面素材 ID。请在 .env.local 配置 WECHAT_COVER_MEDIA_ID。",
    );
  }

  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articles: [
          {
            title: ARTICLE_TITLE,
            author: ARTICLE_AUTHOR,
            digest: ARTICLE_DIGEST.slice(0, 120),
            content,
            thumb_media_id: thumbMediaId,
            show_cover_pic: 1,
            need_open_comment: 1,
            only_fans_can_comment: 0,
          },
        ],
      }),
    },
  );

  const data = await response.json();

  if (!data.media_id) {
    throw new Error(`创建公众号草稿失败：${JSON.stringify(data)}`);
  }

  return data.media_id as string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      thumbMediaId?: string;
    };
    const htmlPath = path.join(
      process.cwd(),
      "public",
      "wechat_article_ai_health_workflow.html",
    );
    const html = await readFile(htmlPath, "utf8");
    const content = html
      .replace(/<!doctype html>/i, "")
      .replace(/^[\s\S]*?<body[^>]*>/i, "")
      .replace(/<\/body>[\s\S]*$/i, "")
      .trim();

    const accessToken = await getAccessToken();
    const mediaId = await createDraft(
      accessToken,
      content,
      body.thumbMediaId?.trim(),
    );

    return NextResponse.json({
      ok: true,
      message: "已同步到公众号草稿箱",
      mediaId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "同步失败",
      },
      { status: 500 },
    );
  }
}
