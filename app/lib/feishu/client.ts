import { getDefaultContentRadarHotspots } from "@/app/lib/content-radar";

import { buildDailyRadarFeishuMessage } from "./message";
import type { FeishuSendResult } from "./types";
import type { DailyRadarFeishuPushInput, FeishuRadarHotspot } from "./types";

export async function sendFeishuWebhookMessage(message: unknown): Promise<FeishuSendResult> {
  const webhook = process.env.FEISHU_WEBHOOK_URL?.trim();

  if (!webhook) {
    return {
      ok: false,
      message: "飞书 webhook 未配置，请先在 .env.local 中配置 FEISHU_WEBHOOK_URL。",
    };
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "飞书推送失败，请检查 webhook 配置。",
      };
    }

    return {
      ok: true,
      message: "已推送到飞书群，请查看消息。",
    };
  } catch {
    return {
      ok: false,
      message: "飞书推送失败，请检查 webhook 配置。",
    };
  }
}

export async function pushDailyRadarToFeishu(
  input: DailyRadarFeishuPushInput = {},
): Promise<FeishuSendResult> {
  try {
    const now = new Date();
    const appUrl = process.env.CONTENT_RADAR_APP_URL?.trim() || "http://localhost:3000";
    const message = buildDailyRadarFeishuMessage({
      date: formatDate(now),
      appUrl,
      generatedAt: formatDateTime(now),
      mode: input.mode === "scheduled" ? "scheduled" : "manual_test",
      hotspots: normalizeHotspots(input.hotspots),
    });

    return sendFeishuWebhookMessage(message);
  } catch {
    return {
      ok: false,
      message: "飞书推送失败，请稍后重试。",
    };
  }
}

function normalizeHotspots(value: unknown): FeishuRadarHotspot[] {
  const source = Array.isArray(value) && value.length ? value : getDefaultContentRadarHotspots();
  return source
    .map((item) => normalizeHotspot(item))
    .filter((item): item is FeishuRadarHotspot => Boolean(item))
    .slice(0, 4);
}

function normalizeHotspot(value: unknown): FeishuRadarHotspot | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = stringValue(record.title);
  if (!title) return null;

  return {
    title,
    reason: stringValue(record.reason),
    sourceEvidence: stringValue(record.sourceEvidence),
    attentionReason: stringValue(record.attentionReason),
    sourceChannel: stringValue(record.sourceChannel),
    fitPlatforms: Array.isArray(record.fitPlatforms)
      ? record.fitPlatforms.map(stringValue).filter(Boolean)
      : [],
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}
