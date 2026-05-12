# Skill Registry

## 已创建 Skills

| Skill 名称 | 路径 | 用途 | 触发场景 | 风险等级 | 是否允许自动执行 | 最近更新时间 |
| --- | --- | --- | --- | --- | --- | --- |
| qiqi-skill-mapper | `.agents/skills/qiqi-skill-mapper/SKILL.md` | 判断重复工作流是否值得沉淀为 Skill，并输出触发条件、输入、输出、边界和实现建议。 | 用户询问是否应 Skill 化，或任务结束后需要判断候选 Skill。 | A/B/C 分流 | A 档可自动生成文档型 Skill；B 档仅诊断或登记；C 档仅登记 | 2026-05-04 |
| qiqi-auto-skill-capture | `.agents/skills/qiqi-auto-skill-capture/SKILL.md` | 每次任务结束后自动做 Skill 化复盘，更新 registry，并在低风险时创建或更新文档型 Skill。 | 代码修改、AI 链路诊断、产品流程梳理、PRD、QA、协作流程优化、重复提示词流程结束后。 | A/B/C 分流 | A 档可自动保存；B 档可保存诊断型 Skill 但不能自动改代码；C 档仅登记 | 2026-05-04 |

## 待沉淀 Skills

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-ai-chain-diagnosis | 诊断 DeepSeek/OpenAI、schema、parse、state、缓存、fallback、生成结果为空。 | B | 建议创建 |
| qiqi-webcoding-triage | 页面问题分类为产品流程、技术链路、混合问题。 | A | 建议创建 |
| qiqi-prd-splitter | 需求超过 5 个功能点时自动拆 PRD。 | A | 建议创建 |
| qiqi-qa-acceptance | 代码修改完成后的验收路径和测试清单。 | A | 建议创建 |
| qiqi-content-radar-flow | 约束内容选题雷达主流程：热点 → 拆解 → 切入角度 → 内容形态 → 生成内容。 | A/B | 建议创建 |
| qiqi-source-evidence-toolchain | 内容雷达 Tool Router、Provider 配置、来源证据结构、真实热点标记规则的准备层流程；不自动接入真实平台 API。 | C | 待确认，仅登记方案 |
| qiqi-wechat-content-image-upload | 公众号草稿箱正文内本地图片转微信可访问图片 URL 的诊断与修复流程，涉及 access_token 和微信图片上传接口。 | C | 待确认，仅登记方案 |
| qiqi-vercel-cron-feishu | Vercel Cron 云端定时推送飞书内容雷达、CRON_SECRET 校验、线上工作台链接和部署说明流程。 | C | 待确认，仅登记方案 |

## 暂不自动 Skill 化

以下流程必须先 PRD，不能自动创建执行型 Skill：

- 真实热点来源接入
- 飞书/公众号后台打通
- API Key 管理
- 用户系统/计费系统
- 部署/权限/数据库相关流程
