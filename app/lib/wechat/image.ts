import { readFile } from "node:fs/promises";
import path from "node:path";

import { uploadWechatContentImage } from "./client";
import type { WechatDraftReasonCode } from "./types";

const INTRO_CARD_LOCAL_SRC = "/qiqi/intro-card.png";
const INTRO_CARD_PUBLIC_PATH = "public/qiqi/intro-card.png";

type PrepareWechatContentHtmlResult = {
  ok: boolean;
  contentHtml: string;
  message: string;
  reasonCode?: WechatDraftReasonCode;
};

export async function prepareWechatContentHtml(
  contentHtml: string,
): Promise<PrepareWechatContentHtmlResult> {
  if (!contentHtml.includes(INTRO_CARD_LOCAL_SRC)) {
    return {
      ok: true,
      contentHtml,
      message: "正文 HTML 无需转换本地图片。",
    };
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(path.join(process.cwd(), INTRO_CARD_PUBLIC_PATH));
  } catch {
    return {
      ok: false,
      contentHtml,
      message: "未找到个人介绍图，请确认文件存在：public/qiqi/intro-card.png",
      reasonCode: "INTRO_IMAGE_NOT_FOUND",
    };
  }

  const uploadResult = await uploadWechatContentImage({
    buffer,
    filename: "intro-card.png",
    contentType: "image/png",
  });

  if (!uploadResult.ok || !uploadResult.url) {
    return {
      ok: false,
      contentHtml,
      message: normalizeIntroImageUploadMessage(uploadResult.reasonCode),
      reasonCode: mapContentImageReasonCode(uploadResult.reasonCode),
    };
  }

  return {
    ok: true,
    contentHtml: contentHtml.split(INTRO_CARD_LOCAL_SRC).join(uploadResult.url),
    message: "个人介绍图已转换为公众号可访问图片地址。",
  };
}

function normalizeIntroImageUploadMessage(reasonCode: string | undefined) {
  if (reasonCode === "WECHAT_IP_NOT_ALLOWED") {
    return "上传失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
  }
  if (reasonCode === "WECHAT_TOKEN_FAILED") {
    return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
  }
  if (reasonCode === "WECHAT_CONFIG_INVALID") {
    return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
  }
  if (reasonCode === "WECHAT_IMAGE_UPLOAD_FAILED") {
    return "个人介绍图上传失败，请检查公众号配置、IP 白名单或图片大小。";
  }
  return "个人介绍图处理失败，请稍后重试。";
}

function mapContentImageReasonCode(reasonCode: string | undefined): WechatDraftReasonCode {
  if (reasonCode === "WECHAT_IP_NOT_ALLOWED") return "WECHAT_IP_NOT_ALLOWED";
  if (reasonCode === "WECHAT_TOKEN_FAILED") return "WECHAT_TOKEN_FAILED";
  if (reasonCode === "WECHAT_CONFIG_INVALID") return "WECHAT_CONFIG_INVALID";
  if (reasonCode === "WECHAT_IMAGE_UPLOAD_FAILED") return "WECHAT_IMAGE_UPLOAD_FAILED";
  return "UNKNOWN";
}
