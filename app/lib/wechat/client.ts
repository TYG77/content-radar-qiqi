import type {
  WechatContentImageReasonCode,
  WechatContentImageUploadInput,
  WechatContentImageUploadResult,
  WechatConfigStatus,
  WechatDraftArticleInput,
  WechatDraftReasonCode,
  WechatDraftResult,
  WechatMaterialReasonCode,
  WechatMaterialUploadResult,
} from "./types";

const REQUIRED_WECHAT_KEYS = [
  "WECHAT_APP_ID",
  "WECHAT_APP_SECRET",
  "WECHAT_DEFAULT_THUMB_MEDIA_ID",
] as const;

const WECHAT_ACCESS_TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
const WECHAT_DRAFT_ADD_URL = "https://api.weixin.qq.com/cgi-bin/draft/add";
const WECHAT_MATERIAL_ADD_URL = "https://api.weixin.qq.com/cgi-bin/material/add_material";
const WECHAT_CONTENT_IMAGE_UPLOAD_URL = "https://api.weixin.qq.com/cgi-bin/media/uploadimg";
const MAX_COVER_IMAGE_SIZE = 2 * 1024 * 1024;

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

class WechatClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DRAFT_DISABLED"
      | "CONFIG_INCOMPLETE"
      | "THUMB_MEDIA_ID_MISSING"
      | "CONTENT_EMPTY"
      | "IP_ALLOWLIST"
      | "MATERIAL_INVALID"
      | "MATERIAL_TOO_LARGE"
      | "MATERIAL_FAILED"
      | "CONTENT_IMAGE_UPLOAD_FAILED"
      | "TOKEN_FAILED"
      | "DRAFT_ADD_FAILED"
      | "WECHAT_API_ERROR",
  ) {
    super(message);
  }
}

export function getWechatConfigStatus(): WechatConfigStatus {
  const enabled = process.env.WECHAT_DRAFT_ENABLED === "true";
  const hasAppId = Boolean(process.env.WECHAT_APP_ID?.trim());
  const hasAppSecret = Boolean(process.env.WECHAT_APP_SECRET?.trim());
  const hasThumbMediaId = Boolean(process.env.WECHAT_DEFAULT_THUMB_MEDIA_ID?.trim());
  const missingKeys = REQUIRED_WECHAT_KEYS.filter((key) => !process.env[key]?.trim());

  return {
    enabled,
    hasAppId,
    hasAppSecret,
    hasThumbMediaId,
    missingKeys,
  };
}

export async function getWechatAccessToken() {
  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    throw new WechatClientError(
      "公众号配置不完整，请检查 AppID 和 AppSecret。",
      "CONFIG_INCOMPLETE",
    );
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.value;
  }

  const params = new URLSearchParams({
    grant_type: "client_credential",
    appid: appId,
    secret: appSecret,
  });

  try {
    const response = await fetch(`${WECHAT_ACCESS_TOKEN_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const result = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.access_token) {
      throw new WechatClientError(
        getWechatApiMessage(result.errcode, "获取公众号 access_token 失败，请检查公众号配置。"),
        normalizeWechatErrorCode(result.errcode) === "WECHAT_API_ERROR"
          ? "TOKEN_FAILED"
          : normalizeWechatErrorCode(result.errcode),
      );
    }

    cachedAccessToken = {
      value: result.access_token,
      expiresAt: Date.now() + Math.max(60, (result.expires_in ?? 7200) - 300) * 1000,
    };

    return result.access_token;
  } catch (error) {
    if (error instanceof WechatClientError) throw error;
    throw new WechatClientError(
      "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。",
      "TOKEN_FAILED",
    );
  }
}

export function buildWechatDraftPayload(input: WechatDraftArticleInput) {
  return {
    articles: [
      {
        title: input.title,
        thumb_media_id: input.thumbMediaId,
        author: input.author,
        digest: input.digest,
        show_cover_pic: 0,
        content: input.contentHtml,
        content_source_url: "",
        need_open_comment: input.needOpenComment ? 1 : 0,
        only_fans_can_comment: input.onlyFansCanComment ? 1 : 0,
      },
    ],
  };
}

export async function createWechatDraft(
  input: WechatDraftArticleInput,
): Promise<WechatDraftResult> {
  try {
    validateWechatDraftInput(input);
    const accessToken = await getWechatAccessToken();
    const response = await fetch(
      `${WECHAT_DRAFT_ADD_URL}?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildWechatDraftPayload(input)),
        cache: "no-store",
      },
    );
    const result = (await response.json()) as {
      media_id?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.media_id) {
      throw new WechatClientError(
        getWechatApiMessage(
          result.errcode,
          "写入公众号草稿箱失败，请检查公众号配置、IP 白名单或封面素材 media_id。",
        ),
        normalizeWechatErrorCode(result.errcode) === "WECHAT_API_ERROR"
          ? "DRAFT_ADD_FAILED"
          : normalizeWechatErrorCode(result.errcode),
      );
    }

    return {
      ok: true,
      mediaId: result.media_id,
      message: "已写入公众号草稿箱，请进入公众号后台草稿箱查看并手动发布。",
    };
  } catch (error) {
    return {
      ok: false,
      mediaId: "",
      message:
        error instanceof WechatClientError
          ? getWechatDraftMessage(error.code)
          : "写入公众号草稿箱失败，请稍后重试。",
      reasonCode:
        error instanceof WechatClientError
          ? toDraftReasonCode(error.code)
          : "UNKNOWN",
    };
  }
}

export async function uploadWechatPermanentImage(
  file: File,
): Promise<WechatMaterialUploadResult> {
  try {
    validateWechatImageFile(file);
    const accessToken = await getWechatAccessToken();
    const formData = new FormData();
    formData.append("media", file, file.name);

    const response = await fetch(
      `${WECHAT_MATERIAL_ADD_URL}?access_token=${encodeURIComponent(accessToken)}&type=image`,
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      },
    );
    const result = (await response.json()) as {
      media_id?: string;
      url?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.media_id) {
      const code = normalizeWechatErrorCode(result.errcode);
      throw new WechatClientError(
        getWechatMaterialMessage(code === "WECHAT_API_ERROR" ? "MATERIAL_FAILED" : code),
        code === "WECHAT_API_ERROR" ? "MATERIAL_FAILED" : code,
      );
    }

    return {
      ok: true,
      mediaId: result.media_id,
      message: "已获取封面 media_id。",
    };
  } catch (error) {
    if (error instanceof WechatClientError) {
      return {
        ok: false,
        mediaId: "",
        message: getWechatMaterialMessage(error.code),
        reasonCode: toMaterialReasonCode(error.code),
      };
    }

    return {
      ok: false,
      mediaId: "",
      message: "封面素材上传失败，请稍后重试或手动填写 media_id。",
      reasonCode: "UNKNOWN",
    };
  }
}

export async function uploadWechatContentImage(
  image: WechatContentImageUploadInput,
): Promise<WechatContentImageUploadResult> {
  try {
    const accessToken = await getWechatAccessToken();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(image.buffer)], { type: image.contentType });
    formData.append("media", blob, image.filename);

    const response = await fetch(
      `${WECHAT_CONTENT_IMAGE_UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      },
    );
    const result = (await response.json()) as {
      url?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.url) {
      const code = normalizeWechatErrorCode(result.errcode);
      throw new WechatClientError(
        getWechatContentImageMessage(
          code === "WECHAT_API_ERROR" ? "CONTENT_IMAGE_UPLOAD_FAILED" : code,
        ),
        code === "WECHAT_API_ERROR" ? "CONTENT_IMAGE_UPLOAD_FAILED" : code,
      );
    }

    return {
      ok: true,
      url: result.url,
      message: "个人介绍图已转换为公众号可访问图片地址。",
    };
  } catch (error) {
    if (error instanceof WechatClientError) {
      return {
        ok: false,
        url: "",
        message: getWechatContentImageMessage(error.code),
        reasonCode: toContentImageReasonCode(error.code),
      };
    }

    return {
      ok: false,
      url: "",
      message: "个人介绍图处理失败，请稍后重试。",
      reasonCode: "UNKNOWN",
    };
  }
}

function validateWechatDraftInput(input: WechatDraftArticleInput) {
  const status = getWechatConfigStatus();

  if (!status.enabled) {
    throw new WechatClientError(
      "草稿箱未启用，请在 .env.local 中设置 WECHAT_DRAFT_ENABLED=true。",
      "DRAFT_DISABLED",
    );
  }

  if (!status.hasAppId || !status.hasAppSecret) {
    throw new WechatClientError(
      "公众号配置不完整，请检查 AppID 和 AppSecret。",
      "CONFIG_INCOMPLETE",
    );
  }

  if (!input.contentHtml.trim()) {
    throw new WechatClientError(
      "当前没有可写入的公众号排版内容，请先生成公众号排版。",
      "CONTENT_EMPTY",
    );
  }

  if (!input.thumbMediaId.trim()) {
    throw new WechatClientError(
      "缺少默认封面素材 media_id，请先上传封面图或手动填写 thumb_media_id。",
      "THUMB_MEDIA_ID_MISSING",
    );
  }
}

function validateWechatImageFile(file: File) {
  const supportedTypes = new Set(["image/jpeg", "image/png"]);
  const supportedName = /\.(jpe?g|png)$/i.test(file.name);

  if (!supportedTypes.has(file.type) && !supportedName) {
    throw new WechatClientError("仅支持 jpg、jpeg、png 格式封面图。", "MATERIAL_INVALID");
  }

  if (file.size > MAX_COVER_IMAGE_SIZE) {
    throw new WechatClientError("封面图文件过大，请压缩后再上传。", "MATERIAL_TOO_LARGE");
  }
}

function normalizeWechatErrorCode(errcode?: number): WechatClientError["code"] {
  if (errcode === 40164 || errcode === 89503 || errcode === 89501) return "IP_ALLOWLIST";
  if (errcode === 40001 || errcode === 40013 || errcode === 40125) return "CONFIG_INCOMPLETE";
  if (errcode === 41006 || errcode === 40007 || errcode === 40009) return "THUMB_MEDIA_ID_MISSING";
  return "WECHAT_API_ERROR";
}

function getWechatApiMessage(errcode: number | undefined, fallback: string) {
  const code = normalizeWechatErrorCode(errcode);

  if (code === "IP_ALLOWLIST") {
    return "写入失败，可能是公众号 IP 白名单未配置，请检查公众号后台基本配置。";
  }
  if (code === "CONFIG_INCOMPLETE") {
    return "公众号配置不完整，请检查 AppID 和 AppSecret。";
  }
  if (code === "THUMB_MEDIA_ID_MISSING") {
    return "缺少默认封面素材 media_id，请先上传封面图或手动填写 thumb_media_id。";
  }
  return fallback;
}

function getWechatDraftMessage(code: WechatClientError["code"]) {
  if (code === "DRAFT_DISABLED") {
    return "草稿箱未启用，请先确认公众号草稿箱配置。";
  }
  if (code === "CONFIG_INCOMPLETE") {
    return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
  }
  if (code === "THUMB_MEDIA_ID_MISSING") {
    return "请先上传封面图并获取 media_id，或手动填写 thumb_media_id。";
  }
  if (code === "CONTENT_EMPTY") {
    return "当前没有可写入的公众号排版内容，请先生成公众号排版。";
  }
  if (code === "IP_ALLOWLIST") {
    return "写入失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
  }
  if (code === "TOKEN_FAILED") {
    return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
  }
  if (code === "DRAFT_ADD_FAILED") {
    return "写入公众号草稿箱失败，请检查公众号草稿箱接口权限。";
  }
  return "写入公众号草稿箱失败，请检查公众号草稿箱接口权限。";
}

function getWechatMaterialMessage(code: string) {
  if (code === "CONFIG_INCOMPLETE") return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
  if (code === "IP_ALLOWLIST") return "上传失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
  if (code === "MATERIAL_INVALID") return "仅支持 jpg、jpeg、png 格式封面图。";
  if (code === "MATERIAL_TOO_LARGE") return "封面图文件过大，请压缩后再上传。";
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") {
    return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
  }
  if (code === "MATERIAL_FAILED") {
    return "封面素材上传失败，请检查公众号素材接口权限或稍后重试。";
  }
  if (code === "CONFIG_INCOMPLETE") {
    return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
  }
  if (code === "IP_ALLOWLIST") {
    return "上传失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
  }
  if (code === "MATERIAL_INVALID") {
    return "仅支持 jpg、jpeg、png 格式封面图。";
  }
  if (code === "MATERIAL_TOO_LARGE") {
    return "封面图文件过大，请压缩后再上传。";
  }
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") {
    return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
  }
  return "封面素材上传失败，请检查公众号素材接口权限或稍后重试。";
}

function toMaterialReasonCode(code: WechatClientError["code"]): WechatMaterialReasonCode {
  if (code === "CONFIG_INCOMPLETE") return "WECHAT_CONFIG_INVALID";
  if (code === "IP_ALLOWLIST") return "WECHAT_IP_NOT_ALLOWED";
  if (code === "MATERIAL_INVALID") return "INVALID_FILE_TYPE";
  if (code === "MATERIAL_TOO_LARGE") return "FILE_TOO_LARGE";
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") return "WECHAT_TOKEN_FAILED";
  if (code === "THUMB_MEDIA_ID_MISSING" || code === "MATERIAL_FAILED") {
    return "WECHAT_MATERIAL_FAILED";
  }
  return "UNKNOWN";
}

function getWechatContentImageMessage(code: string) {
  if (code === "CONFIG_INCOMPLETE") {
    return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
  }
  if (code === "IP_ALLOWLIST") {
    return "上传失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
  }
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") {
    return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
  }
  if (code === "CONTENT_IMAGE_UPLOAD_FAILED") {
    return "个人介绍图上传失败，请检查公众号配置、IP 白名单或图片大小。";
  }
  return "个人介绍图处理失败，请稍后重试。";
}

function toContentImageReasonCode(
  code: WechatClientError["code"],
): WechatContentImageReasonCode {
  if (code === "CONFIG_INCOMPLETE") return "WECHAT_CONFIG_INVALID";
  if (code === "IP_ALLOWLIST") return "WECHAT_IP_NOT_ALLOWED";
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") return "WECHAT_TOKEN_FAILED";
  if (code === "CONTENT_IMAGE_UPLOAD_FAILED") return "WECHAT_IMAGE_UPLOAD_FAILED";
  return "UNKNOWN";
}

function toDraftReasonCode(code: WechatClientError["code"]): WechatDraftReasonCode {
  if (code === "DRAFT_DISABLED") return "DRAFT_DISABLED";
  if (code === "CONFIG_INCOMPLETE") return "WECHAT_CONFIG_INVALID";
  if (code === "THUMB_MEDIA_ID_MISSING") return "THUMB_MEDIA_ID_MISSING";
  if (code === "CONTENT_EMPTY") return "CONTENT_EMPTY";
  if (code === "IP_ALLOWLIST") return "WECHAT_IP_NOT_ALLOWED";
  if (code === "TOKEN_FAILED" || code === "WECHAT_API_ERROR") return "WECHAT_TOKEN_FAILED";
  if (code === "DRAFT_ADD_FAILED") return "WECHAT_DRAFT_ADD_FAILED";
  return "UNKNOWN";
}
