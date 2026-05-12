import { pushDailyRadarToFeishu } from "@/app/lib/feishu/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleCronPush(request);
}

export async function POST(request: Request) {
  return handleCronPush(request);
}

async function handleCronPush(request: Request) {
  const authResult = validateCronSecret(request);

  if (!authResult.ok) {
    return Response.json(
      {
        ok: false,
        message: authResult.message,
      },
      { status: authResult.status },
    );
  }

  const result = await pushDailyRadarToFeishu({ mode: "scheduled" });

  return Response.json({
    ok: result.ok,
    message: result.ok ? "今日内容雷达已推送到飞书。" : result.message,
  });
}

function validateCronSecret(request: Request):
  | { ok: true; status: 200; message: string }
  | { ok: false; status: 401 | 500; message: string } {
  const expectedSecret = process.env.CRON_SECRET?.trim();

  if (!expectedSecret) {
    return {
      ok: false,
      status: 500,
      message: "CRON_SECRET 未配置，请先在环境变量中配置。",
    };
  }

  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  const authorization = request.headers.get("authorization")?.trim();
  const bearerSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (headerSecret !== expectedSecret && bearerSecret !== expectedSecret) {
    return {
      ok: false,
      status: 401,
      message: "无权触发定时任务。",
    };
  }

  return {
    ok: true,
    status: 200,
    message: "校验通过。",
  };
}
