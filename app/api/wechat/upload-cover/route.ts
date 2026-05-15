import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("cover");

    if (!(file instanceof File)) {
      throw new Error("请先选择一张封面图。");
    }

    const accessToken = await getAccessToken();
    const uploadFormData = new FormData();
    uploadFormData.set("media", file, file.name || "cover.jpg");

    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
      {
        method: "POST",
        body: uploadFormData,
      },
    );
    const data = await response.json();

    if (!data.media_id) {
      throw new Error(`上传封面失败：${JSON.stringify(data)}`);
    }

    return NextResponse.json({
      ok: true,
      message: "封面已上传",
      mediaId: data.media_id,
      url: data.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "上传封面失败",
      },
      { status: 500 },
    );
  }
}
