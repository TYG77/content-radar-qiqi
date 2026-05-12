type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAITool = {
  type: "web_search";
  external_web_access?: boolean;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    action?: {
      sources?: OpenAIWebSource[];
    };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: OpenAIAnnotation[];
    }>;
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string;
    };
  }>;
};

export type AiProvider = "openai" | "deepseek";

export type AiProviderConfig = {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey?: string;
  supportsWebSearch: boolean;
  modeDescription: string;
};

export type OpenAIWebSource = {
  title?: string;
  url?: string;
  source?: string;
};

type OpenAIAnnotation = {
  type?: string;
  title?: string;
  url?: string;
};

export type AiErrorDetails = {
  code: string;
  message: string;
  status?: number;
  type?: string;
  raw?: string;
  provider?: AiProvider;
  model?: string;
};

export class AiTaskError extends Error {
  code: string;
  status?: number;
  type?: string;
  raw?: string;
  provider?: AiProvider;
  model?: string;

  constructor(details: AiErrorDetails) {
    super(details.message);
    this.name = "AiTaskError";
    this.code = details.code;
    this.status = details.status;
    this.type = details.type;
    this.raw = details.raw;
    this.provider = details.provider;
    this.model = details.model;
  }

  toResponseError(): AiErrorDetails {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      type: this.type,
      provider: this.provider,
      model: this.model,
    };
  }
}

export function getAiProviderConfig(): AiProviderConfig {
  const provider = normalizeProvider(process.env.AI_PROVIDER);

  if (provider === "openai") {
    return {
      provider,
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      baseUrl: trimTrailingSlash(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      ),
      apiKey: process.env.OPENAI_API_KEY,
      supportsWebSearch: true,
      modeDescription: "OpenAI：适合高质量润色和 web_search，但成本较高。",
    };
  }

  return {
    provider,
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    baseUrl: trimTrailingSlash(
      process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    ),
    apiKey: process.env.DEEPSEEK_API_KEY,
    supportsWebSearch: false,
    modeDescription:
      "DeepSeek：低成本生成，适合开发测试、选题、大纲、小红书和短视频脚本。",
  };
}

export function getAiProviderMetadata() {
  const config = getAiProviderConfig();

  return {
    provider: config.provider,
    providerLabel: getProviderLabel(config.provider),
    model: config.model,
    supportsWebSearch: config.supportsWebSearch,
    modeDescription: config.modeDescription,
  };
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

export async function callChatModel({
  provider,
  model,
  baseUrl,
  apiKey,
  messages,
  temperature,
  responseFormat,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey?: string;
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<{ text: string; sources: OpenAIWebSource[] }> {
  if (!apiKey) {
    throw new AiTaskError({
      code: "PROVIDER_API_KEY_MISSING",
      message: `${getProviderLabel(provider)} API Key 未配置，请检查 .env.local。`,
      provider,
      model,
    });
  }

  if (provider === "openai") {
    return callOpenAIResponses({
      model,
      baseUrl,
      apiKey,
      messages,
      responseFormat,
      tools,
      include,
      timeoutMs,
      maxTokens,
    });
  }

  return callOpenAICompatibleChatCompletions({
    provider,
    model,
    baseUrl,
    apiKey,
    messages,
    temperature,
    responseFormat,
    timeoutMs,
    maxTokens,
  });
}

export async function generateJsonWithAi<T>({
  prompt,
  schema,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  prompt: string;
  schema: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<T> {
  const { text } = await generateTextWithAiMetadata({
    prompt,
    schema,
    tools,
    include,
    timeoutMs,
    maxTokens,
  });

  try {
    return parseJsonFromAi<T>(text);
  } catch {
    throw new AiTaskError({
      code: "SCHEMA_OR_PARSE_ERROR",
      message: "AI 返回内容结构不符合前端预期，无法解析为有效 JSON。",
      raw: text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }
}

export async function generateJsonWithAiMetadata<T>({
  prompt,
  schema,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  prompt: string;
  schema: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<{ data: T; sources: OpenAIWebSource[]; text: string }> {
  const result = await generateTextWithAiMetadata({
    prompt,
    schema,
    tools,
    include,
    timeoutMs,
    maxTokens,
  });

  try {
    return {
      data: parseJsonFromAi<T>(result.text),
      sources: result.sources,
      text: result.text,
    };
  } catch {
    throw new AiTaskError({
      code: "SCHEMA_OR_PARSE_ERROR",
      message: "AI 返回内容结构不符合前端预期，无法解析为有效 JSON。",
      raw: result.text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }
}

export async function generateTextWithAi({
  prompt,
  schema,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  prompt: string;
  schema?: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<string> {
  const result = await generateTextWithAiMetadata({
    prompt,
    schema,
    tools,
    include,
    timeoutMs,
    maxTokens,
  });

  return result.text;
}

async function generateTextWithAiMetadata({
  prompt,
  schema,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  prompt: string;
  schema?: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<{ text: string; sources: OpenAIWebSource[] }> {
  const config = getAiProviderConfig();

  return callChatModel({
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    responseFormat: schema,
    tools: config.supportsWebSearch ? tools : undefined,
    include: config.supportsWebSearch ? include : undefined,
    timeoutMs,
    maxTokens,
  });
}

async function callOpenAICompatibleChatCompletions({
  provider,
  model,
  baseUrl,
  apiKey,
  messages,
  temperature,
  responseFormat,
  timeoutMs,
  maxTokens,
}: {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: JsonSchema;
  timeoutMs?: number;
  maxTokens?: number;
}) {
  const response = await fetchWithTimeout({
    url: `${trimTrailingSlash(baseUrl)}/chat/completions`,
    apiKey,
    timeoutMs,
    provider,
    model,
    body: {
      model,
      messages,
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(responseFormat
        ? {
            response_format: {
              type: "json_object",
            },
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw await buildProviderError(provider, model, response);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const choice = data.choices?.[0];
  const text = choice?.message?.content ?? "";

  if (choice?.finish_reason === "length") {
    throw new AiTaskError({
      code: "AI_OUTPUT_TRUNCATED",
      message: "生成内容被截断，请重试或提高 max_tokens。",
      raw: text.slice(0, 300),
      provider,
      model,
    });
  }

  if (!text) {
    throw new AiTaskError({
      code: "EMPTY_AI_OUTPUT",
      message: `${getProviderLabel(provider)} 返回了空内容。`,
      raw: JSON.stringify(data).slice(0, 300),
      provider,
      model,
    });
  }

  return { text, sources: [] };
}

async function callOpenAIResponses({
  model,
  baseUrl,
  apiKey,
  messages,
  responseFormat,
  tools,
  include,
  timeoutMs,
  maxTokens,
}: {
  model: string;
  baseUrl: string;
  apiKey: string;
  messages: ChatMessage[];
  responseFormat?: JsonSchema;
  tools?: OpenAITool[];
  include?: string[];
  timeoutMs?: number;
  maxTokens?: number;
}) {
  const reasoningEffort = process.env.OPENAI_REASONING_EFFORT || "low";
  const response = await fetchWithTimeout({
    url: `${trimTrailingSlash(baseUrl)}/responses`,
    apiKey,
    timeoutMs,
    provider: "openai",
    model,
    body: {
      model,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      reasoning: {
        effort: reasoningEffort,
      },
      ...(responseFormat
        ? {
            text: {
              format: {
                type: "json_schema",
                name: responseFormat.name,
                schema: responseFormat.schema,
                strict: false,
              },
            },
          }
        : {}),
      ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
      ...(include?.length ? { include } : {}),
      ...(maxTokens ? { max_output_tokens: maxTokens } : {}),
    },
  });

  if (!response.ok) {
    throw await buildProviderError("openai", model, response);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractOutputText(data);

  if (!text) {
    throw new AiTaskError({
      code: "EMPTY_AI_OUTPUT",
      message: "OpenAI 返回了空内容。",
      raw: JSON.stringify(data).slice(0, 300),
      provider: "openai",
      model,
    });
  }

  return { text, sources: extractWebSources(data) };
}

async function fetchWithTimeout({
  url,
  apiKey,
  body,
  provider,
  model,
  timeoutMs,
}: {
  url: string;
  apiKey: string;
  body: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  timeoutMs?: number;
}) {
  const controller = new AbortController();
  const timeout = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AiTaskError({
      code:
        error instanceof Error && error.name === "AbortError"
          ? `${provider.toUpperCase()}_TIMEOUT`
          : `${provider.toUpperCase()}_NETWORK_ERROR`,
      message:
        error instanceof Error
          ? `无法连接 ${getProviderLabel(provider)} API：${error.message}`
          : `无法连接 ${getProviderLabel(provider)} API。`,
      provider,
      model,
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function extractOutputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text;

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

function extractWebSources(data: OpenAIResponse): OpenAIWebSource[] {
  const sources = new Map<string, OpenAIWebSource>();

  for (const item of data.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      if (source.url) sources.set(source.url, source);
    }

    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.url) {
          sources.set(annotation.url, {
            title: annotation.title,
            url: annotation.url,
            source: annotation.type,
          });
        }
      }
    }
  }

  return [...sources.values()];
}

function extractJsonText(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return trimmed;
}

export function parseJsonFromAi<T>(text: string): T {
  return JSON.parse(extractJsonText(text)) as T;
}

async function buildProviderError(
  provider: AiProvider,
  model: string,
  response: Response,
) {
  const raw = await response.text();
  let code = `${provider.toUpperCase()}_${response.status}`;
  let type: string | undefined;
  let message = `${getProviderLabel(provider)} request failed with status ${response.status}.`;
  let rawForDiagnostics: string | undefined;

  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        code?: string;
        message?: string;
        type?: string;
      };
    };
    code = parsed.error?.code || code;
    type = parsed.error?.type;
    message = parsed.error?.message || message;
    rawForDiagnostics = sanitizeRawForDiagnostics(raw);
  } catch {
    if (!isUnsafeProviderBody(raw, response.status)) {
      message = raw || message;
      rawForDiagnostics = sanitizeRawForDiagnostics(raw);
    }
  }

  const normalizedCode =
    response.status === 404 || /model/i.test(`${code} ${message}`)
      ? "MODEL_NOT_FOUND"
      : code;
  const safeMessage = getSafeProviderErrorMessage(provider, response.status, message, raw);

  return new AiTaskError({
    code: normalizedCode,
    message: safeMessage,
    status: response.status,
    type,
    raw: rawForDiagnostics,
    provider,
    model,
  });
}

function getSafeProviderErrorMessage(
  provider: AiProvider,
  status: number,
  message: string,
  raw: string,
) {
  if (isUnsafeProviderBody(`${message}\n${raw}`, status)) {
    return `${getProviderLabel(provider)} 服务暂时不可用，请稍后重试，或切换其他 AI Provider。`;
  }

  return message;
}

function isUnsafeProviderBody(value: string, status?: number) {
  return (
    status === 504 ||
    /<!doctype|<html|cloudfront|gateway timeout|504 error|request could not be satisfied/i.test(value)
  );
}

function sanitizeRawForDiagnostics(value: string) {
  if (!value || isUnsafeProviderBody(value)) return undefined;
  return value.slice(0, 300);
}

function normalizeProvider(value: string | undefined): AiProvider {
  return value?.toLowerCase() === "openai" ? "openai" : "deepseek";
}

function getProviderLabel(provider: AiProvider) {
  return provider === "openai" ? "OpenAI" : "DeepSeek";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
