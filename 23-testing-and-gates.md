# 23 · 测试与门禁

> **前置阅读**：[22 · 添加 LLM 适配器与 Chat 节点](/22-adding-llm-and-node)
> **下一步**：[附录 A · 术语表](/appendix-glossary)

## 学习目标

1. 掌握五层测试体系：Unit / Coverage / Real-API e2e / Snapshot / Web browser
2. 理解 with-key 策略：推理便宜，不 ration 真实 API 测试
3. 掌握 REAL-composition 测试要求
4. 理解 source plane vs artifact plane 测试解析
5. 知道 snapshot 测试何时必需
6. 掌握本地检查阶梯和 CI 门禁

---

## 一、五层测试体系

### 1.1 层级总览

**文件**：`docs/testing.md:7-13`

| 层级 | 命令 | 用途 |
|---|---|---|
| Unit | `pnpm run test` | vitest over package/example specs |
| Coverage gate | `pnpm run test:coverage` | per-file 100% on `packages/*/*/src` |
| Real-API e2e | `pnpm run test:e2e` | with-key tests against live provider APIs |
| Snapshot | `pnpm run test:snapshot` | keyless expected outputs cover external behavior |
| Web browser snapshot | `pnpm run test:web` | Chromium compares replayed browser output |

### 1.2 Unit 测试

**文件**：`docs/testing.md:9`

- vitest over package 和 example specs under `tests/**` directories
- 仓库 script specs under `scripts/**/*.spec.ts`
- 测试与代码区域在一起
- **每个 registry 需要 HMR-safety test**（dispose contributing fiber，assert cleanup）
- 偏好 edge cases、error paths、event ordering、concurrency races、contract regressions 永久测试

### 1.3 Coverage gate

**文件**：`docs/testing.md:10`

- **gating run**，per-file 100% on `packages/*/*/src`
- 未覆盖行通常是 dead code（gate 正确 flag for deletion），不是 missing test
- Line coverage 是必要的，**永远不充分** — 证明 lines ran，不证明 feature works as shipped
- `packages/shell/pwsh-local/src` 需要真实 `pwsh`：无则 executor suites self-skip，`vitest.config.ts` 豁免该文件

### 1.4 Real-API e2e

**文件**：`docs/testing.md:11`

- with-key tests against live provider APIs
- DeepSeek model + provider-specific smokes（gate on `EXA_API_KEY`、`PERPLEXITY_API_KEY` 等）
- 每个 suite 无 key 时 self-skip，keyless CI 保持 green
- 不是 cost signal

### 1.5 Snapshot 测试

**文件**：`docs/testing.md:12`

- keyless expected outputs cover external behavior — transport contracts 和 presentation
- persisted logs pin assembled backend behavior
- ACP boots real automation-server example，replays recorded session，diffs normalized JSON-RPC + re-persisted log
- headless backend scenarios boot explicit example composition through unexported JSONL test driver
- `apps/cli` separately owns product `dsh --profile headless` acceptance

**Snapshot 命令**：
| 命令 | 用途 |
|---|---|
| `pnpm run test:snapshot` | 运行 keyless snapshot |
| `pnpm run test:snapshot:record` | model transcript 变更时 re-record（需 key） |
| `pnpm run test:snapshot:refresh` | replay input 仍有效时刷新 |

### 1.6 Web browser snapshot

**文件**：`docs/testing.md:13`

- `pnpm run test:web`（required Linux PR gate）
- Chromium compares replayed browser output with `apps/web/tests/snapshots/`
- CI forces read-only `DSH_SNAPSHOT=replay`，**永不**写 expected outputs
- record/refresh 留在本地，每个 diff 需 review
- `test:web` 先 build（plugin CSS）

---

## 二、With-key 策略

### 2.1 推理便宜

**文件**：`docs/testing.md:18-19`

> We are DeepSeek — do not ration real-API tests.

- no-key test 证明 plumbing；只有 with-key run 证明 agent works against real model
- 覆盖 file-writing prompts、multi-turn conversations、tool use、mid-stream cancellation
- **最高价值是 smoke tests**：boot real example，send one prompt，check the world
- 捕获 "green unit tests, broken product" 类（mocks 无法捕获）
- Self-skip 保持 secretless CI 和 keyless contributors unblocked

### 2.2 Postmortem 0001 教训

**文件**：`docs/postmortem/0001-acp-default-export-drops-inject.md`

ACP default export drops inject 事件 — unit tests green 但产品 broken。smoke tests 捕获此类问题。

---

## 三、Mock 策略

### 3.1 优先真实实现

**文件**：`docs/testing.md:22-25`

> Mock only the expensive or non-deterministic boundary (LLM adapter, network, clock); keep everything downstream real.

- hand-rolled stand-in 证明 bridge moves bytes，不证明 shipping tool behaves as asserted
- Bridge tool-call tests 使用 scripted mock model + real tool + executor
- `makeBridgeHarness({ withBash: true })` 插入 `dsh-bash-local` 和 `dsh-tool-bash`，运行 `echo`

### 3.2 Recovery 测试

- 分离 pre/post-chunk failures by step
- 证明 failed chunks derive no message or tool side effect
- 覆盖 exhaustion、cancellation、policy composition、persistence、status、wire counts、transport-closing idle timeouts、shipping Loader composition

---

## 四、验证世界，不是自报告

### 4.1 外部验证

**文件**：`docs/testing.md:28-29`

- e2e assertion re-runs command 或 re-reads file externally
- keyword probe on agent's own output 让 cheating agent pass
- Assert untouched files byte-identical

### 4.2 资源所有权

- e2e tests own their resources
- 在 test 中创建 harness
- `afterEach` dispose（即使 failure/retry/timeout）
- shared fixtures 在 plain `tests/harness.ts`
- **永不**另一个 `*.e2e.ts`（importing spec re-registers its `describe` 并 duplicates real API calls）

---

## 五、REAL-composition 测试

### 5.1 要求

**文件**：`docs/testing.md:33-35`

> Product-visible plugins require a non-unit REAL-composition test.

- Hand-built `ctx.plugin(...)` suites **不充分**
- Boot test-only `cordis.yml` through Loader 和 app/process
- 只 mock external services 或 nondeterministic inputs
- assert model-visible request/log、durable state、user-visible output
- 保持 opt-ins out of shipped defaults

### 5.2 Guard 验证

**文件**：`docs/testing.md:34`

> A guard only guards if the regression actually fails it.

对于无 `inject` 的 plugin（bundle/composition plugins）：
- Loader smoke 在 default export 替换 required named exports 时保持 green
- 添加 explicit `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip assertion
- **证明它**：introduce regression，watch red，revert

### 5.3 真实 entry path

**文件**：`docs/testing.md:35`

"Real entry path" 指的是 published artifact：
- package `bin` 运行 built `lib/bin.js` under plain `node`
- 暴露 tsx masks 的 failures（settle races、module resolution、swallowed load failures）
- 同样适用于 non-index runtime entries（worker-thread sibling `lib/worker.cjs`）
- singleton modules shared across bundles

**保持 built-artifact smokes green**：
- `packages/examples/*/tests/built-bin.e2e.ts`
- `packages/code-runtime/code-runtime-worker-thread/tests/built-lib.e2e.ts`
- assert genuinely-missing config exits non-zero

---

## 六、测试解析：source plane only

### 6.1 路径解析

**文件**：`docs/testing.md:39`

- 每个 vitest config 指向 vite-tsconfig-paths at `tsconfig.base.json`
- bare workspace imports 解析到 `src`，**永不**通过 package `exports` 到 built `lib/`
- stale artifacts 会 load second copy of module singletons

### 6.2 Built artifacts 消费

只在以下情况显式消费 built artifacts：
- `lib`-mode subprocesses
- built smokes

---

## 七、测试子进程启动模式

### 7.1 三种模式

**文件**：`docs/testing.md:43-45`

| 模式 | 用途 |
|---|---|
| Built `lib/` through shared dual-mode launcher | CI 和 build-having test lanes 的 example/Cordis-config subprocess |
| Erasable `.ts` directly with Node | 不 load Cordis 的 protocol/OS fixtures（无 tsx 或 root paths map） |
| `src` | 只有 subject 是 source-path resolution 的测试 |

### 7.2 规则

- **不要** hand-write `--import tsx` for these subprocesses
- 选择 `src` 的测试需在测试中 state that contract

---

## 八、Snapshot 测试何时必需

### 8.1 触发条件

**文件**：`docs/testing.md:48`

每个 non-trivial model-、protocol-、或 human-visible change 在**同一 PR** 中 add/update keyless scenario through runnable example's owning snapshot suite。

### 8.2 不替代的内容

- Package tests
- e2e assertions
- mock/test-only compositions
- PR rationale

### 8.3 Snapshot 位置

| 场景 | 位置 |
|---|---|
| ACP automation scenarios | `examples/<name>/tests/snapshots/`，scenario table over `dsh-acp-snapshot` suite factory |
| Headless canonical-event JSONL | `examples/headless-agent` owns internal snapshots 和 replay fixtures |
| Interactive-terminal journeys | `apps/cli/tests/snapshots/`（JSONL-driven scenarios） |
| Browser-rendered web GUI | `apps/web/tests/snapshots/` |

### 8.4 特殊场景

- `pwsh-tool-turn` ACP scenario boots real `pwsh`，absent 时 skip
- `text-turn` ACP scenario pins full system-prompt/tool-schema content
- 其他 fixtures tokenize it，使 edit churn 一行

### 8.5 计划时覆盖

**文件**：`docs/testing.md:48`

新 capability seams、lifecycle variants、或 transcript surfaces 在 plan time 命名每个 coverage tier，并在 implementation 前验证 harness 能表达它。

---

## 九、本地检查阶梯

### 9.1 GUI 检查

**文件**：`packages/client/AGENTS.md`（Before you push 部分）

| 触发 | 命令 |
|---|---|
| Every GUI code change | `pnpm run test:gui`（秒级，无 browser/server） |
| 改变 assembled browser 或 visible conversation/UI output | `DSH_SNAPSHOT=replay pnpm run test:web` |
| Before a PR | 主仓 dsh-pre-push-checks skill |

### 9.2 Pre-push 选择

**文件**：`AGENTS.md`（Run relevant checks locally）

- Match evidence to surface：focused tests for behavior，snapshots for model/user output，`doc-sync` for docs，build/hygiene 和 built smokes for published paths，real-API e2e for provider behavior
- **永不** default to full suite 或 repeat passing check for commit/push
- CI owns exhaustive coverage 和 platform matrix
- 只在 explicit request、CI diagnosis、或 irreducibly repository-wide change 时 rehearse all locally

### 9.3 test:coverage vs test

**文件**：`AGENTS.md`

`test:coverage`，不是 `test`，是 CI coverage gate。

---

## 十、CI 门禁

### 10.1 主要门禁

| 命令 | 门禁内容 |
|---|---|
| `pnpm run test:coverage` | per-file 100% coverage on `packages/*/*/src` |
| `pnpm run typecheck` | TypeScript 类型检查 |
| `pnpm run lint` | oxlint |
| `pnpm run build` | tsc + tsdown |
| `pnpm run hygiene` | knip + publint + workspace constraints + NodeNext consumer check |
| `pnpm run doc-sync` | 所有文档门禁 |
| `pnpm run test:snapshot` | keyless snapshot |
| `pnpm run test:web` | web browser snapshot（Linux PR gate） |
| `pnpm run test:e2e` | real-API e2e（self-skip without key） |
| `pnpm run constraints` | workspace constraints |
| `pnpm run duplication` | cross-file TypeScript clone detection |

### 10.2 文档门禁

`pnpm run doc-sync` 包括：
- `verify-md-links` — 拒绝 missing targets 和 dead `#fragment` anchors
- `verify-md-wrap` — 一行一段
- `doc-typecheck` — fenced `ts` blocks 必须编译
- `verify-type-equiv` — 捕获 drifted pastes
- `verify-doc-budgets` — wordcount ceilings
- `verify-export-jsdoc` — JSDoc 完整性
- `verify-package-invariants` — 每个包拥有 `./invariant`
- `verify-package-readme-limitations` — Known Limitations section

### 10.3 Host sandbox 失败

**文件**：`AGENTS.md`（Host sandbox failures）

当 required `gh`、`pnpm`、build、test、或 generator commands 因 agent sandbox 阻止 credentials、network、IPC、file watching、或 nested `sandbox-exec` 失败时：
- 用 unchanged 命令 retry with narrowest host escalation
- **before** diagnosing authentication 或 project failure
- Require sandbox evidence；**永不** bypass genuine test failures 或 product sandbox under test

---

## 十一、测试文件组织

### 11.1 测试位置

**文件**：`packages/AGENTS.md`

- Tests live at package level under `tests/`，**不**是 `src/__tests__/`
- Same-package tests import internals directly — relative `../src/client/xxx.ts`
- **永不** widen public API to make test compile

### 11.2 vitest 环境

**文件**：`packages/client/AGENTS.md`

- jsdom environment 来自 per-file `// @vitest-environment jsdom` pragma on spec's first line
- shared config stays node-env

### 11.3 Component specs

- 用 realistic props 或 driven fixture runtime 渲染
- assert user-visible behavior，**不**是 class names、hook internals、render counts

---

## 十二、HMR-safety 测试

### 12.1 Registry disposal

**文件**：`packages/AGENTS.md`

> Registry contributions prove disposal through the HMR-safety test required by testing policy: dispose the fiber and observe removal.

每个 registry 贡献需要测试：
1. 注册贡献
2. dispose contributing fiber
3. assert 贡献已移除

### 12.2 示例

```typescript
test('HMR safety: dispose removes contribution', () => {
  const dispose = ctx.tools.register(myTool)
  expect(ctx.tools.schemas()).toContainEqual(expect.objectContaining({ name: 'my-tool' }))
  dispose()
  expect(ctx.tools.schemas()).not.toContainEqual(expect.objectContaining({ name: 'my-tool' }))
})
```

---

## 十三、Package invariants

### 13.1 每个包拥有 `./invariant`

**文件**：`packages/AGENTS.md`

> Every package owns `./invariant`. Register the manifest name; check an event/data relation or give empty installers package-specific `No runtime invariant:` reasons.

### 13.2 验证

`verify-package-invariants` 门禁：
- 注册 manifest name
- 检查 event/data relation
- 或给出 package-specific `No runtime invariant:` reasons
- Generated companions、unexplained empties、ignored reporters 会 fail

---

## 实战练习

1. **编写 HMR-safety 测试**：为一个工具注册编写 HMR-safety 测试，验证 dispose 后贡献移除。

2. **编写 REAL-composition 测试**：为一个 plugin 编写通过 Loader boot 的 REAL-composition 测试，而非 hand-built `ctx.plugin()`。

3. **编写 snapshot 测试**：为一个 model-visible 行为变更添加 keyless snapshot scenario。

4. **验证 guard**：为一个无 `inject` 的 plugin 添加 `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip assertion，并证明 regression 会 red。

5. **运行本地检查阶梯**：对一个 GUI 改动运行 `pnpm run test:gui`，对 assembled output 改动运行 `DSH_SNAPSHOT=replay pnpm run test:web`。

---

## 关键源码定位

| 内容 | 位置 |
|---|---|
| Testing policy | `docs/testing.md` |
| 五层测试体系 | `docs/testing.md:7-13` |
| With-key 策略 | `docs/testing.md:18-19` |
| Mock 策略 | `docs/testing.md:22-25` |
| 验证世界 | `docs/testing.md:28-29` |
| REAL-composition | `docs/testing.md:33-35` |
| Source plane | `docs/testing.md:39` |
| 子进程启动模式 | `docs/testing.md:43-45` |
| Snapshot 触发条件 | `docs/testing.md:48` |
| Postmortem 0001 | `docs/postmortem/0001-acp-default-export-drops-inject.md` |
| GUI 检查阶梯 | `packages/client/AGENTS.md` |
| HMR-safety | `packages/AGENTS.md` |
| Package invariants | `packages/AGENTS.md` |
| Pre-push checks skill | 主仓 `.agents/skills/dsh-pre-push-checks/SKILL.md` |
| ACP snapshot Agent Note | `.agents/notes/implemented/testing/2026-06-19-acp-snapshot-tests.md` |
| Real-API e2e Agent Note | `.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md` |
| Web e2e lane Agent Note | `.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md` |
| Web browser CI gate | `.agents/notes/implemented/testing/2026-07-30-web-browser-snapshot-ci-gate.md` |
| Contract regressions | `packages/core/agent-loop/tests/contract-regressions.spec.ts` |
| Built smokes | `packages/examples/*/tests/built-bin.e2e.ts` |

---

## 下一步

本文理解了测试体系和 CI 门禁。下一篇 [附录 A · 术语表](/appendix-glossary) 将提供完整术语表。
