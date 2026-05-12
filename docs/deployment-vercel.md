# Vercel Deployment Notes

## V1 目标

- 部署线上内容雷达工作台。
- 飞书消息里的工作台入口跳转线上地址。
- 使用 Vercel Cron 每天北京时间 08:00 自动推送飞书内容雷达。

## V1 暂不作为核心验收

- 线上写入微信公众号草稿箱。
- 线上上传公众号封面素材。
- 线上上传公众号正文图片。

原因：Vercel 普通部署通常没有固定出口 IP，微信公众号接口可能因为 IP 白名单拦截失败。V1 建议先保留本地写草稿箱能力。

## 必填环境变量

- `AI_PROVIDER`
- `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`
- `SEARCH_PROVIDER`
- `TAVILY_API_KEY`，仅当 `SEARCH_PROVIDER=tavily` 时需要
- `FEISHU_WEBHOOK_URL`
- `CONTENT_RADAR_APP_URL`
- `CRON_SECRET`

所有真实密钥只配置到本地 `.env.local` 或 Vercel 环境变量，不写入代码，不提交到仓库。

## 可选环境变量

- `WECHAT_DRAFT_ENABLED`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_DEFAULT_THUMB_MEDIA_ID`
- `WECHAT_AUTHOR`
- `WECHAT_COMMENT_OPEN`
- `WECHAT_ONLY_FANS_CAN_COMMENT`

如果暂不在线上写公众号草稿箱，建议先不要开启 `WECHAT_DRAFT_ENABLED`。

## Vercel Cron

- 北京时间 08:00 对应 UTC 00:00。
- Cron 表达式：`0 0 * * *`
- 触发接口：`/api/cron/daily-feishu`
- 当前仓库已配置 `vercel.json`。
- 定时接口需要密钥校验：`x-cron-secret` 必须等于 `CRON_SECRET`。
- 兼容 Vercel 常见的 `Authorization: Bearer <CRON_SECRET>` 请求头。

## 手动测试

本地页面测试按钮仍然调用：

```text
POST /api/feishu/push
```

云端定时任务调用：

```text
GET /api/cron/daily-feishu
```

测试 Cron route 时，请带上 `x-cron-secret` 请求头。不要在文档、截图或日志里展示真实 secret。

## 后续公众号线上写入方案

如果后续必须在线上写公众号草稿箱，建议先评估：

- 固定出口 IP 云服务器。
- 固定出口代理。
- 或继续保留本地写草稿箱能力。

上线 V1 不建议把公众号草稿箱写入作为核心验收项。
