<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-collaboration-rules -->
# Project Collaboration Rules

Before changing code, classify the task using `docs/workflow-rules.md`:

- A 档：边界清晰、指定文件范围内、无新增依赖、无敏感配置或主架构风险。可以给简短计划后直接执行。
- B 档：AI 输出为空、Provider/schema/parse/state/render/cache/mock 链路不清楚，或页面 Runtime Error。必须先只读诊断，等用户确认后再改代码。
- C 档：超过 5 个功能点、真实平台来源、飞书/公众号后台、用户/计费/API Key、数据库/部署/权限/安全、主流程/核心架构重构、新外部服务或依赖。必须先写 PRD。

Fixed prohibitions:

- Never read, display, or modify `.env.local`.
- Never put API Keys in frontend code.
- Never expose raw JSON, payloads, stack traces, or internal code blocks to end users.
- Never pretend AI-generated or mock content is real platform hotspot data.
- Do not remove DeepSeek/OpenAI provider switching without explicit confirmation.
- Do not perform broad refactors without explicit confirmation.
- Do not only change UI copy when the real chain is broken.

After any A 档 code execution, run:

- `npm.cmd run lint`
- `npm.cmd run build`

Then report changed files, what was fixed, lint/build results, and manual acceptance paths.
<!-- END:project-collaboration-rules -->

## 自动 Skill 化复盘

每次完成任何任务后，必须自动做 Skillization Review。

适用任务包括：

- 代码修改
- AI 链路诊断
- 产品流程梳理
- PRD 拆解
- QA 验收
- Codex/Cursor 协作流程优化
- 重复出现的提示词流程

每次最终输出必须包含：

Skill 化复盘：
- 本次是否出现可复用流程：是 / 否
- 是否建议沉淀为 Skill：是 / 否
- 建议 Skill 名称：
- 触发场景：
- 风险等级：A / B / C
- 是否已自动保存：
- 保存路径：
- 如果未保存，原因：
- 后续建议：

判断标准：

1. 同类流程重复出现 3 次以上。
2. 每次都需要类似提示词。
3. 有明确输入和输出。
4. 有稳定触发场景。
5. 有明确边界。
6. 能减少用户和 Codex/Cursor 的来回确认。
7. 不需要每次重新解释业务背景。

自动保存规则：

1. A 档文档型 Skill 可以自动创建或更新。
2. B 档诊断型 Skill 可以创建 Skill 文档，但不能自动执行代码修改。
3. C 档高风险 Skill 只能登记到 `docs/skill-registry.md` 的待确认区，不能自动创建执行型 Skill。

固定禁止：

1. 不得读取、展示或修改 `.env.local`。
2. 不得暴露 API Key。
3. 不得自动创建会调用外部 API、改 Provider、接真实数据源、飞书、公众号后台、部署、权限、计费的高风险 Skill。
4. 不得一次自动创建超过 2 个 Skill。
5. 不得把所有流程塞进一个超大 Skill。
6. 不得替用户伪装真实平台热点。

<!-- BEGIN:v3.4-path-safety-rules -->
## v3.4 Path And Safety Rules

- Current fixed project path: `C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台`.
- Deprecated paths: `C:\Users\123\vibe-projects\my-first-app` and `C:\Users\123\七七AI项目工作台\10-内容选题工作台`.
- Future tasks default to the fixed path above.
- AI control workspace stores cross-project rules, common engineering notes, MCP/tool indexes, PowerShell operations, Feishu SOP, Skill/Scale registry, and Obsidian templates.
- This project keeps `app/`, `docs/`, `scripts/`, `public/`, `package.json`, `package-lock.json`, `next.config.ts`, `vercel.json`, `.env.local`, `.env.example`, project PRD, and workflow docs.
- Sensitive backup directory: `C:\Users\123\七七AI项目工作台\98-敏感配置备份-禁止AI读取`.
- Do not read, display, modify, or submit `.env.local` or sensitive backup contents.
- Do not call Feishu / WeChat / AI real interfaces unless the user explicitly asks for validation.

Commands:

```powershell
cd C:\Users\123\七七AI项目工作台\10-七七操盘手内容工作台
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Real Feishu push acceptance, only with explicit user request:

```powershell
npm.cmd run feishu:push
```
<!-- END:v3.4-path-safety-rules -->
