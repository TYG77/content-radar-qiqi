import {
  buildDailyRadarMessage,
  buildFeishuTextPayload,
  generateDailyRadarTopTopics,
} from "@/app/lib/daily-radar-push";

export const runtime = "nodejs";

export async function GET() {
  const topics = generateDailyRadarTopTopics(3);
  const message = buildDailyRadarMessage(topics);

  return Response.json({
    ok: true,
    pushed: false,
    message,
    topics,
  });
}

export async function POST() {
  const webhookUrl = process.env.FEISHU_WEBHOOK_URL?.trim();
  const topics = generateDailyRadarTopTopics(3);
  const message = buildDailyRadarMessage(topics);

  if (!webhookUrl) {
    return Response.json(
      {
        ok: false,
        pushed: false,
        error: {
          code: "FEISHU_WEBHOOK_URL_MISSING",
          message: "FEISHU_WEBHOOK_URL is not configured.",
        },
        message,
        topics,
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildFeishuTextPayload(message)),
    });
    const responseText = await response.text();
    const feishuResult = parseJsonResponse(responseText);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          pushed: false,
          error: {
            code: `FEISHU_HTTP_${response.status}`,
            message: "Feishu webhook request failed.",
            detail: feishuResult ?? responseText,
          },
          message,
          topics,
        },
        { status: response.status },
      );
    }

    return Response.json({
      ok: true,
      pushed: true,
      message,
      topics,
      feishuResult: feishuResult ?? responseText,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        pushed: false,
        error: {
          code: "FEISHU_WEBHOOK_REQUEST_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unknown Feishu webhook request error.",
        },
        message,
        topics,
      },
      { status: 502 },
    );
  }
}

function parseJsonResponse(text: string) {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
