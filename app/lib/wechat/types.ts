export type WechatDraftArticleInput = {
  title: string;
  digest: string;
  contentHtml: string;
  author: string;
  thumbMediaId: string;
  needOpenComment: boolean;
  onlyFansCanComment: boolean;
};

export type WechatDraftResult = {
  ok: boolean;
  mediaId: string;
  message: string;
  reasonCode?: WechatDraftReasonCode;
};

export type WechatConfigStatus = {
  enabled: boolean;
  hasAppId: boolean;
  hasAppSecret: boolean;
  hasThumbMediaId: boolean;
  missingKeys: string[];
};

export type WechatMaterialUploadResult = {
  ok: boolean;
  mediaId: string;
  message: string;
  reasonCode?: WechatMaterialReasonCode;
};

export type WechatContentImageUploadInput = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export type WechatContentImageUploadResult = {
  ok: boolean;
  url: string;
  message: string;
  reasonCode?: WechatContentImageReasonCode;
};

export type WechatCoverState = {
  thumbMediaId: string;
  source: "env" | "uploaded" | "manual" | "missing";
  message: string;
};

export type WechatMaterialReasonCode =
  | "MISSING_FILE"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "WECHAT_CONFIG_INVALID"
  | "WECHAT_IP_NOT_ALLOWED"
  | "WECHAT_TOKEN_FAILED"
  | "WECHAT_MATERIAL_FAILED"
  | "UNKNOWN";

export type WechatContentImageReasonCode =
  | "WECHAT_CONFIG_INVALID"
  | "WECHAT_IP_NOT_ALLOWED"
  | "WECHAT_TOKEN_FAILED"
  | "WECHAT_IMAGE_UPLOAD_FAILED"
  | "UNKNOWN";

export type WechatDraftReasonCode =
  | "DRAFT_DISABLED"
  | "WECHAT_CONFIG_INVALID"
  | "THUMB_MEDIA_ID_MISSING"
  | "CONTENT_EMPTY"
  | "INTRO_IMAGE_NOT_FOUND"
  | "WECHAT_IMAGE_UPLOAD_FAILED"
  | "WECHAT_IP_NOT_ALLOWED"
  | "WECHAT_TOKEN_FAILED"
  | "WECHAT_DRAFT_ADD_FAILED"
  | "UNKNOWN";
