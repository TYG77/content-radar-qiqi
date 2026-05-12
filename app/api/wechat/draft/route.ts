import {
  createWechatDraft,
  getWechatConfigStatus,
} from "@/app/lib/wechat/client";
import { prepareWechatContentHtml } from "@/app/lib/wechat/image";
import type { WechatDraftArticleInput } from "@/app/lib/wechat/types";

export const runtime = "nodejs";

export async function GET() {
  const status = getWechatConfigStatus();

  return Response.json({
    ok: true,
    enabled: status.enabled,
    hasAppId: status.hasAppId,
    hasAppSecret: status.hasAppSecret,
    hasThumbMediaId: status.hasThumbMediaId,
    message: status.hasThumbMediaId ? "已配置默认封面素材。" : "未配置默认封面素材。",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<WechatDraftArticleInput>;
    const status = getWechatConfigStatus();

    if (!status.enabled) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "草稿箱未启用，请先确认公众号草稿箱配置。",
        reasonCode: "DRAFT_DISABLED",
      });
    }

    const missingAppKeys = status.missingKeys.filter(
      (key) => key === "WECHAT_APP_ID" || key === "WECHAT_APP_SECRET",
    );
    if (missingAppKeys.length > 0) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "公众号 AppID 或 AppSecret 可能不正确，请检查配置。",
        reasonCode: "WECHAT_CONFIG_INVALID",
        missingKeys: missingAppKeys,
      });
    }

    const thumbMediaId = stringValue(
      body.thumbMediaId,
      process.env.WECHAT_DEFAULT_THUMB_MEDIA_ID || "",
    );

    if (!thumbMediaId) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "请先上传封面图并获取 media_id，或手动填写 thumb_media_id。",
        reasonCode: "THUMB_MEDIA_ID_MISSING",
        missingKeys: ["WECHAT_DEFAULT_THUMB_MEDIA_ID"],
      });
    }

    const contentHtml = stringValue(body.contentHtml);
    const preparedHtml = await prepareWechatContentHtml(contentHtml);

    if (!preparedHtml.ok) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: preparedHtml.message,
        reasonCode: preparedHtml.reasonCode || "UNKNOWN",
      });
    }

    const result = await createWechatDraft({
      title: stringValue(body.title),
      digest: stringValue(body.digest),
      contentHtml: preparedHtml.contentHtml,
      author: stringValue(body.author, process.env.WECHAT_AUTHOR || "陈七七77"),
      thumbMediaId,
      needOpenComment: process.env.WECHAT_COMMENT_OPEN === "true",
      onlyFansCanComment: process.env.WECHAT_ONLY_FANS_CAN_COMMENT === "true",
    });

    return Response.json(result);
  } catch {
    return Response.json({
      ok: false,
      mediaId: "",
      message: "写入公众号草稿箱失败，请检查公众号草稿箱接口权限。",
      reasonCode: "UNKNOWN",
    });
  }
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
