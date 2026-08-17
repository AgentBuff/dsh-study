---
layout: home

hero:
  name: DeepSeek Harness
  text: 渐进式学习站
  tagline: 从 Cordis 基础到二次开发实战，24 篇文档带你掌握插件化 Agent 框架
  actions:
    - theme: brand
      text: 开始学习
      link: /00-overview
    - theme: alt
      text: 学习路径
      link: /README

features:
  - title: 第一阶段 · 基础认知
    details: 项目总览、Cordis 框架五大思想、仓库布局与构建体系、启动与组合机制。建立全局认知。
    link: /00-overview
    linkText: 4 篇文档
  - title: 第二阶段 · 核心架构
    details: 会话事件溯源、Agent 与循环、系统提示装配、工具注册表与执行管道、Code Mode 机制。
    link: /04-session-event-sourcing
    linkText: 5 篇文档
  - title: 第三阶段 · 能力接缝
    details: 三角色模型、LLM 接缝、执行类接缝（shell/fs/subprocess/web/skill）、持久化与投影。
    link: /09-capability-seams-pattern
    linkText: 4 篇文档
  - title: 第四阶段 · Web GUI 架构
    details: Host/Client 分离、Typert Remote 机制、客户端 ui-* 插件体系与 Slot 系统。
    link: /13-host-client-architecture
    linkText: 3 篇文档
  - title: 第五阶段 · 扩展开发实战
    details: 添加新包、工具、LLM 适配器、Chat 节点，配完整代码示例与实战练习。
    link: /16-adding-a-package
    linkText: 5 篇文档
  - title: 第六阶段 · 高级主题
    details: Preset/Profile 定制、子代理与工作流引擎、测试策略与 CI 门禁。
    link: /21-preset-and-profile
    linkText: 3 篇文档
---

## 学习路径总览

```mermaid
flowchart LR
    S1[第一阶段<br/>基础认知] --> S2[第二阶段<br/>核心架构]
    S2 --> S3[第三阶段<br/>能力接缝]
    S3 --> S4[第四阶段<br/>Web GUI]
    S4 --> S5[第五阶段<br/>扩展实战]
    S5 --> S6[第六阶段<br/>高级主题]
    S6 --> APP[附录<br/>术语表 / 源码速查]

    style S1 fill:#4caf50,color:#fff
    style S2 fill:#2196f3,color:#fff
    style S3 fill:#ff9800,color:#fff
    style S4 fill:#9c27b0,color:#fff
    style S5 fill:#f44336,color:#fff
    style S6 fill:#607d8b,color:#fff
    style APP fill:#795548,color:#fff
```

## 如何使用本站

1. **按顺序学习**：从 [00 · 项目总览](/00-overview) 开始，每篇文档标注了前置阅读与下一步。
2. **查阅式学习**：通过左侧侧边栏或顶部搜索直接定位主题。
3. **动手实践**：每篇文档末尾有实战练习，建议在主仓 checkout 上操作。
4. **源码对照**：文档中所有代码示例标注了源码位置 `file_path:line`，便于跳转查阅。

## 项目背景

DeepSeek Harness（`dsh`）是 DeepSeek AI 开源的**插件化 Agent 框架**，基于 vendored Cordis 构建，核心理念是"**一切皆插件**"——包括模型适配器、工具注册表、会话日志、Agent 循环本身都可从配置替换。

- 主仓：[github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- 技术栈：TypeScript（ESM）、Node.js 22.19+/24+、pnpm workspace、Cordis 插件框架
- 规模：54 个包组、200+ 个 npm 包、事件溯源架构、Host/Client 分离、Typert 类型图

> 本学习站独立于主仓，不修改主仓任何文件。文档内容基于源码分析整理，仅供学习交流。
