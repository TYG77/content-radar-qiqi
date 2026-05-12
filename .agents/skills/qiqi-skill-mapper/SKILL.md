---
name: qiqi-skill-mapper
description: Use this skill when the user asks whether a repeated workflow, debugging flow, product flow, PRD flow, QA flow, or Codex/Cursor collaboration pattern should be turned into a reusable Skill. It analyzes the workflow, decides whether skillization is worthwhile, and outputs candidate skills with trigger conditions, inputs, outputs, boundaries, and implementation suggestions.
---

# qiqi-skill-mapper

## 什么时候使用

当用户询问某个重复流程是否应该沉淀为 Skill，或任务结束后需要判断本次流程是否值得 Skill 化时使用。

适用流程包括：

- 重复调试流程
- AI 链路诊断流程
- 产品流程梳理
- PRD 拆解
- QA 验收
- Codex/Cursor 协作流程
- 反复出现的提示词模板

## 判断标准

优先判断是否满足以下条件：

1. 同类流程重复出现 3 次以上。
2. 每次都需要类似提示词。
3. 有明确输入和输出。
4. 有稳定触发场景。
5. 有明确边界。
6. 能减少用户和 Codex/Cursor 的来回确认。
7. 不需要每次重新解释业务背景。

## A/B/C 风险分级

A 档：可以自动生成或更新文档型 Skill。

- PRD 模板
- QA 验收清单
- 产品流程梳理
- 诊断提示词模板
- 不修改业务代码的文档型 Skill
- 不读取 `.env.local`
- 不新增依赖
- 不碰 API Key / Provider / 数据源 / 部署

B 档：可以创建诊断型 Skill，但不能自动执行代码修改。

- AI 链路诊断
- Provider 检查
- schema/parse/state/render 检查
- 缓存/fallback/mock 检查
- Runtime Error 诊断

C 档：只登记，不自动创建执行型 Skill。

- 真实热点来源
- 飞书/公众号后台
- API Key 管理
- 用户系统/计费系统
- 数据库/部署/权限
- 会自动调用外部服务的 Skill
- 一次超过 5 个功能点的流程

## 输出格式

输出 Skill 化判断：

- 建议 Skill 名称：
- 触发场景：
- 输入：
- 输出：
- 边界：
- 风险等级：A / B / C
- 是否允许自动执行：
- 是否建议自动保存：
- 保存路径或登记位置：
- 实现建议：

## 候选 Skill 推荐

推荐候选 Skill 时，必须说明：

1. 为什么该流程值得沉淀。
2. 该 Skill 的稳定触发条件。
3. 该 Skill 的输入和输出。
4. 该 Skill 不应该做什么。
5. 是否可以自动保存。

## 固定禁止事项

不要：

1. 读取、展示或修改 `.env.local`。
2. 暴露 API Key。
3. 自动创建会调用外部 API、修改业务代码、修改 Provider、接真实数据源、飞书、公众号后台、部署、权限、计费的高风险 Skill。
4. 一次自动创建超过 2 个 Skill。
5. 把所有流程塞进一个超大 Skill。
6. 替用户伪装真实平台热点。

## 执行规则

如果符合 A 档，可以直接生成或更新 Skill 文档。

如果是 B 档，只能创建只读诊断型 Skill 或登记待确认，不能让 Skill 自动改代码。

如果是 C 档，只能登记到 `docs/skill-registry.md`，等待用户确认 PRD 后再处理。
