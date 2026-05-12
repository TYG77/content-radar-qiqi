import {
  generateDailyRadarTopTopics,
  type DailyRadarTopic,
} from "@/app/lib/content-radar";

export { generateDailyRadarTopTopics };
export type { DailyRadarTopic };

export function buildDailyRadarMessage(topics: DailyRadarTopic[], date = getTodayLabel()) {
  const topTopic = topics[0];

  const lines = [
    "【陈七七77内容选题雷达｜今日推荐】",
    "",
    `日期：${date}`,
    "",
    "今日优先建议：",
    `先写：${topTopic?.title ?? "暂无推荐选题"}`,
    `原因：${topTopic?.fitReason ?? "当前没有可用选题。"}`,
    "",
    ...topics.flatMap((topic, index) => [
      `Top ${index + 1}：`,
      `选题：${topic.title}`,
      `推荐指数：${formatScore(topic.score)}/10`,
      `适合平台：${topic.platforms.join(" / ")}`,
      `切入角度：${topic.angle}`,
      `建议产物：${topic.suggestedOutput}`,
      `为什么适合陈七七77：${topic.fitReason}`,
      "",
    ]),
  ];

  return lines.join("\n").trim();
}

export function buildFeishuTextPayload(text: string) {
  return {
    msg_type: "text",
    content: {
      text,
    },
  };
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
