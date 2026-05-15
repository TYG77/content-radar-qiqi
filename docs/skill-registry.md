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
 
## 2026-05-15 待评估文档型 Skill

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-product-context-docs | 沉淀七七内容雷达的 PRD、业务上下文、工作流地图、路线图和开发规则，帮助后续任务先理解业务再改代码。 | A | 文档型低风险，可按需创建 |
## 2026-05-15 低风险 UI/localStorage 流程登记

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-localstorage-ui-module | 为首页工作台新增低风险 UI 模块，包含浏览器 localStorage 保存、列表展示、筛选、复制、删除、归档和接入现有页面状态入口；禁止接真实平台、API、Provider、数据库、飞书、公众号后台。 | A | 已登记，暂不自动创建执行型 Skill |
| qiqi-ai-task-ui-inbox | 为现有工作台新增低风险 AI 整理任务，复用既有 `/api/ai`、prompt、schema、task 链路，把原始文本整理为候选 UI 数据；禁止新增 Provider、真实平台来源、数据库、飞书、公众号后台和密钥配置。 | A/B | 已登记，暂不自动创建执行型 Skill |
| qiqi-inspiration-fusion-planning | 沉淀七七真实内容资产池的 PRD、输入通道分层、热点融合工作流、数据结构扩展和后续任务拆分；仅用于方案与文档，不自动执行业务代码。 | A/B | 已登记，暂不自动创建执行型 Skill |

## 2026-05-15 灵感热点轻量匹配登记

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-inspiration-hotspot-match | 读取 `qiqi_inspiration_pool_v1`，对今日选题做轻量关键词匹配，生成可引用灵感、匹配理由和文章使用建议，仅限 UI / localStorage / 提示词上下文补充，不接真实平台与数据库。 | A | 已登记，暂不自动创建执行型 Skill |

## 2026-05-15 灵感角度提炼登记

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-inspiration-angle-match | 将灵感与今日选题的关系从“案例关联”升级为“角度提炼”，输出 useAngle、matchReason、articlePlacement、contentRole、suggestedExpression、caution，仅限 UI / localStorage / 提示词上下文补充。 | A | 已登记，暂不自动创建执行型 Skill |

## 2026-05-15 飞书内容工作流入口登记

| Skill 名称 | 用途 | 风险等级 | 状态 |
| --- | --- | --- | --- |
| qiqi-feishu-workflow-entry | 沉淀飞书 webhook 内容卡片到工作台 URL 跳转的 PRD、卡片结构、URL 参数承接、V1/V2/V3 边界和后续任务拆分；仅限方案和文档，不接飞书自建应用回调。 | A/B | 已登记，暂不自动创建执行型 Skill |
