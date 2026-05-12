import { uploadWechatPermanentImage } from "@/app/lib/wechat/client";

export const runtime = "nodejs";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_COVER_IMAGE_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "请先选择一张封面图。",
        reasonCode: "MISSING_FILE",
      });
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "仅支持 jpg、jpeg、png 格式封面图。",
        reasonCode: "INVALID_FILE_TYPE",
      });
    }

    if (file.size > MAX_COVER_IMAGE_SIZE) {
      return Response.json({
        ok: false,
        mediaId: "",
        message: "封面图文件过大，请压缩后再上传。",
        reasonCode: "FILE_TOO_LARGE",
      });
    }

    const result = await uploadWechatPermanentImage(file);

    return Response.json(result);
  } catch {
    return Response.json({
      ok: false,
      mediaId: "",
      message: "封面素材上传失败，请稍后重试或手动填写 media_id。",
      reasonCode: "UNKNOWN",
    });
  }
}
