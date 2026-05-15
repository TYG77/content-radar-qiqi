---
name: wechat-article-layout
description: Use this skill for Chen Qiqi 77 WeChat article layout, title, summary, cover copy, intro block, image placeholders, quote highlights, HTML layout, copy button feedback, and compliance checks.
---

# WeChat Article Layout Skill

本 Skill 用于陈七七77公众号文章排版、标题、摘要、封面文案、开头介绍、图片位、金句高亮、公众号 HTML、复制按钮反馈和合规检查。

后续调用本 Skill 时，优先遵守当前项目 3000 端口已经跑通的公众号排版模型。不要重新设计通用公众号模板；以 `app/lib/wechat/layout.ts` 的白底窄宽、低饱和橄榄绿、强留白、内联 HTML 风格为标准。

## 账号定位

把陈七七77理解为：IP 操盘手、内容操盘手、AI 共创实践者、大健康 IP 操盘手，并具备女性健康营养师背景。

不要把文章写成泛健康科普号，也不要写成纯情绪日记号。文章目标是显化专业判断力、沉淀项目方法论、建立信任，并自然承接合作咨询。

## 3000 端口标准视觉风格

当前标准是克制的白底公众号长文，不是浅绿卡片堆叠，也不是报告式模块。

- 主体白底，窄宽，长留白。
- 整体最大宽度：`677px`。
- 主体内边距：`30px 18px`。
- 正文主字号：`16px`。
- 正文行高：`1.95`。
- 段落底部间距：`22px`。
- 正文板块间距：`86px`。
- 页面主色是低饱和橄榄绿，不使用高饱和亮绿。
- 不默认使用浅绿色卡片、虚线图片框、复杂装饰块。

## 主题色和基础样式

必须优先使用当前 3000 模板色值：

- 背景：`#ffffff`
- 正文：`#333333`
- 标题：`#333333`
- 辅助灰：`#666A6D`
- 主主题绿：`#5F7D57`
- 辅助绿：`#6B8A62`
- 图片提示灰：`#8F8F8F`
- 边框参考：`#E1E8DE`

基础 HTML 外层：

```html
<section style="max-width:677px;margin:0 auto;padding:30px 18px;color:#333333;font-family:-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;font-size:16px;line-height:1.95;background:#ffffff;">
  这里放公众号正文
</section>
```

## 默认文章结构

默认按以下顺序组织，按用户素材可删减，但不要遗漏关键承接位：

1. 账号标签
2. 主标题
3. 摘要 / digest
4. 固定开头自我介绍
5. 陈七七77个人介绍图
6. 引言
7. 全文字数和阅读分钟
8. 正文主体
9. 自动编号小标题
10. 正文段落
11. 正文配图提示
12. 结尾总结
13. 固定结尾引导
14. 再次插入个人介绍图
15. 再次身份介绍或信任承接
16. 一鱼多吃建议

## 标题区

标题区块使用白底和大留白：

```html
<section style="margin:0 0 52px 0;padding:0;background:#ffffff;">
  <p style="margin:0 0 10px 0;color:#6B8A62;font-size:14px;line-height:1.6;font-weight:500;">陈七七77 · 女性健康 IP 操盘笔记</p>
  <h1 style="margin:0;color:#333333;font-size:28px;line-height:1.36;font-weight:700;letter-spacing:0;">这里放标题</h1>
</section>
```

标题要求：

- 控制在 `12-32` 字。
- 像公众号判断句，不像报告标题。
- 尽量包含 `AI`、`大健康`、`IP`、`专业判断`、`私域`、`信任`、`商业闭环` 等核心关键词中的至少一个。

## 自我介绍区

当前 3000 模板不是简历卡片，而是一段固定开头介绍 + 个人介绍图。

开头介绍样式：

```html
<p style="margin:0 0 20px 0;color:#666A6D;font-size:15px;line-height:1.9;font-weight:400;">这里放固定开头介绍</p>
```

自我介绍写法：

- 可以用“hi，我是七七”开头。
- 不要像简历，不要堆头衔。
- 重点表达“我是谁、我正在实践什么、为什么这篇文章值得看”。
- 语气真诚、口语、有关系感。

个人介绍图固定使用：

```html
<p style="margin:28px 0 34px 0;text-align:center;">
  <img src="/qiqi/intro-card.png" alt="陈七七77个人介绍图" style="display:block;width:100%;max-width:560px;height:auto;margin:0 auto;border-radius:10px;" />
</p>
```

个人介绍图默认出现两次：

- 开头自我介绍之后，正文引言之前。
- 结尾引导之后，再次身份介绍之前。

## 引言区

当前 3000 模板的引言区是白底、上下留白、无边框，不使用浅绿卡片。

```html
<section style="margin:0;padding:18px 0;background:#ffffff;">
  <p style="margin:0 0 10px 0;color:#6B8A62;font-size:15px;line-height:1.6;font-weight:700;">引言</p>
  <p style="margin:0;color:#333333;font-size:16px;line-height:1.95;">这里放引言</p>
</section>
```

阅读信息：

```html
<p style="margin:14px 0 0 0;color:#666A6D;font-size:13px;line-height:1.7;text-align:center;">全文约 3000 字 · 阅读约 7 分钟</p>
```

开头 300 字内要有真实观察、问题意识或关系感表达。优先使用“最近我发现”“很多人以为”“我的判断是”等自然口吻。

## 正文段落

正文段落使用：

```html
<p style="margin:0 0 22px 0;color:#333333;font-size:16px;line-height:1.95;">这里放正文段落</p>
```

规则：

- 单段不要太长，约 `120` 字以内更适合手机阅读。
- 超过约 `130` 字时，优先按句子拆段。
- 不要写成 PPT 条目堆叠。
- 不要写成课程讲义。
- 保留陈七七77的真实创作者表达、项目观察和个人判断。

## 小标题

当前 3000 模板的小标题是橄榄绿色大字号标题，自动带 `01 / 02 / 03` 编号。

```html
<section style="margin:86px 0 0 0;padding:0;">
  <h2 style="margin:0 0 28px 0;color:#5F7D57;font-size:23px;line-height:1.42;font-weight:700;letter-spacing:0;">
    <span style="display:inline-block;margin-right:10px;color:#5F7D57;font-size:16px;font-weight:700;">01</span>这里放小标题
  </h2>
  正文段落
</section>
```

小标题规则：

- 小标题要像观点，不要像“第一部分、第二部分、首先其次最后”。
- 可以写成“模型一：xxx”“真正卡住的不是流量，而是信任承接”这类判断。
- 生成 HTML 时优先统一为 `01 / 02 / 03` 编号样式。
- 避免手写重复编号；如果原文已有编号，输出时要清理后再用模板编号。
- 正文至少保留 3 个自然小标题。

## 图片和图片位

不要伪造图片 URL。当前标准里，只有个人介绍图使用真实本地路径 `/qiqi/intro-card.png`。

正文配图提示不是虚线框，而是灰色斜体文字：

```html
<p style="margin:4px 0 22px 0;color:#8F8F8F;font-size:14px;line-height:1.8;font-style:italic;">这里需配图：这里可做成 1 张方法卡片图</p>
```

图片位提示文案使用：

- `这里需配图：话题引入图 / 生活感照片`
- `这里需配图：项目场景图 / 案例示意图 / 生活感照片`
- `这里需配图：这里可做成 1 张方法卡片图`
- `这里需配图：个人观点图 / 核心判断金句图`

插图位置：

- 开头自我介绍后固定放个人介绍图。
- 正文第 `1、2、4、5` 个板块可插配图提示。
- 如果板块只有 1 段，配图提示放该段后。
- 如果板块有多段，配图提示通常放第 2 段附近。
- 结尾引导后再次放个人介绍图。

图片建议卡片只用于页面侧边说明，不作为公众号正文默认 HTML。常见建议：

- 开头自我介绍后：人物实拍或个人介绍图，白底、浅绿灰、低饱和自然色。
- 正文前半段：场景图、案例示意图或流程图，延续低饱和绿色体系。
- 正文中后段：个人观点卡片图，白底、绿色标题、留白充足。

## 加粗和金句

当前 3000 模板不默认做独立金句卡片，也不默认做浅绿色背景块。金句优先在段落内用 `strong`。

普通重点句：

```html
<strong style="font-weight:700;">这里放重点判断</strong>
```

特别重点句：

```html
<strong style="color:#6B8A62;font-weight:700;">这里放特别重要的判断</strong>
```

优先高亮包含以下信号的完整判断句：

- 信任
- 私域
- 转化
- 专业判断
- 内容承接
- 用户关系
- 商业闭环
- 价值
- 判断力
- 实操
- 观察
- 不是
- 而是
- 真正
- 核心

规则：

- 只加粗关键判断、核心观点、重要提醒、转折句、总结句。
- 不要整段加粗。
- 不要每段都加粗。
- 每个小节通常最多 1-3 处加粗。
- 特别优质金句才加辅助绿 `#6B8A62`。
- 不要为了好看强行每段做金句块。

## 结尾引导区

结尾总结使用：

```html
<section style="margin:86px 0 0 0;padding:0;">
  <h2 style="margin:0 0 20px 0;color:#5F7D57;font-size:22px;line-height:1.42;font-weight:700;">结尾总结</h2>
  <p style="margin:0;color:#333333;font-size:16px;line-height:1.95;">这里放结尾总结</p>
</section>
```

固定结尾承接使用：

```html
<section style="margin:72px 0 0 0;padding:0;">
  <p style="margin:0 0 22px 0;color:#666A6D;font-size:15px;line-height:1.85;">这里放自然引导</p>
  这里再次放个人介绍图
  <p style="margin:24px 0 0 0;color:#666A6D;font-size:15px;line-height:1.9;font-weight:400;">这里再次放身份介绍</p>
</section>
```

结尾引导要自然，不要硬广。每篇文章只选 1-2 个主要动作，例如关注、咨询、领取资料、进入私域。微信号统一使用 `chen-ccsq`。

## 大健康合规检查

涉及营养、中医、健康、身体指标、疾病、疗效时，必须提醒规避：

- 治疗
- 根治
- 修复
- 排毒
- 降指标
- 消结节
- 保证有效
- 替代医生诊断
- 夸大功效

建议使用：

- 日常饮食管理
- 生活方式建议
- 经验分享
- 个体情况不同
- 如有疾病或不适，建议咨询专业医生

## 公众号 HTML 输出

输出公众号 HTML 时必须：

- 使用简单 HTML。
- 样式尽量内联。
- 不使用 JavaScript。
- 不依赖外部 CSS。
- 不引入外部字体。
- 不伪造图片 URL。
- 不输出原始 JSON。
- 不输出内部提示词。
- 适合复制到公众号后台。
- 优先复刻当前 3000 模板，而不是生成通用公众号排版。

不要默认输出：

- 大面积浅绿卡片。
- 虚线图片占位框。
- 独立金句背景块。
- 报告式分割线堆叠。
- 花哨多色主题。

## 复制按钮反馈

如果项目中有“复制公众号 HTML”按钮，必须有完整状态反馈。

按钮文案：

- idle：`复制公众号 HTML`
- copying：`正在复制...`
- success：`已复制`
- failed：`复制失败，手动复制`
- unsupported：`请手动复制`

页面状态提示：

- 不支持剪贴板：`当前浏览器不支持自动复制，请手动复制下方 HTML`
- 成功：`已复制公众号 HTML`
- 失败：`复制失败，请手动复制下方 HTML`

状态反馈建议在约 `2500ms` 后恢复 idle。

## 发布检查规则

每次输出公众号排版版前，按当前 3000 页面发布检查逻辑自检：

- 标题是否 `12-32` 字。
- 标题是否包含 `AI`、`大健康`、`IP`、`专业判断`、`私域`、`信任`、`商业闭环` 等关键词。
- 开头 300 字是否有“最近”“我发现”“很多人以为”“我的判断”等钩子。
- 是否至少有 3 个清晰自然小标题。
- 是否有陈七七77作为大健康 IP 操盘手 / 女性健康营养师的专业判断。
- 是否出现私域、信任、转化、内容承接、用户关系、商业闭环等操盘视角。
- 结尾是否有关注、咨询、私域链接或 `chen-ccsq` 等自然承接。
- 是否有适合朋友圈转发的观点句，例如“不是……而是……”或“真正重要的是……”。
- 健康内容是否做合规提醒。
- HTML 是否适合复制到公众号后台。
