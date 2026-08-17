# 附录 B · 源码地图

> **前置阅读**：[附录 A · 术语表](/appendix-glossary)

本源码地图提供 DeepSeek Harness 完整源码导航，按包组和功能分类。

---

## B.1 仓库顶层结构

```
deepseek-harness/
├── AGENTS.md              # 项目级 Agent 指南（CLAUDE.md symlink）
├── package.json           # 主仓配置
├── pnpm-workspace.yaml    # workspace 配置
├── tsconfig.base.json     # TS 基础配置 + paths 映射
├── tsconfig.host.json     # Host 聚合
├── tsconfig.client.json   # Client 聚合
├── tsdown.config.ts       # 运行时 bundle 配置
├── knip.json              # knip 配置
├── .oxlintrc.json         # oxlint 配置
├── vendor/                # Vendored Cordis 源码
├── packages/              # 54 个包组
├── python/                # Python SDK
├── native/                # node-addon-landlock-run
├── examples/              # Runnable cordis.yml leaves
├── .agents/               # Agent workflows 和 notes
├── docs/                  # 架构、catalogs、postmortems、cookbook
├── scripts/               # 仓库 gates 和 generators
├── website/               # VitePress 文档站
├── apps/                  # 应用入口
│   ├── cli/               # CLI 入口
│   └── web/               # Web 入口
└── study-docs/            # 本学习站
```

---

## B.2 packages/ 包组导航

### core/ — 产品 API 脊柱

| 包 | 职责 | 关键文件 |
|---|---|---|
| `session` | Session 事件溯源 | `src/types.ts`（SessionEventMap）、`src/repair.ts`（崩溃恢复） |
| `system-prompt` | 系统提示装配 | `src/index.ts` |
| `tools` | 工具注册表与执行管道 | `src/index.ts`（ToolRuntime/defineTool） |
| `agent` | AgentRegistry | `src/index.ts` |
| `agent-loop` | Agent Loop 实现 | `src/index.ts` |

### llm/ — LLM 能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `llm` | LlmRuntime Service Definition | `src/index.ts`、`src/assembler.ts`（BlockAssembler） |
| `llm-deepseek` | DeepSeek provider | `src/adapter.ts`（DeepSeekAdapter） |

### shell/ — Shell 能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `shell` | ShellExecutor Service Definition | `src/index.ts` |
| `bash-local` | 本地 bash provider | `src/index.ts` |
| `bash-sandbox` | 沙箱 bash provider | `src/index.ts` |
| `pwsh-local` | 本地 pwsh provider | `src/index.ts` |
| `tool-bash` | bash 工具 Consumer | `src/index.ts` |

### fs/ — 文件系统能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `fs` | FileSystem Service Definition + 策略 | `src/index.ts` |
| `tool-fs` | fs 工具 Consumer | `src/index.ts` |
| `tool-fs-search` | fs 搜索工具 | `src/index.ts` |

### subprocess/ — 子进程能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `subprocess` | SubprocessRuntime Service Definition | `src/index.ts` |

### terminal/ — 持久终端

| 包 | 职责 | 关键文件 |
|---|---|---|
| `terminal` | 持久会话 | `src/index.ts` |

### web/ — Web 能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `web` | WebRuntime Service Definition | `src/index.ts` |
| `tool-web` | web 工具 Consumer | `src/index.ts` |

### lsp/ — LSP 能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `lsp` | Lsp Service Definition | `src/index.ts` |

### compaction/ — 压缩能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `compaction` | CompactionEngine Service Definition | `src/index.ts` |

### subagent/ — 子代理能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `subagent` | SubagentRuntime Service Definition | `src/index.ts` |

### workflow/ — 工作流能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `workflow` | WorkflowEngine Service Definition | `src/index.ts` |

### skill/ — 技能能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `skill` | SkillService Service Definition | `src/index.ts` |

### context/ — 请求上下文

| 包 | 职责 | 关键文件 |
|---|---|---|
| `context` | request-context plugins | `src/index.ts` |

### bundle/ — 可安装 bundle

| 包 | 职责 | 关键文件 |
|---|---|---|
| `bundle` | bundle 框架 | `src/index.ts` |
| `base` | base bundle patch | `cordis.patch.yml` |
| `web-app` | web-app bundle patch | `cordis.patch.yml` |
| `headless` | headless bundle runner | `src/index.ts` |

### preset/ — Preset 组合

| 包 | 职责 | 关键文件 |
|---|---|---|
| `agent-presets` | AgentPresets 服务 | `src/index.ts`、`src/mount.ts`、`src/preset.ts`、`src/discovery.ts` |

### guard/ — 循环卫生

| 包 | 职责 | 关键文件 |
|---|---|---|
| `guard` | loop-hygiene + tool-timeout | `src/index.ts` |

### self-modification/ — 自修改

| 包 | 职责 | 关键文件 |
|---|---|---|
| `self-modification` | agent 检查/mount 自己的 plugins | `src/index.ts` |

### hooks/ — Hook 桥接

| 包 | 职责 | 关键文件 |
|---|---|---|
| `hooks` | Claude Code/Codex hook bridges | `src/index.ts` |

### session/ — 持久 session 数据

| 包 | 职责 | 关键文件 |
|---|---|---|
| `session-persistence` | PersistenceCoordinator | `src/coordinator.ts` |
| `session-persistence-sqlite` | SQLite 后端 | `src/schema.ts` |
| `session-projection` | ProjectionDefinition | `src/index.ts` |
| `session-titles` | session 标题 | `src/index.ts` |
| `session-telemetry` | session 遥测 | `src/index.ts` |

### identity/ — 匿名身份

| 包 | 职责 | 关键文件 |
|---|---|---|
| `identity` | anonymous identity | `src/index.ts` |

### settings/ — 用户设置

| 包 | 职责 | 关键文件 |
|---|---|---|
| `settings` | user-settings capability | `src/index.ts` |

### credentials/ — 凭证引用

| 包 | 职责 | 关键文件 |
|---|---|---|
| `credentials` | credential-reference capability | `src/index.ts` |

### acp/ — ACP 服务器

| 包 | 职责 | 关键文件 |
|---|---|---|
| `acp` | automation-only ACP server | `src/index.ts` |

### interaction/ — 交互能力

| 包 | 职责 | 关键文件 |
|---|---|---|
| `interaction` | approval/interaction capabilities | `src/index.ts` |

### boot/ — 共享启动

| 包 | 职责 | 关键文件 |
|---|---|---|
| `app-boot` | shared app-bin glue | `src/profile.ts`（profile 组合） |

### sdk/ — JSON-RPC 协议

| 包 | 职责 | 关键文件 |
|---|---|---|
| `protocol` | wire types + transport | `src/types.ts`、`src/transport.ts` |
| `server` | JSON-RPC 方法 | `src/server.ts` |
| `client` | 子进程管理 + 通知订阅 | `src/client.ts` |

### client/ — Web 客户端

| 包 | 职责 | 关键文件 |
|---|---|---|
| `runtime` | 数据对象层（React-free） | `src/client/contract/conversation.ts`、`src/client/conversation/definition-registry.ts`、`src/client/conversation/event-registry.ts` |
| `web-react` | 渲染机制层 | `src/boot.tsx` |
| `ui-conversation` | 对话 UI | `src/client/conversation-nodes/assistant.ts`、`inbox.ts`、`message.ts` |
| `ui-deliverables` | 交付物 UI | `src/client/turn-deliverables.ts` |
| `ui-goal` | 目标 UI | `src/client/goal-command-input.ts` |
| `ui-theme` | 主题 | `src/styles/` |
| `ui-workspace` | 工作区 UI | `src/client/` |
| `ui-sidebar` | 侧边栏 UI | `src/client/` |
| `ui-user-questions` | 用户问题 UI | `src/client/` |

### api/ — 远程 BFF

| 包 | 职责 | 关键文件 |
|---|---|---|
| `remotes` | BFF assembly | `src/index.ts` |
| `gateway` | Typert RPC gateway | `src/index.ts` |

### typert/ — 类型图

| 包 | 职责 | 关键文件 |
|---|---|---|
| `typert` | type graph generator/loader/registry | `src/index.ts` |

### e2b/ — E2B POC

| 包 | 职责 | 关键文件 |
|---|---|---|
| `e2b` | sandbox + FS/subprocess adapters | `src/index.ts` |

### todo/ — Todo 工具

| 包 | 职责 | 关键文件 |
|---|---|---|
| `todo` | todo_write tool | `src/index.ts` |

### plan/ — Plan 模式

| 包 | 职责 | 关键文件 |
|---|---|---|
| `plan` | plan mode as logged state | `src/index.ts` |

### examples/ — 示例 bundle

| 包 | 职责 | 关键文件 |
|---|---|---|
| `examples` | demo bundles | `cordis.yml` |

### support/ — 开发/测试基础设施

| 包 | 职责 | 关键文件 |
|---|---|---|
| `support` | dev/test infrastructure | `src/index.ts` |

### util/ — 零依赖工具

| 包 | 职责 | 关键文件 |
|---|---|---|
| `util` | zero-dependency utilities | `src/index.ts` |

---

## B.3 apps/ 应用入口

### cli/

CLI 入口。

| 文件 | 职责 |
|---|---|
| `src/bin.ts` | CLI bin 入口 |
| `config/agent-presets/` | 四个 shipped presets（minimal/standard/code/cordis） |
| `tests/snapshots/` | interactive-terminal journey snapshots |

### web/

Web 入口。

| 文件 | 职责 |
|---|---|
| `tests/snapshots/` | browser-rendered web GUI journey snapshots |

---

## B.4 docs/ 文档导航

### 顶层文档

| 文件 | 职责 |
|---|---|
| `architecture.md` | 架构总览（≤1,800 words） |
| `development.md` | 贡献者设置、日常 workflow、CI 摘要 |
| `cordis-primer.md` | Cordis 五大思想 |
| `glossary.md` | 术语表 |
| `testing.md` | 测试策略 |
| `defensive-patterns.md` | 防御性模式 |

### subsystems/

每个子系统一个 reference page：类型定义、语义、生成的 Cordis API。

### cookbook/

| 文件 | 职责 |
|---|---|
| `adding-a-package.md` | 添加新包完整 checklist |
| `adding-a-tool.md` | 工具开发参考 |
| `adding-a-conversation-node.md` | 添加 Web Client conversation node |
| `extension-cookbook.md` | 扩展 cookbook |

### postmortem/

事故故事。`0001-acp-default-export-drops-inject.md` 是经典案例。

### .agents/notes/

Agent Notes：active decision records。

| 子目录 | 职责 |
|---|---|
| `implemented/` | shipped reality（present tense） |
| `archived/` | frozen history |

---

## B.5 关键源码快速定位

### Session 核心

| 内容 | 位置 |
|---|---|
| SessionEventMap | `packages/core/session/src/types.ts` |
| 崩溃恢复 | `packages/core/session/src/repair.ts` |
| SurfaceEventType | `packages/core/session/src/types.ts` |
| SESSION_FORMAT_VERSION | `packages/core/session/src/types.ts` |
| SCHEMA_VERSION | `packages/session/session-persistence-sqlite/src/schema.ts` |
| APPLICATION_ID | `packages/session/session-persistence-sqlite/src/schema.ts` |

### Agent Loop

| 内容 | 位置 |
|---|---|
| AgentRegistry | `packages/core/agent/src/index.ts` |
| Agent Loop | `packages/core/agent-loop/src/index.ts` |
| Contract regressions | `packages/core/agent-loop/tests/contract-regressions.spec.ts` |

### 工具

| 内容 | 位置 |
|---|---|
| ToolRuntime | `packages/core/tools/src/index.ts` |
| defineTool | `packages/core/tools/src/index.ts` |
| 扩展点 | `packages/core/tools/README.md` |

### LLM

| 内容 | 位置 |
|---|---|
| LlmRuntime | `packages/llm/llm/src/index.ts` |
| BlockAssembler | `packages/llm/llm/src/assembler.ts` |
| StreamChunk | `packages/llm/llm/src/types.ts` |
| DeepSeekAdapter | `packages/llm/llm-deepseek/src/adapter.ts` |
| mapUsage | `packages/llm/llm-deepseek/src/adapter.ts` |

### 能力缝

| 缝 | Service Definition |
|---|---|
| shell | `packages/shell/shell/src/index.ts` |
| subprocess | `packages/subprocess/subprocess/src/index.ts` |
| fs | `packages/fs/fs/src/index.ts` |
| llm | `packages/llm/llm/src/index.ts` |
| web | `packages/web/web/src/index.ts` |
| lsp | `packages/lsp/lsp/src/index.ts` |
| compaction | `packages/compaction/compaction/src/index.ts` |
| subagent | `packages/subagent/subagent/src/index.ts` |
| workflow | `packages/workflow/workflow/src/index.ts` |
| skill | `packages/skill/skill/src/index.ts` |

### 持久化

| 内容 | 位置 |
|---|---|
| PersistenceCoordinator | `packages/session/session-persistence/src/coordinator.ts` |
| SQLite schema | `packages/session/session-persistence-sqlite/src/schema.ts` |
| ProjectionDefinition | `packages/session/session-projection/src/index.ts` |

### Preset

| 内容 | 位置 |
|---|---|
| AgentPresets 服务 | `packages/preset/agent-presets/src/index.ts` |
| mount 守卫 | `packages/preset/agent-presets/src/mount.ts` |
| preset 类型 | `packages/preset/agent-presets/src/preset.ts` |
| preset 发现 | `packages/preset/agent-presets/src/discovery.ts` |
| 四个 shipped presets | `apps/cli/config/agent-presets/` |

### Bundle

| 内容 | 位置 |
|---|---|
| base bundle patch | `packages/bundle/base/cordis.patch.yml` |
| web-app bundle patch | `packages/bundle/web-app/cordis.patch.yml` |
| headless bundle runner | `packages/bundle/headless/src/index.ts` |

### Boot

| 内容 | 位置 |
|---|---|
| profile 组合 | `packages/boot/app-boot/src/profile.ts` |

### Web 客户端

| 内容 | 位置 |
|---|---|
| ConversationNodeDefinition | `packages/client/runtime/src/client/contract/conversation.ts:170-228` |
| ConversationDefinitionRegistry | `packages/client/runtime/src/client/conversation/definition-registry.ts` |
| ConversationEventRegistry | `packages/client/runtime/src/client/conversation/event-registry.ts` |
| Web Shell boot | `packages/client/web-react/src/boot.tsx` |
| Goal Command Input 示例 | `packages/client/ui-goal/src/client/goal-command-input.ts` |
| Assistant Node | `packages/client/ui-conversation/src/client/conversation-nodes/assistant.ts` |
| Inbox Node | `packages/client/ui-conversation/src/client/conversation-nodes/inbox.ts` |
| Message Node | `packages/client/ui-conversation/src/client/conversation-nodes/message.ts` |
| Deliverables Definition | `packages/client/ui-deliverables/src/client/turn-deliverables.ts` |

### SDK

| 内容 | 位置 |
|---|---|
| wire types | `packages/sdk/protocol/src/types.ts` |
| JsonRpcLineTransport | `packages/sdk/protocol/src/transport.ts` |
| HarnessSdkJsonRpcServer | `packages/sdk/server/src/server.ts` |
| HarnessClient | `packages/sdk/client/src/client.ts` |

### ACP

| 内容 | 位置 |
|---|---|
| ACP server | `packages/acp/acp/src/index.ts` |

---

## B.6 配置文件导航

### TypeScript

| 文件 | 职责 |
|---|---|
| `tsconfig.base.json` | 基础配置 + paths 映射（`@deepseek-ai/dsh-*` 通配符） |
| `tsconfig.host.json` | Host 聚合 |
| `tsconfig.client.json` | Client 聚合 |
| `packages/<group>/<pkg>/tsconfig.json` | 包级配置（extends base，rootDir src，outDir lib/types） |

### 构建工具

| 文件 | 职责 |
|---|---|
| `tsdown.config.ts` | 运行时 bundle 配置 |
| `knip.json` | knip 配置 |
| `.oxlintrc.json` | oxlint 配置 |
| `vitest.config.ts` | vitest 配置 |

### Workspace

| 文件 | 职责 |
|---|---|
| `pnpm-workspace.yaml` | workspace 配置（globs `packages/*/*`） |
| `package.json` | 主仓配置 |

### Cordis

| 文件 | 职责 |
|---|---|
| `examples/headless-agent/cordis.yml` | 完整 profile 示例 |
| `packages/bundle/base/cordis.patch.yml` | base bundle patch |
| `packages/bundle/web-app/cordis.patch.yml` | web-app bundle patch |
| `apps/cli/config/agent-presets/*/cordis.yml` | 四个 shipped presets |

---

## B.7 脚本导航

### 仓库 gates

| 脚本 | 职责 |
|---|---|
| `scripts/check-workspace-constraints.ts` | workspace constraints |
| `scripts/run-gates.ts` | 所有文档门禁 |
| `scripts/verify-md-links.ts` | Markdown 链接检查 |
| `scripts/verify-md-wrap.ts` | 一行一段检查 |
| `scripts/doc-typecheck.ts` | fenced `ts` blocks 编译检查 |
| `scripts/verify-type-equiv.ts` | 类型粘贴 drift 检查 |
| `scripts/verify-doc-budgets.ts` | wordcount ceilings |
| `scripts/verify-export-jsdoc.ts` | JSDoc 完整性 |
| `scripts/verify-package-invariants.ts` | 包 invariant 检查 |
| `scripts/verify-package-readme-limitations.ts` | Known Limitations 检查 |
| `scripts/publint-all.ts` | publint |
| `scripts/migrate-packed-session-fixtures.ts` | fixture 迁移 |

### 生成器

| 脚本 | 职责 |
|---|---|
| `scripts/generate-tool-catalog.ts` | 工具 catalog 生成 |
| `scripts/generate-config-catalog.ts` | 配置 catalog 生成 |
| `scripts/generate-persistence-catalog.ts` | 持久化 catalog 生成 |
| `scripts/generate-module-graph.ts` | 模块图生成 |

---

## B.8 学习路径推荐

### 入门（第一阶段）

1. [00 · 项目总览](/00-overview)
2. [01 · Cordis 框架基础](/01-cordis-foundation)
3. [02 · 仓库布局与构建体系](/02-project-layout)
4. [03 · 启动与组合体系](/03-boot-and-composition)

### 核心机制（第二阶段）

5. [04 · 会话事件溯源](/04-session-event-sourcing)
6. [05 · Agent 与循环](/05-agent-and-loop)
7. [06 · 系统提示装配](/06-system-prompt-assembly)
8. [07 · 工具注册表与执行管道](/07-tool-registry-and-pipeline)
9. [08 · Code Mode 机制](/08-code-mode)

### 能力缝（第三、四阶段）

10. [09 · 能力接缝模式](/09-capability-seams-pattern)
11. [10 · LLM 与 DeepSeek 适配器](/10-llm-and-deepseek-adapter)
12. [11 · Shell 与 Subprocess 能力](/11-shell-and-subprocess)
13. [12 · FS 能力与策略](/12-fs-and-policy)
14. [13 · Web 与 LSP 能力](/13-web-and-lsp)
15. [14 · Compaction 与 Subagent 能力](/14-compaction-and-subagent)
16. [15 · Workflow 与 Skill 能力](/15-workflow-and-skill)

### 持久化与组合（第五阶段）

17. [16 · Session 持久化与投影](/16-session-persistence)
18. [17 · Preset 与 Profile 组合](/17-preset-and-profile)
19. [18 · Bundle 与 Patch 层](/18-bundle-and-patch)
20. [19 · Web GUI 与 ACP](/19-web-gui-and-acp)
21. [20 · SDK 与 JSON-RPC 协议](/20-sdk-and-json-rpc)

### 实战（第六阶段）

22. [21 · 添加新包与工具](/21-adding-package-and-tool)
23. [22 · 添加 LLM 适配器与 Chat 节点](/22-adding-llm-and-node)
24. [23 · 测试与门禁](/23-testing-and-gates)

### 附录

25. [附录 A · 术语表](/appendix-glossary)
26. [附录 B · 源码地图](/appendix-source-map)

---

## B.9 关键 Agent Notes

### 架构

| Note | 职责 |
|---|---|
| `2026-06-13-capability-seams.md` | 能力缝 rationale |
| `2026-07-15-agent-initiator-scope.md` | agent initiator scope |
| `2026-07-19-gui-web-client-architecture.md` | web client architecture |
| `2026-07-22-slot-type-chain-implementation.md` | slot system standard |
| `2026-08-09-client-conversation-node-assembly.md` | Conversation Node assembly |
| `2026-08-10-session-log-version-mechanism.md` | session log version mechanism |

### 测试

| Note | 职责 |
|---|---|
| `2026-06-19-real-api-e2e-ci.md` | real-API e2e CI |
| `2026-06-19-acp-snapshot-tests.md` | ACP snapshot tests |
| `2026-07-24-web-gui-browser-e2e-lane.md` | web e2e lane |
| `2026-07-30-web-browser-snapshot-ci-gate.md` | web browser CI gate |
| `2026-07-20-gui-testing-system.md` | GUI testing system |

### 流程

| Note | 职责 |
|---|---|
| `2026-07-04-doc-tiers-and-budgets.md` | doc tiers and budgets |
| `2026-07-10-readme-known-limitations-gate.md` | README Known Limitations gate |
| `2026-08-02-native-github-stacks-and-optional-rebases.md` | GitHub stacks |
| `2026-08-08-unified-github-label-taxonomy.md` | label taxonomy |
| `2026-08-09-concrete-prose-names-actors-and-recorded-facts.md` | concrete prose |

### Bug fix

| Note | 职责 |
|---|---|
| `2026-07-28-themed-scrollbars-and-reserved-gutter.md` | themed scrollbars |

---

## B.10 vendor/ 导航

### Vendored Cordis

| 内容 | 位置 |
|---|---|
| manifest + sync procedure | `vendor/README.md` |
| Cordis 源码 | `vendor/packages/` |

### Rescope mapping

vendored packages 被 rescoped（`@deepseek-ai/cordis`），`private: true`。mapping 见 `docs/rescope.md`。

---

## 下一步

本源码地图提供了完整源码导航。回到 [首页](/) 或 [学习导读](/README) 重新开始学习路径。
