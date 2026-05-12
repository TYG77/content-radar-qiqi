const endpoint = process.env.CONTENT_RADAR_PUSH_URL || "http://localhost:3000/api/feishu/push";

async function main() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "scheduled" }),
    });
    const result = await response.json().catch(() => ({}));
    const message =
      typeof result.message === "string"
        ? result.message
        : response.ok
          ? "飞书推送请求已完成。"
          : "飞书推送失败，请检查项目是否已启动。";

    console.log(message);
    process.exit(response.ok && result.ok !== false ? 0 : 1);
  } catch {
    console.log("请先启动内容雷达项目 npm.cmd run dev。");
    process.exit(1);
  }
}

void main();
