# 06 · 系统提示装配

> **前置阅读**：[05 · Agent 与循环](/05-agent-and-loop)
> **下一步**：[07 · 工具注册表与执行管道](/07-tool-registry-and-pipeline)

## 学习目标

1. 理解系统提示的分层装配机制（sections/contexts/tools/variables）
2. 掌握 prompt section 的注册与排序
3. 知道 request context 如何影响系统提示
4. 理解 "Model-visible ⟺ logged" 原则在系统提示中的体现
5. 能注册一个自定义 prompt section

---

## 一、系统提示的组成

`dsh` 的系统提示不是一段静态文本，而是由多个 **section** 动态装配而成：

```mermaid
flowchart TD
    subgraph Sections[Prompt Sections]
        Persona[persona<br/>0-49]
        CodeOnly[code-only collapse<br/>99]
        ToolGuidance[per-tool guidance<br/>100-199]
        Skills[skills<br/>200-299]
        Contexts[contexts<br/>300-399]
        Sdk[tools:sdk<br/>Code Mode]
    end

    subgraph Variables[变量插值]
        ModelVar[model]
        CwdVar[cwd]
        TimeVar[time]
        CustomVar[自定义]
    end

    subgraph Contexts[Request Context]
        Workspace[workspace instructions]
        Time[time context]
        Custom[自定义 context]
    end

    Sections --> Assembly[assemble()]
    Variables --> Assembly
    Contexts --> Assembly
    Assembly --> FinalPrompt[最终系统提示]
```

---

## 二、Prompt Sections

### 2.1 Section 注册

**文件**：`packages/core/system-prompt/src/index.ts`

系统提示通过注册 section 来构建。每个 section 有：

- **name**：唯一标识
- **order**：排序权重（数字越小越靠前）
- **render**：渲染函数，返回文本

```typescript
// 概念示意
ctx.systemPrompt.section({
  name: 'persona',
  order: 0,
  render: (ctx: AssembleContext) => {
    return agent.persona.replace('{{model}}', agent.model)
  }
})
```

### 2.2 Section 排序约定

`dsh` 的 section order 有约定俗成的 band：

| Order 范围 | 用途 | 示例 |
|---|---|---|
| 0-49 | persona | agent 人设 |
| 50-98 | 其他基础 | 杂项基础 |
| 99 | code-only collapse | Code Mode 声明 |
| 100-199 | per-tool guidance | 每个工具的使用指南 |
| 200-299 | skills | 技能目录 |
| 300-399 | contexts | request context |

### 2.3 Code Mode 的 collapse section

```typescript
// packages/core/tools/src/index.ts:51
const COLLAPSE_SECTION_ORDER = 99

// :58
const CODE_ONLY_INSTRUCTION = 
  '`run_code` is the only tool you can call directly — ' +
  'a tool call naming any other tool fails. ' +
  'Reach every tool the SDK declares below from inside the program.'

// :855-863
const collapseSection = {
  name: 'tools:code-only',
  order: COLLAPSE_SECTION_ORDER,
  render: (ctx) => isCodeMode(ctx) ? CODE_ONLY_INSTRUCTION : undefined
}
```

### 2.4 SDK section

```typescript
// packages/core/tools/src/index.ts:875-892
const sdkSection = {
  name: 'tools:sdk',
  order: ...,  // 在 per-tool guidance 之后
  render: (ctx) => {
    const schemas = collectToolSchemas(ctx)
    return renderToolsSdk(schemas)  // 生成 TypeScript SDK
  }
}
```

`renderToolsSdk` 生成完整的 TypeScript SDK 声明，让模型在 Code Mode 下知道如何调用工具。

---

## 三、变量插值

### 3.1 内置变量

系统提示支持 `{{variable}}` 插值：

| 变量 | 含义 | 来源 |
|---|---|---|
| `{{model}}` | 当前模型名 | `agent.model` |
| `{{cwd}}` | 当前工作目录 | `agent.session.cwd` |
| `{{time}}` | 当前时间 | `new Date().toISOString()` |

### 3.2 自定义变量

插件可以注册自定义变量：

```typescript
// 概念示意
ctx.systemPrompt.variable('myVar', (ctx) => {
  return computeMyVar(ctx.agent)
})
```

---

## 四、Request Context

### 4.1 RequestContext

**文件**：`packages/context/`

Request context 提供模型可见的上下文信息，与 prompt section 不同的是，它是**按需注入**的。

| Context | 用途 | 包 |
|---|---|---|
| workspace instructions | 工作区指令 | `packages/context/` |
| time context | 当前时间 | `packages/context/` |

### 4.2 request/context 事件

```typescript
// SessionEventMap 中的 request/context
'request/context': RequestContext  // 路由元数据
```

`request/context` 事件记录每次请求的上下文，用于重建。

### 4.3 RuntimeContext 投影

`Agent` 的 `RuntimeContext`（`packages/core/agent/src/runtime-context.ts`）跟踪最后保留的 runtime-context 快照：

```typescript
// runtime-context.ts:34-56
constructor(session: Session) {
  // 从 session 事件末尾向前扫描，找到最后一个 request/context 事件
  // 然后注册 listener 跟踪后续变化
}
```

---

## 五、装配流程

### 5.1 assemble()

```mermaid
sequenceDiagram
    participant Loop as Agent Loop
    participant SysPrompt as systemPrompt
    participant Sections as Sections
    participant Contexts as Contexts

    Loop->>SysPrompt: assemble(agent)
    SysPrompt->>SysPrompt: 收集所有 section
    SysPrompt->>Sections: 按 order 排序
    Sys->>Sections: 依次 render
    Sections-->>SysPrompt: 文本或 undefined
    SysPrompt->>Contexts: 收集 request context
    Contexts-->>SysPrompt: context 文本
    SysPrompt->>SysPrompt: 变量插值
    SysPrompt-->>Loop: 最终系统提示
```

### 5.2 AssembleContext

```typescript
// packages/core/agent/src/dispatch.ts:174-176
export function assembleContextFor(agent: Agent, signal?: AbortSignal): AssembleContext {
  return { agent, scope: agent, ...signal === undefined ? {} : { signal } }
}
```

`AssembleContext` 携带 agent 和 scope，确保 section 渲染时能访问当前 agent 信息。

---

## 六、"Model-visible ⟺ logged" 原则

`AGENTS.md` 规定：

> **Model-visible ⟺ logged**: anything that reaches a model request must be reconstructable from the session log; a new model-visible input requires a session event.

这意味着：

1. 系统提示的**每个部分**都必须可从 session log 重建
2. 新增 model-visible 输入需要新增 session 事件
3. `request/header` 事件记录每次请求的系统提示快照

### 6.1 request/header 事件

```typescript
// SessionEventMap
'request/header': {
  data: { header: EpochHeader; reason: string }
}
```

`EpochHeader` 包含 `systemPrompt` 和 `tools` 的快照，用于重建。

### 6.2 foldRequestHeader

```typescript
// packages/core/session/src/request-header.ts:65-71
export function foldRequestHeader(events: readonly SessionEvent[]): EpochHeader | undefined {
  let state: EpochHeader | undefined
  for (const event of events) {
    if (event.type === 'request/header') state = canonicalHeader(event.data.header)
  }
  return state
}
```

折叠 `request/header` 事件得到最新快照——纯离线重建路径。

---

## 七、注册自定义 Section

### 7.1 示例

```typescript
// 我自己的插件
import { definePlugin } from '@deepseek-ai/dsh-<my-pkg>'

export const name = 'my-plugin'
export const inject = ['systemPrompt', 'agents']

export function apply(ctx: Context) {
  ctx.systemPrompt.section({
    name: 'my-custom-section',
    order: 150,  // 在 per-tool guidance band
    render: (assembleCtx: AssembleContext) => {
      const { agent } = assembleCtx
      return `Custom instruction for ${agent.model}: ...`
    }
  })
}
```

### 7.2 条件渲染

section 可以返回 `undefined` 来跳过：

```typescript
ctx.systemPrompt.section({
  name: 'code-only-instruction',
  order: 99,
  render: (ctx) => {
    if (!isCodeMode(ctx)) return undefined  // 非 Code Mode 跳过
    return CODE_ONLY_INSTRUCTION
  }
})
```

---

## 实战练习

1. **找到 persona section**：在 `packages/bundle/base/cordis.patch.yml` 或 `examples/headless-agent/cordis.yml` 中找到 `persona` 配置，说明它如何被注入系统提示。

2. **追踪 SDK section**：打开 `packages/core/tools/src/index.ts`，找到 `sdkSection`，说明它在什么条件下渲染。

3. **理解 request/header**：打开 `packages/core/session/src/request-header.ts`，阅读 `foldRequestHeader`，说明它如何从事件日志重建系统提示。

---

## 关键源码定位

| 内容 | 位置 |
|---|---|
| system-prompt 包 | `packages/core/system-prompt/src/index.ts` |
| Code Mode collapse section | `packages/core/tools/src/index.ts:51,58,855-863` |
| SDK section | `packages/core/tools/src/index.ts:875-892` |
| renderToolsSdk | `packages/core/tools/src/ts-types.ts:273-293` |
| AssembleContext | `packages/core/agent/src/dispatch.ts:174-176` |
| request/header 折叠 | `packages/core/session/src/request-header.ts:65-71` |
| RuntimeContext | `packages/core/agent/src/runtime-context.ts:34-56` |
| context 包 | `packages/context/` |

---

## 下一步

本文理解了系统提示装配。下一篇 [07 · 工具注册表与执行管道](/07-tool-registry-and-pipeline) 将讲解 `defineTool` DSL 和 pre/guard/around/post/result 执行管道。
