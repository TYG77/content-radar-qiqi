import { pushDailyRadarToFeishu } from "@/app/lib/feishu/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const result = await pushDailyRadarToFeishu({
      hotspots: body.hotspots,
      mode: body.mode === "scheduled" ? "scheduled" : "manual_test",
    });

    return Response.json({
      ok: result.ok,
      message: result.message,
    });
  } catch {
    return Response.json({
      ok: false,
      message: "飞书推送失败，请稍后重试。",
    });
  }
}

async function readRequestBody(request: Request): Promise<{
  hotspots?: unknown;
  mode?: unknown;
}> {
  try {
    return (await request.json()) as { hotspots?: unknown; mode?: unknown };
  } catch {
    return {};
  }
}
