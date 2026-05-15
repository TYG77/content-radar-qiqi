async function main() {
  const nextEnv = await import("@next/env");
  const loadEnvConfig = nextEnv.loadEnvConfig ?? nextEnv.default?.loadEnvConfig;
  if (typeof loadEnvConfig !== "function") {
    console.log("飞书推送失败，请检查 Next.js 环境变量加载器是否可用。");
    process.exitCode = 1;
    return;
  }

  loadEnvConfig(process.cwd());

  const webhook = process.env.FEISHU_WEBHOOK_URL?.trim();

  if (!webhook) {
    console.log("FEISHU_WEBHOOK_URL 未配置，请在 .env.local 中配置飞书 webhook。");
    process.exitCode = 1;
    return;
  }

  try {
    const [
      { buildDailyRadarFeishuMessage, getContentRadarAppUrl },
      { getDefaultContentRadarHotspots },
    ] = await Promise.all([
      import("../app/lib/feishu/message.ts"),
      import("../app/lib/content-radar.ts"),
    ]);
    const appUrlResult = getContentRadarAppUrl();
    if (!appUrlResult.ok) {
      console.log(appUrlResult.message);
      process.exitCode = 1;
      return;
    }

    const now = new Date();
    const message = buildDailyRadarFeishuMessage({
      date: formatDate(now),
      appUrl: appUrlResult.appUrl,
      generatedAt: formatDateTime(now),
      mode: "scheduled",
      hotspots: getDefaultContentRadarHotspots(),
    });
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.log("飞书推送失败，请检查 webhook 配置。");
      process.exitCode = 1;
      return;
    }

    console.log("已推送到飞书群，请查看消息。");
    process.exitCode = 0;
  } catch {
    console.log("飞书推送失败，请稍后重试。");
    process.exitCode = 1;
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

void main();
