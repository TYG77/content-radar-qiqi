# 七七灵感热点融合 PRD

## 目标

把“真实灵感 + 行业热点 + 来源证据 + 七七定位 + 私域转化判断”融合成更适合公众号和私域转化的内容资产。

## 核心工作流

1. 今日热点 / 来源池生成。
2. 读取灵感池中高相关灵感。
3. 对热点与灵感做匹配评分。
4. 生成融合型选题。
5. 给出推荐理由和可引用灵感。
6. 生成文章大纲，并标注灵感、行业观察、七七判断、咨询承接位置。
7. 正文生成时把灵感自然改写进文章，不生硬引用，不伪造事实。

## 设计原则

- 热点是外部线索，灵感是七七自己的内容资产。
- 热点和灵感可以融合，但不能强行拼接。
- 如果只有个人观察，没有明确来源，必须标注为“个人观察 / 待验证”。
- 文章中任何灵感都要自然化表达，不能像引用数据库条目。

## 输出对象

- 融合型选题
- 可引用灵感列表
- 文章使用计划
- 服务承接建议
- 融合评分

## 数据结构扩展建议

### InspirationItem

- `inputMode`: `text | voice | material | feishu`
- `rawInput`: 原始输入
- `transcript`: 语音转写文本
- `materialType`: 素材类型
- `materialUrl`: 素材链接
- `extractedFrom`: 来源提取描述
- `recommendedUse`: 推荐用途
- `relatedTopics`: 相关选题 ID 列表
- `usedInArticles`: 被哪些文章使用过

### Topic

- `matchedInspirationIds`: 匹配到的灵感 ID
- `fusionScore`: 综合融合分
- `qiqiFitReason`: 为什么适合七七写
- `articleUsePlan`: 文章使用计划
- `serviceBridge`: 服务承接方向
- `authenticityBoost`: 真实感/信任感增强度

## 融合评分维度

1. 热点相关度
2. 灵感匹配度
3. 七七 IP 匹配度
4. 公众号成文价值
5. 私域转化价值
6. 来源可信度
7. 真实感 / 信任感增强度

## 文章生成接入

- 大纲阶段标注可用灵感和段落位置。
- 正文阶段把灵感改写成自然表达，不生硬引用。
- 语气优化阶段强化真实操盘手现场感，保留专业底线。

## V1 轻量匹配 MVP

- 今日选题读取 `qiqi_inspiration_pool_v1` 中未归档灵感。
- 通过标题、描述、类型、标签、推荐用途做轻量关键词匹配。
- 产出 `matchedInspirations`、`matchedInspirationIds`、`inspirationMatchScore`、`qiqiFitReason`、`howToUseInArticle`、`authenticityBoost`。
- 仅做推荐辅助，不把个人观察包装成真实热点。
- 生成大纲和正文时优先复用现有链路，在提示中带入可引用灵感。

## 灵感角度提炼规则

- 匹配结果不直接复述整条案例，而是先提炼可用角度。
- 每条匹配灵感要输出：`useAngle`、`matchReason`、`articlePlacement`、`contentRole`、`suggestedExpression`、`caution`。
- 角度优先表达“这条真实观察能支撑什么判断”，而不是“这个故事讲了什么”。
- 如果相关度偏弱，要明确提示“可作为背景观察，不建议作为主案例”。
- 个人观察和真实热点必须分开表述，不能把一条项目经验包装成行业普遍结论。
