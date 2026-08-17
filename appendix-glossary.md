# 附录 A · 术语表

> **前置阅读**：[23 · 测试与门禁](/23-testing-and-gates)
> **下一步**：[附录 B · 源码地图](/appendix-source-map)

本术语表覆盖 DeepSeek Harness 的核心域词汇，每个概念一个规范术语。术语链接到其条目；实现细节在 package READMEs 和 Agent Notes。

---

## A.1 能力缝（capability seam）

### seam（缝）

一个**可替换能力**，包含三个角色：

| 角色 | 说明 | 示例 |
|---|---|---|
| **Service Definition** | Cordis `Service`，拥有 `ctx.<key>` 和词汇类型 | `ShellExecutor`（抽象类）、`WebRuntime`（具体 registry） |
| **Service Provider** | 提供能力定义的实现 | `dsh-bash-local`、`dsh-bash-sandbox` |
| **Consumer** | 注入 service 的消费者 | `dsh-tool-bash` |

**规则**：
- Service Definition 是 Cordis `Service`（抽象类或具体 registry），**永不**是 TypeScript `interface`
- 角色通常在独立包中（当独立演化时）
- 一个包可拥有多个角色（当是一个 concern 时），如 `dsh-llm` 拥有 Service Definition 和 Consumer
- **seam 是完整能力，永不只是一个角色**

### canonical example

`packages/shell`：
- `dsh-shell`（Service Definition）
- `dsh-bash-local` / `dsh-bash-sandbox`（providers）
- `dsh-tool-bash`（Consumer）

### 10 个能力缝

| 缝 | Service Definition | Providers |
|---|---|---|
| shell | `ShellExecutor` | `dsh-bash-local`、`dsh-bash-sandbox`、`dsh-pwsh-local` |
| subprocess | `SubprocessRuntime` | local process-tree provider |
| fs | `FileSystem` | local provider |
| llm | `LlmRuntime` | `dsh-llm-deepseek` |
| web | `WebRuntime` | search/fetch providers |
| lsp | `Lsp` | language-server provider |
| compaction | `CompactionEngine` | basic provider |
| subagent | `SubagentRuntime` | providers |
| workflow | `WorkflowEngine` | worker-thread provider |
| skill | `SkillService` | local impl |

---

## A.2 Agent 作用域（agent-scope）

### scope（作用域）

per-agent 注册的单位：一个贡献（tool、prompt section、variable、restriction、listener）要么是 *global*（每个 agent 可见），要么是 *scoped*（恰好一个 [scope key](#a2-scope-key) 拥有）。

**两个层级，扁平**：scoped 注册**不**继承到 subagents；subtree 行为用 [lineage](#a2-lineage) 数据表达，**永不**用 scope 结构。

### scope key

scope 的 opaque identity，按对象身份比较。

**harness 约定**：live agent 是自己 scope 的 key。

### agent context（`agent.ctx`）

agent 的 scoped context；通过它注册的是 scope-visible AND scope-lifetime（一个事实驱动两者），其上的 listener 参与该 agent 的 scope-filtered dispatches。

### scope carrier

scope-filtered dispatch 携带的 `thisArg`（由 `scopeTarget` 构建）；其 filter 接受 untagged listeners 加上 subject 自己的。*subject-less* carrier（无 key）只接受 untagged listeners。

### scoped dispatch

规则：关于一个 agent 活动的事件用该 agent 的 carrier dispatch。关于 registry 本身的事件（tool 被添加）是 *registry-subject*，保持 unfiltered。

### shadowing

most-specific-wins 名称解析：scoped tool/section/variable 替换其同名 global twin（仅对该 scope）。per-agent persona 和 per-agent tool-variant 机制。

### restriction / scope-local registration

- **restriction**（`tools.restrict`）：为一个 scope 过滤 GLOBAL tool set（通过 intersection 组合）
- **scope-local registrations**：在该 filter 之后 merge
- 被过滤掉的 global tool 在 prompt 中**缺席**并拒绝执行，与不存在的 tool 不可区分

### setup window

创建 slot，creator 组合 agent 的 scoped world（`CreateAgentOptions.setup`）：
- 在 scope 和 agent object 存在之后
- 但在 agent 或 session 发布、`agent/session-start` 触发、或第一个 prompt 装配之前
- Setup 注册；**永不**驱动 agent

### lineage

parent/child 事实作为数据携带（`parentSession`、durable `delegationDepth`、runtime `subagentDepth`）；**永不**影响 visibility。

---

## A.3 Goal（目标）

### goal

一个 durable completion objective，附加到现有 session，有 revisioned `active` / `paused` / `blocked` / `complete` phase 和 goal-round cap；`blocked` 保留 policy code 和 explanation。

**goal 是 state**，不是 scheduler 或独立 conversation；session log 仍是其 source of truth。

### goal round

为当前 goal 接受的一个 continuation cycle。same-session driver 将 goal round 物化为一个 goal-sourced [turn](#a4-turn)，可包含零或多个 steps；同 session 中无关的 human turns **不**消耗 goal-round cap。

### goal activation

process-local permission，允许 continuation consumer 接受另一个 goal round。Activation 是 `armed` 或 `disarmed`；**故意缺席**于 durable replay，所以 resume 和 fork 需要后续 human-authorized resume mutation（通过 `/goal` 或 model tool）才能自动工作。

---

## A.4 循环层级（loop hierarchy）

### turn

一个 session 中 admitted input 的 drain，在 model 和其 tools 停止或 terminal policy 介入后结束。

### step

一个 model request 加上其 response 引起的 tool executions；一个 turn 包含零或多个 steps。

### round

一个外层 policy iteration，包含一个 turn，如 [goal round](#a3-goal-round) 或一个 fresh-agent Ralph attempt。Round counters 属于该 policy，**不**计数 session 中的每个 turn。

---

## A.5 Ralph

### Ralph loop

一个 foreground fresh-agent workflow run，朝向 immutable objective。是 model-facing tool policy，由 workflow 和 subagent primitives 组合，**不是** same-session goal、agent-loop mode、scheduler、或 generic workflow-script feature。

### Ralph round

[Ralph loop](#a5-ralph-loop) 中的一个 fresh child session。child 接收**无** parent 或 prior-child conversation seed；shared workspace 和一个 bounded [Ralph handoff](#a5-ralph-handoff) 携带 cross-round state。

### Ralph handoff

从一个 continuing Ralph round 传递到下一个的 normalized bounded structured report，包含 status、summary、evidence、next steps、blocker text。它补充 shared workspace，**不**替换它作为 authority。

---

## A.6 人类命令（human command）

### human command

slash-prefixed instruction，由 human-facing adapter 通过 `ctx.commands` 解释和执行，**不**成为 model message。与 model-facing tool 和通过 `ctx.shell` 的 shell command execution 不同。

### command plane

discovery、parsing、dispatch、cancellation、result rendering，由 UI adapters 和 command plugins 拥有。Command output 是 UI state，除非 handler 单独 mutate durable domain。

### goal command

`/goal` human command，由 `dsh-command-goal` 贡献；直接观察或 mutate 当前 goal，而 goal domain 拥有每个 durable、model-visible record。

---

## A.7 核心架构术语

### Cordis

vendored 框架，提供 plugin-based composition。五大思想：Context、Service、Effect、Registry、Waterfall。

### plugin

Cordis 的组合单位。两种形式：
- **Service package**：default-export service class
- **Function plugin**：named-export `name` / `inject` / `Config` / `apply`，无 default export

**混合形式**会让 Loader 丢弃 function plugin 的 namespace。

### ctx key 规则

- 单数 `ctx` key：一个 engine/runtime/policy/controller
- 复数 `ctx` key：registry 或拥有多个命名成员的 service
- **不复用**一个 Cordis `Context` key 给不兼容的 host/client 声明

### Service Definition

Cordis `Service`，拥有 `ctx.<key>` 和词汇类型。是抽象类（如 `ShellExecutor`）或具体 registry（如 `WebRuntime`），**永不**是 TypeScript `interface`。

### Service Provider

提供 Service Definition 实现的 plugin。

### Consumer

注入 service 的 plugin，使用其能力。

---

## A.8 Session 术语

### SessionEventMap

通过 declaration merging 扩展的事件映射。25 个已知合并来源（含测试）。

### SurfaceEventType

只有 3 种：
- `user/message`
- `assistant/message`
- `tool/result`

### SESSION_FORMAT_VERSION

`0`（技术预览），无 compatibility promise。只有 structural format changes 才 bump。

### SCHEMA_VERSION

SQLite 独立版本，`15`。monotonic 递增。

### APPLICATION_ID

`0x44534850`（'DSHP'），SQLite application id。

### interruptedTurnClosers

崩溃恢复机制：生成确定性合成事件关闭开放 tail turn。

---

## A.9 LLM 术语

### StreamChunk

LLM stream 协议的 chunk 类型，7 种：
- `text-delta`
- `reasoning-delta`
- `tool-call-delta`
- `usage`
- `finish`
- `error`
- `metadata`

### BlockAssembler

agent-loop 唯一组装算法，将 StreamChunk 流组装为最终 Message。

### mapUsage

从 provider usage 映射到 harness usage。DeepSeek provider 需从 `prompt_tokens` 减去 `cacheRead` 得到 disjoint `inputTokens`。

### LlmAdapter

LLM provider backends 实现的抽象类。

### LlmRuntime

LLM service：adapter registry + waterfall-interceptable streaming call API。

---

## A.10 工具术语

### defineTool

工具定义的高阶函数，验证 model-generated `arguments` 并冻结执行身份。

### ToolRuntime

工具注册表和执行管道。ctx key: `tools`。

### Code Mode

工具的 programmatic 调用模式：每个可见注册工具可用 `await tools.<name>(args)`，无需额外集成。

### ToolArgsMap / ToolOutputMap

生成的类型映射，从同一 schema 推导精确参数和返回类型。

### render intent

工具 UI 渲染意图：`generic` / `terminal` / `diff` / `search` / `web`。

### presentationMeta

`output.presentationMeta(args, value)` 投影持久化 card 数据，使 replay 可重现。

---

## A.11 持久化术语

### PersistenceBackend

持久化后端接口：`loadStored` / `appendBatch` / `commitRepair` / `list`。

### PersistenceCoordinator

协调 session 持久化，JSONL 和 SQLite 两种后端。

### tornMarker

crash-tail 修复标记。

### ProjectionDefinition

session 投影定义，从 event log 派生视图。

---

## A.12 Preset 术语

### preset

per-session agent composition，从 preset cordis.yml 文件组合。

### standing mount

一个 preset 只组合一次，多个 agent 共享，通过 `bindScopeParent` join。

### preset mount 三个守卫

1. scope 存在
2. 所有 row 激活
3. 不能泄漏 ROOT service

### 四个 shipped presets

| Preset | 用途 |
|---|---|
| `minimal` | 最小配置 |
| `standard` | 标准配置 |
| `code` | Code Mode |
| `cordis` | 完整 Cordis |

位于 `apps/cli/config/agent-presets/`。

---

## A.13 Bundle 术语

### bundle

可安装的 `dsh --profile` patch-layer bundle。

### patch 层组合顺序

1. base bundle
2. mode bundle
3. 用户 `cordis.patch.yml`
4. `--patch` flag

### cordis.patch.yml

patch 替换整个 config，**不**合并。

---

## A.14 Web 客户端术语

### ConversationNodeDefinition

一个 independently registered business Event-to-Node state machine。

### ConversationEventRegistry

Conversation business Definitions 的 runtime registry。

### ChatNodeDataMap

通过 declaration merging 给每个 Node kind 精确的 data 类型。

### ConversationStepDataMap

给 Location data key 精确类型。

### 三种摄取路径

| 路径 | 说明 |
|---|---|
| Replace | 重建 loaded window |
| Prepend | 添加 older page |
| Append | 添加 live event |

### Slot 系统

UI 组合的唯一 API：`ctx.slots.register({ name, children?, store?, inject? }, Component)`。

### 四个 props shares

- `PropsRuntime<K>` — SlotMap + framework hooks
- `PropsRenderSlots<S>` — children keys
- `PropsStore<H>` — store factory
- inject face

### 三层分层

| 层 | 职责 |
|---|---|
| Data object layer | `runtime`，React-free |
| Render machinery | `web-react`，shell-only glue |
| Presentation components | plugin packages' `src/client/`，pure props |

---

## A.15 SDK 术语

### wire protocol

3 个请求 + 4 个通知：
- 请求：`initialize` / `session/prompt` / `shutdown`
- 通知：`session.event` / `session.status` / `subagent.started` / `subagent.finished`

### JsonRpcLineTransport

newline-delimited JSON-RPC 2.0。malformed 行忽略。错误码：
- `-32601`（method not found）
- `-32603`（internal error）

### SDK 三包结构

| 包 | 职责 |
|---|---|
| `protocol` | wire types + transport |
| `server` | JSON-RPC 方法 |
| `client` | 子进程管理 + 通知订阅 |

---

## A.16 测试术语

### REAL-composition test

通过 Loader boot test-only `cordis.yml` 的测试，**非** hand-built `ctx.plugin()`。

### HMR-safety test

dispose contributing fiber，assert 贡献移除。

### Snapshot test

keyless expected outputs cover external behavior。

### with-key policy

> We are DeepSeek — do not ration real-API tests.

no-key test 证明 plumbing；只有 with-key run 证明 agent works against real model。

### source plane vs artifact plane

测试解析通过 `tsconfig.base.json` paths 到 `src`，**永不**通过 package `exports` 到 built `lib/`。

---

## A.17 命名规则

### Controller

接受命令/用户意图，改变一个域或展示状态。**不**用于执行任意工作、拥有 provider 舰队。

### Store

拥有一个数据集，主要提供 CRUD/snapshot/订阅。**不**用于验证状态机、仲裁权限。

### Registry

拥有动态命名注册集。**不**用于主要职责是调度/执行。

### Runtime

运行实时工作，拥有调度/取消/生命周期。**不**用于只存储记录、返回目录。

### Executor

运行一个显式请求或解析的规范。**不**用于拥有广泛应用生命周期。

### Provider

提供一个能力定义的实现。**不**是能力定义本身。

---

## A.18 防御性模式术语

### Branded

opaque cross-boundary ids，`Branded<B>` from `dsh-brand`，**永不** bare `string`。

### assertNever

closed unions 的终态。merge-extensible unions 通过 documented default fall through。

### next()

waterfall listeners MUST call `next()` delegate；返回 without it short-circuits the chain。

### Model-visible ⟺ logged

任何到达 model request 的东西必须可从 session log 重建。

### Source plane vs artifact plane

**永不**混合。Static gates 和 tests 解析 workspace imports 通过 tsconfig `paths` 到 `src`。

---

## 关键源码定位

| 内容 | 位置 |
|---|---|
| 官方术语表 | `docs/glossary.md` |
| capability seam 定义 | `docs/glossary.md:7-9` |
| agent-scope | `docs/glossary.md:11-21` |
| goal | `docs/glossary.md:23-27` |
| loop hierarchy | `docs/glossary.md:35-39` |
| Ralph | `docs/glossary.md:41-45` |
| human command | `docs/glossary.md:29-33` |
| 命名规则 | `docs/cookbook/adding-a-package.md:51-71` |
| Cordis 五大思想 | `docs/cordis-primer.md` |
| SessionEventMap | `packages/core/session/src/types.ts` |
| StreamChunk | `packages/llm/llm/src/types.ts` |
| ConversationNodeDefinition | `packages/client/runtime/src/client/contract/conversation.ts:170-228` |
| SDK wire types | `packages/sdk/protocol/src/types.ts` |

---

## 下一步

本术语表覆盖了核心域词汇。下一篇 [附录 B · 源码地图](/appendix-source-map) 将提供完整源码导航。
