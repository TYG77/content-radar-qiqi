import { runAiTask } from "@/app/lib/ai/tasks";
import { AiTaskError, getAiProviderMetadata } from "@/app/lib/ai/client";
import type { AiRequest } from "@/app/lib/ai/schemas";
import { getSearchProviderConfig } from "@/app/lib/search/client";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, ...getAiProviderMetadata(), ...getSearchProviderMetadata() });
}

export async function POST(request: Request) {
  let body: Partial<AiRequest> | null = null;

  try {
    body = (await request.json()) as AiRequest;
    const aiMetadata = getAiProviderMetadata();

    if (!body?.task || !body.payload) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_AI_REQUEST",
            message: "Invalid AI request payload.",
          },
          task: body?.task ?? "unknown",
          ...aiMetadata,
          ...getSearchProviderMetadata(),
          fallback: true,
        },
        { status: 400 },
      );
    }

    const data = await runAiTask(body as AiRequest);

    return Response.json({ ok: true, data, task: body.task, ...aiMetadata, ...getSearchProviderMetadata() });
  } catch (error) {
    const aiMetadata = getAiProviderMetadata();
    const normalizedError = normalizeAiError(error);
    const status =
      "status" in normalizedError &&
      typeof normalizedError.status === "number" &&
      normalizedError.status >= 400
        ? normalizedError.status
        : 200;

    return Response.json({
      ok: false,
      error: normalizedError,
      task: body?.task ?? "unknown",
      ...aiMetadata,
      ...getSearchProviderMetadata(),
      fallback: true,
    }, { status });
  }
}

function getSearchProviderMetadata() {
  const config = getSearchProviderConfig();

  return {
    searchProvider: config.provider,
    searchProviderLabel: config.providerLabel,
    searchModeDescription: config.modeDescription,
    searchSupportsLiveSearch: config.supportsLiveSearch,
  };
}

function normalizeAiError(error: unknown) {
  if (error instanceof AiTaskError) {
    return sanitizeErrorForClient(error.toResponseError());
  }

  const message =
    error instanceof Error ? error.message : "Unknown AI generation error.";

  if (message.includes("API Key") || message.includes("OPENAI_API_KEY")) {
    return {
      code: "PROVIDER_API_KEY_MISSING",
      message: "Provider API Key 未配置，请检查 .env.local 并重启开发服务器。",
    };
  }

  if (/model/i.test(message) && /not found|does not exist|unsupported/i.test(message)) {
    return {
      code: "MODEL_NOT_FOUND",
      message,
    };
  }

  if (
    error instanceof SyntaxError ||
    /json|schema|parse|Unexpected token/i.test(message)
  ) {
    return {
      code: "SCHEMA_OR_PARSE_ERROR",
      message: "AI 返回内容结构不符合前端预期，无法解析或缺少必要字段。",
    };
  }

  return sanitizeErrorForClient({
    code: "AI_TASK_ERROR",
    message,
  });
}

function sanitizeErrorForClient<T extends { message: string; raw?: string }>(error: T) {
  const unsafe = /<!doctype|<html|cloudfront|gateway timeout|504 error|request could not be satisfied/i.test(
    `${error.message}\n${error.raw ?? ""}`,
  );

  return {
    ...error,
    message: unsafe
      ? "AI 服务暂时不可用，请稍后重试，或切换其他 AI Provider。"
      : error.message,
    raw: undefined,
  };
}
