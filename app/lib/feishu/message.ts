import type { DailyRadarFeishuMessageInput, FeishuRadarHotspot } from "./types";

const MAX_HOTSPOTS = 4;

export function buildDailyRadarFeishuMessage(input: DailyRadarFeishuMessageInput) {
  const hotspots = input.hotspots.slice(0, MAX_HOTSPOTS);
  const lines = [
    `日期：${input.date}`,
    `生成时间：${input.generatedAt}`,
    "",
    "今日推荐选题：",
    ...hotspots.flatMap((hotspot, index) => formatHotspot(hotspot, index)),
    "",
    "今日建议动作：",
    "1. 打开内容雷达工作台",
    "2. 查看选题拆解",
    "3. 选择一个选题生成公众号正文",
    "4. 进入公众号排版并写入草稿箱",
    "",
    `工作台入口：${input.appUrl}`,
    "如果当前是本地地址，请确保电脑已开机并运行 npm.cmd run dev。",
  ];

  return {
    msg_type: "post",
    content: {
      post: {
        zh_cn: {
          title: "陈七七77 今日内容选题雷达",
          content: [
            [
              {
                tag: "text",
                text: lines.join("\n"),
              },
            ],
            [
              {
                tag: "a",
                text: "打开内容雷达工作台",
                href: input.appUrl,
              },
            ],
          ],
        },
      },
    },
  };
}

function formatHotspot(hotspot: FeishuRadarHotspot, index: number) {
  const platforms = hotspot.fitPlatforms?.length ? hotspot.fitPlatforms.join("、") : "公众号、小红书、视频号、朋友圈";
  const reason = hotspot.reason || hotspot.attentionReason || "适合继续拆解为今日内容选题。";
  const source = hotspot.sourceEvidence || hotspot.sourceChannel || "内容雷达本地选题信号。";

  return [
    `${index + 1}. ${hotspot.title}`,
    `推荐理由：${reason}`,
    `来源信号：${source}`,
    `适合平台：${platforms}`,
    "",
  ];
}
