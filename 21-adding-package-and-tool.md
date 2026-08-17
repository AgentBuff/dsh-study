# 21 · 添加新包与工具

> **前置阅读**：[20 · SDK 与 JSON-RPC 协议](/20-sdk-and-json-rpc)
> **下一步**：[22 · 添加 LLM 适配器与 Chat 节点](/22-adding-llm-and-node)

## 学习目标

1. 掌握添加新 workspace package 的完整流程
2. 理解 package.json 不变量和 tsconfig 配置
3. 掌握工具开发的完整契约
4. 知道工具的 UI 渲染意图设计
5. 理解 Code Mode 自动集成

---

## 一、添加新包

### 1.1 目录结构

**文件**：`docs/cookbook/adding-a-package.md:10-21`

```
packages/<group>/<pkg>/
  package.json     # 从 packages/core/tools 复制，调整 name/description/deps
  tsconfig.json    # extends ../../../tsconfig.base.json, rootDir src, outDir lib/types
  src/index.ts     # service default export 或 plugin (name/inject/apply/Config)
  README.md        # service API, events, extension points, design notes
```

### 1.2 选择包组

现有包组：`core`、`llm`、`bash`、`compact`、`subagent`、`todo`、`session-persistence`、`ui`、`util`、`support`。

新包组允许，但必须是纯容器：无 `package.json`，无源文件，包仍在其下一级。

### 1.3 package.json 不变量

**文件**：`adding-a-package.md:25`

由 `pnpm run constraints` / `scripts/check-workspace-constraints.ts` 强制：

| 字段 | 要求 |
|---|---|
| `private` | `true` |
| `version` | 匹配根 `package.json` |
| `type` | `"module"` |
| `main` | `"lib/index.js"` |
| `types` | `"lib/types/index.d.ts"` |
| `exports["."].types` | `"./lib/types/index.d.ts"` |
| `exports["."].default` | `"./lib/index.js"` |
| `@deepseek-ai/cordis` | 同时在 peerDependencies 和 devDependencies（同范围） |
| `@deepseek-ai/schemastery` | 在 dependencies（runtime validator） |
| `files` | 恰好 `lib/index.js`, `lib/invariant.js`, `lib/types/**/*.d.ts` + 包特定产物 |

### 1.4 相对导入用 .ts 后缀

**文件**：`adding-a-package.md:27`

```typescript
// 源码中
export * from './types.ts'
```

编译器将 `.ts` 重写为 `.js`（emitted JS），声明中保留 `.ts`（NodeNext 消费者解析到 `.d.ts`）。

### 1.5 注册到根配置

| 文件 | 变更 |
|---|---|
| `tsconfig.base.json` | 现有包组无需编辑；新包组加 `./packages/<group>/*/src` 到 `@deepseek-ai/dsh-*` 通配符 |
| `tsconfig.host.json` 或 `tsconfig.client.json` | 加 `{ "path": "./packages/<group>/<pkg>" }` 到 `references` |
| `knip.json` | 仅当包有仓库发现未覆盖的入口时 |

### 1.6 自动覆盖（无需编辑）

- 根 `package.json` workspaces
- `scripts/publint-all.ts`
- `tsdown.config.ts`
- `.oxlintrc.json`
- `scripts/check-workspace-constraints.ts`

### 1.7 验证

```sh
pnpm install
pnpm run doc-sync
pnpm run constraints && pnpm run typecheck && pnpm run lint
pnpm run build && pnpm run hygiene
```

---

## 二、包拓扑决策

### 2.1 能力缝三角色

**文件**：`adding-a-package.md:42-43`

可替换能力：将 Service Definition / Service Provider / Consumer 角色分到独立包（当它们独立演化时）。单用途插件保持一个包。

### 2.2 命名规则

**文件**：`adding-a-package.md:47-71`

命名稳定的当前职责，不命名第一个实现、可能的未来扩展或 Cordis 基类。

| 词 | 使用场景 | 不使用场景 |
|---|---|---|
| `Controller` | 接受命令/用户意图，改变一个域或展示状态 | 执行任意工作、拥有 provider 舰队 |
| `Store` | 拥有一个数据集，主要提供 CRUD/snapshot/订阅 | 验证状态机、仲裁权限 |
| `Registry` | 拥有动态命名注册集 | 主要职责是调度/执行 |
| `Runtime` | 运行实时工作，拥有调度/取消/生命周期 | 只存储记录、返回目录 |
| `Executor` | 运行一个显式请求或解析的规范 | 拥有广泛应用生命周期 |
| `Provider` | 提供一个能力定义的实现 | 是能力定义本身 |

### 2.3 ctx key 规则

- 单数 `ctx` key：一个 engine/runtime/policy/controller
- 复数 `ctx` key：registry 或拥有多个命名成员的 service
- 不复用一个 Cordis `Context` key 给不兼容的 host/client 声明

---

## 三、工具开发

### 3.1 最小形状

**文件**：`docs/cookbook/adding-a-tool.md:9-36`

```typescript
import { readFile } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'read_file',
    description: 'Read a file from disk.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute path' },
      limit: { type: 'number' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      return readFile(args.path, { encoding: 'utf8', signal: exec.signal })
    },
  }))
}
```

注册是基于 effect 的：dispose plugin fiber 即注销工具。

### 3.2 execute() 契约规则

**文件**：`adding-a-tool.md:42-50`

| 规则 | 说明 |
|---|---|
| Args 已验证 | `defineTool` 在 `execute` 前验证 model-generated `arguments` |
| 注册借用只读定义 | 不修改 schema 或替换回调 |
| 执行身份受保护 | `exec.token`、`callId`、`name`、`arguments`、`agent`、`signal` 不可变 |
| 返回一个规范 JSON 值 | `output.schema` 使用 `ValueSchemaSpec` |
| 抛出或无效值 = `isError` | registry 捕获抛出并包含 schema/renderer 失败 |
| 遵守 `exec.signal` | 触发时取消 in-flight 工作 |
| `presentationMeta` 可选 | 投影持久化 card 数据 |

### 3.3 长运行工作

**文件**：`adding-a-tool.md:52-55`

```typescript
ctx.jobs.start({ kind, label, owner: exec.agent, run })
```

- registry 在 producer body 前拒绝 pre-aborted 调用
- runtime 验证所有权和 task-controller 可用性
- 成功的后台分支返回 `{ kind: 'background', jobId }`
- producer 提供 `cancel`、非拒绝 `done`、可选 `readOutput`

### 3.4 执行策略与观察

**文件**：`adding-a-tool.md:58-59`

| 扩展点 | 用途 |
|---|---|
| `tools/pre-execute` | 可扩展 allow/deny/ask 策略 |
| `ctx.tools.guard()` | 最终单调 deny（后续 listener 无法撤销） |
| `tools/execute` | 包装 dispatch 加 deadline/retry/metrics |
| `tools/post-execute` | 替换展示内容或返回值 |
| `tools/result` | 观察不可变规范化结果 |

---

## 四、Code Mode 自动集成

### 4.1 免费获得

**文件**：`adding-a-tool.md:62-65`

Code Mode 中，每个可见注册工具可用 `await tools.<name>(args)`，无需额外集成。

### 4.2 类型推导

```typescript
// 生成的 ToolArgsMap 和 ToolOutputMap 从同一 schema 推导精确类型
const result: string = await tools.read_file({ path: '/tmp/test.txt' })
```

### 4.3 设计 output.schema

- 返回 handle 和字段直接
- 允许 scalar/array/null root
- 人类解释放在 `output.render`
- 中间值是 execution-local，不持久化

---

## 五、UI 渲染意图

### 5.1 两种方法

**文件**：`adding-a-tool.md:68-82`

| 方法 | 返回 | 用途 |
|---|---|---|
| `presentCall(args)` | `ToolCallView`（PENDING card） | 调用时的卡片 |
| `presentResult(args, { content, isError, meta? })` | 完成卡片 | 结果时的卡片 |

### 5.2 Card 类型

| Card | 用途 | 示例 |
|---|---|---|
| `generic` | 默认 | title + rawInput + content + locations |
| `terminal` | shell 命令 | tool-bash |
| `diff` | 文件创建/修改 | tool-fs `write`/`edit` |
| `search` | 发现结果 | tool-fs-search `grep`/`glob` |
| `web` | web 检索 | tool-web `web_search`/`web_fetch` |

### 5.3 硬规则

**文件**：`adding-a-tool.md:84-90`

| 规则 | 说明 |
|---|---|
| 纯度 | 在 live streaming 和 session-log REPLAY 上运行，必须是 `args`（+ result）的纯函数 |
| UI-only 格式化不进 model result | `output.render` 拥有 model-facing prose；`presentationMeta` + card presenters 拥有 replayable UI state |
| `defineTool` 软验证展示路径 | malformed 参数返回 `undefined`（generic fallback）而非抛出 |

### 5.4 locations 字段

```typescript
presentCall(args) → { card: 'generic', locations: [{ path, line? }] }
```

设置 `locations` 让有能力的编辑器跟随/跳转到工具触及的文件。

---

## 六、完整工具示例

### 6.1 带终端卡片的 shell 工具

```typescript
import { exec } from 'node:child_process'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-shell'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'run_command',
    description: 'Run a shell command.',
    parameters: {
      command: { type: 'string', required: true, description: 'Shell command' },
      cwd: { type: 'string', description: 'Working directory' },
    },
    output: {
      schema: { 
        type: 'object',
        properties: {
          stdout: { type: 'string' },
          stderr: { type: 'string' },
          exitCode: { type: 'number' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.stdout }],
    },
    presentCall(args) {
      return { card: 'terminal', title: args.command, cwd: args.cwd }
    },
    presentResult(_args, { content, isError }) {
      return { card: 'terminal', title: 'completed', output: content[0]?.text ?? '', isError }
    },
    async execute(args, exec) {
      return new Promise((resolve) => {
        const proc = exec(args.command, { cwd: args.cwd, signal: exec.signal })
        let stdout = '', stderr = ''
        proc.stdout?.on('data', (d) => { stdout += d })
        proc.stderr?.on('data', (d) => { stderr += d })
        proc.on('close', (exitCode) => resolve({ stdout, stderr, exitCode: exitCode ?? -1 }))
      })
    },
  }))
}
```

### 6.2 带 diff 卡片的文件写入工具

```typescript
ctx.tools.register(defineTool({
  name: 'write_file',
  description: 'Write content to a file.',
  parameters: {
    path: { type: 'string', required: true },
    content: { type: 'string', required: true },
  },
  output: {
    schema: { type: 'object', properties: { written: { type: 'boolean' } } },
    render: () => [{ type: 'text', text: 'File written.' }],
  },
  presentCall(args) {
    return { 
      card: 'diff', 
      title: `write ${args.path}`,
      diffs: [{ path: args.path, oldText: null, newText: args.content }],
      locations: [{ path: args.path }],
    }
  },
  async execute(args, exec) {
    await writeFile(args.path, args.content, { signal: exec.signal })
    return { written: true }
  },
}))
```

---

## 七、包 README

### 7.1 必需结构

**文件**：`adding-a-package.md:77-103`

```markdown
## Model Experience

### Request context and condition

#### What the model sees

[数据相关字段或生成的 catalog 链接]

##### Verbatim text for this field, when needed

\`\`\`markdown
[稳定系统提示文本，逐字复制]
\`\`\`

#### Token effect

[Fixed/conditional/retained/replaced/capped/zero-direct]

#### KV Cache effect

[Append-only/prefix-stable/replacing/independent]

## Known Limitations and Deferred Work

- **Consumer-visible gap** — 确切缺失操作、后果、维护者约束
```

### 7.2 无 context effect 的包

使用 `SENTENCE_MODEL_EXPERIENCE` 中的 `None, as` 或 `Indirectly, through` 句式，或加入 `NO_MODEL_EXPERIENCE_SECTION`。

---

## 实战练习

1. **创建新包**：按 1.1-1.7 步骤创建 `packages/util/my-utils/` 包，包含一个简单的字符串处理 service。

2. **创建工具**：按 3.1 最小形状创建一个 `list_files` 工具，列出目录内容，使用 `generic` card。

3. **设计 UI 卡片**：为 `list_files` 工具添加 `presentCall` 和 `presentResult`，设置 `locations`。

4. **理解纯度约束**：说明为什么 `presentCall` 和 `presentResult` 必须是纯函数，在 replay 时会发生什么。

---

## 关键源码定位

| 内容 | 位置 |
|---|---|
| 添加包 cookbook | `docs/cookbook/adding-a-package.md` |
| 添加工具 cookbook | `docs/cookbook/adding-a-tool.md` |
| 扩展 cookbook | `docs/cookbook/extension-cookbook.md` |
| package.json 不变量 | `docs/cookbook/adding-a-package.md:25` |
| 命名规则表 | `docs/cookbook/adding-a-package.md:51-71` |
| 工具最小形状 | `docs/cookbook/adding-a-tool.md:9-36` |
| execute() 契约 | `docs/cookbook/adding-a-tool.md:42-50` |
| 长运行工作 | `docs/cookbook/adding-a-tool.md:52-55` |
| 执行策略扩展点 | `docs/cookbook/adding-a-tool.md:58-59` |
| Code Mode 集成 | `docs/cookbook/adding-a-tool.md:62-65` |
| UI 渲染意图 | `docs/cookbook/adding-a-tool.md:68-82` |
| Card 类型 | `docs/cookbook/adding-a-tool.md:73-82` |
| 硬规则 | `docs/cookbook/adding-a-tool.md:84-90` |
| Model Experience 格式 | `docs/cookbook/adding-a-package.md:77-103` |
| defineTool | `packages/core/tools/src/index.ts` |
| ToolRuntime | `packages/core/tools/src/index.ts` |
| check-workspace-constraints | `scripts/check-workspace-constraints.ts` |

---

## 下一步

本文理解了添加新包与工具的完整流程。下一篇 [22 · 添加 LLM 适配器与 Chat 节点](/22-adding-llm-and-node) 将讲解 LLM 适配器和 Conversation Node 开发。
